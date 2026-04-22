import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { PlayCircle, FolderUp, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function HLSPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFolder, setHasFolder] = useState(false);
  const [error, setError] = useState<string>('');
  const hlsRef = useRef<Hls | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setError('');
    const fileArray = Array.from(files);
    
    // Find the master m3u8 playlist
    const m3u8File = fileArray.find(f => f.name.endsWith('.m3u8'));
    if (!m3u8File) {
      setError('Could not find a .m3u8 playlist file in the uploaded folder.');
      return;
    }

    // Map all .ts files to Blob URLs
    const tsFileMap: Record<string, string> = {};
    for (const file of fileArray) {
      if (file.name.endsWith('.ts')) {
        // We use just the filename to map, ignoring any nested paths
        const nameOnly = file.name.split('/').pop() || file.name;
        tsFileMap[nameOnly] = URL.createObjectURL(file);
      }
    }

    // Read m3u8 text
    const text = await m3u8File.text();
    
    // Replace all chunk names with their blob URLs
    // Parse line by line to accurately identify .ts entries
    const lines = text.split('\n');
    const newLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.endsWith('.ts')) {
        // This is a chunk filename
        const blobUrl = tsFileMap[trimmed];
        return blobUrl || line; // Fallback to original if not found
      }
      return line;
    });
    const modifiedText = newLines.join('\n');

    // Create a Blob URL for the new M3U8 text
    const newM3u8Blob = new Blob([modifiedText], { type: 'application/vnd.apple.mpegurl' });
    const newM3u8Url = URL.createObjectURL(newM3u8Blob);

    // Initialize HLS.js
    if (Hls.isSupported()) {
      if (hlsRef.current) {
         hlsRef.current.destroy();
      }
      
      const hls = new Hls({
        debug: false,
      });
      hlsRef.current = hls;
      
      hls.loadSource(newM3u8Url);
      if (videoRef.current) {
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => console.log('Autoplay blocked:', e));
          setIsPlaying(true);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setError(`HLS Player Error: ${data.details}`);
          }
        });
      }
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari)
      videoRef.current.src = newM3u8Url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play();
        setIsPlaying(true);
      });
    } else {
      setError('Your browser does not support HLS playback.');
      return;
    }

    setHasFolder(true);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const getFilesFromDataTransfer = async (items: DataTransferItemList): Promise<File[]> => {
    const files: File[] = [];
    const queue: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) queue.push(entry);
        else {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    }
    
    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) continue;
      
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => entry.file(resolve));
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        let currentEntries: any[] = [];
        
        // readEntries might not get all entries at once, usually we have to call it until it returns empty array
        const readAllEntries = async () => {
           let results: any[] = [];
           let read: any[] = [];
           do {
             read = await new Promise<any[]>((resolve) => {
                 reader.readEntries(resolve);
             });
             results = results.concat(read);
           } while (read.length > 0);
           return results;
        };
        const entries = await readAllEntries();
        queue.push(...entries);
      }
    }
    return files;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const files = await getFilesFromDataTransfer(e.dataTransfer.items);
      handleFiles(files);
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const reset = () => {
    if (hlsRef.current) {
       hlsRef.current.destroy();
       hlsRef.current = null;
    }
    setHasFolder(false);
    setIsPlaying(false);
    setError('');
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {!hasFolder && !error ? (
        <div 
          className="w-full bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-16 text-center cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
            <FolderUp className="w-10 h-10 text-blue-600 dark:text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload HLS Folder</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
            Drag and drop your extracted ZIP folder here, or click to select. We will parse the <b>.m3u8</b> playlist and bind all local <b>.ts</b> chunks perfectly into the embedded player.
          </p>
        </div>
      ) : null}

      {error && (
        <div className="w-full p-4 mb-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800 dark:text-red-400 uppercase tracking-widest">Playback Render Error</h4>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={reset} className="ml-auto flex-shrink-0 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200">
             Try Again
          </Button>
        </div>
      )}

      {/* Hidden input configured for directory selection */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onInputChange} 
        className="hidden" 
        {...({ webkitdirectory: "true", mozdirectory: "true", directory: "true" } as any)} 
        multiple 
      />

      <div className={`w-full overflow-hidden rounded-2xl shadow-2xl bg-black relative transition-all duration-500 ${hasFolder ? 'h-auto opacity-100 ring-4 ring-blue-500/20' : 'h-0 opacity-0 pointer-events-none'}`}>
        <video 
          ref={videoRef} 
          controls 
          className="w-full max-h-[600px] object-contain"
          playsInline
        />
        {hasFolder && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 border border-white/10 shadow-lg">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               HLS Direct Stream
            </div>
            
            <Button 
               size="sm" 
               onClick={reset} 
               className="pointer-events-auto bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white"
            >
               <RefreshCcw className="w-4 h-4 mr-2" /> Load Different Folder
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
