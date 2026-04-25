import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import JSZip from 'jszip';

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');

  const load = useCallback(async () => {
    if (isLoaded || ffmpegRef.current) return;
    setStatus('Loading video transcoder engine...');
    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;
    
    ffmpeg.on('progress', ({ progress, time }) => {
      // Progress from 0 to 1
      setProgress(Math.round((progress >= 0 && progress <= 1) ? progress * 100 : 0));
    });

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    // In a browser environment without SharedArrayBuffer (typical Next.js static export), 
    // we use the single-thread core to ensure compatibility.
    // We load explicitly from UNPKG to bypass complex Next.js module resolutions.
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    setIsLoaded(true);
    setStatus('Ready');
  }, [isLoaded]);

  const convertToHLS = async (file: File, duration: number, chunks: number, resolution: string): Promise<Blob> => {
    if (!ffmpegRef.current) await load();
    const ffmpeg = ffmpegRef.current!;

    setProgress(0);
    setStatus('Reading file into memory...');
    
    // Write the actual file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));

    // Calculate segment time precisely (minimum 1 second)
    const segmentTime = Math.max(1, Math.ceil(duration / chunks));

    // Map resolution scale
    let scaleFilter = '';
    switch (resolution) {
      case '4k': scaleFilter = 'scale=-2:2160'; break;
      case '1080p': scaleFilter = 'scale=-2:1080'; break;
      case '720p': scaleFilter = 'scale=-2:720'; break;
      case '480p': scaleFilter = 'scale=-2:480'; break;
      case '360p': scaleFilter = 'scale=-2:360'; break;
      case '240p': scaleFilter = 'scale=-2:240'; break;
      case 'original': 
      default: scaleFilter = ''; break;
    }

    setStatus(`Transcoding video (this may take a while)...`);
    
    const ffmpegArgs = [
      '-i', 'input.mp4',
    ];
    
    if (scaleFilter) {
      ffmpegArgs.push('-vf', scaleFilter);
    }
    
    // Setup HLS conversion arguments
    ffmpegArgs.push(
       '-c:a', 'aac',    // re-encode audio to AAC
       '-ar', '48000',
       '-b:a', '128k',
       '-c:v', 'libx264', // re-encode video to H264
       '-profile:v', 'main',
       '-crf', '20',
       '-g', '48',        // keyframe interval
       '-keyint_min', '48',
       '-sc_threshold', '0',
       '-hls_time', segmentTime.toString(),
       '-hls_playlist_type', 'vod',
       '-hls_segment_filename', 'chunk_%03d.ts',
       'output.m3u8'
    );

    // Execute the command in the virtual FS
    await ffmpeg.exec(ffmpegArgs);

    setStatus('Zipping results...');
    
    const zip = new JSZip();
    
    // Read the generated m3u8 playlist file
    let m3u8Data: Uint8Array | string;
    try {
      m3u8Data = await ffmpeg.readFile('output.m3u8');
    } catch (e) {
      throw new Error('HLS conversion failed: output.m3u8 not generated.');
    }
    
    const m3u8Text = new TextDecoder().decode(m3u8Data as Uint8Array);
    zip.file('output.m3u8', m3u8Text);

    // Find all referenced .ts chunks inside the m3u8 text
    const tsFiles = m3u8Text.match(/chunk_\d+\.ts/g) || [];
    const uniqueTsFiles = [...new Set(tsFiles)];

    // Read every chunk and add to ZIP
    for (const ts of uniqueTsFiles) {
      try {
         const tsData = await ffmpeg.readFile(ts);
         zip.file(ts, tsData);
         
         // Clean up memory as we zip
         await ffmpeg.deleteFile(ts);
      } catch (e) {
         console.error('Failed reading chunk:', ts, e);
      }
    }
    
    setStatus('Finalizing ZIP archive...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Clean up residual files
    try { await ffmpeg.deleteFile('input.mp4'); } catch (_e) {
      // eslint-disable-next-line no-empty
    }
    try { await ffmpeg.deleteFile('output.m3u8'); } catch (_e) {
      // eslint-disable-next-line no-empty
    }
    
    setStatus('Ready');
    setProgress(100);
    
    return zipBlob;
  };

  return { load, isLoaded, progress, status, convertToHLS, setStatus };
}
