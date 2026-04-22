'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Film, FileArchive, Settings2, Sparkles, Loader, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';
import { useFFmpeg } from './useFFmpeg';
import { HLSPlayer } from './HLSPlayer';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function MP4ToHLSConverter() {
  const { load, isLoaded, progress, status, convertToHLS, setStatus } = useFFmpeg();
  
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [chunks, setChunks] = useState<number>(10);
  const [resolution, setResolution] = useState<string>('original');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-load WebAssembly when component mounts
  // useEffect(() => { load(); }, [load]);

  const handleFile = useCallback((selectedFile: File) => {
    setError('');
    
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please upload a valid video file (MP4).');
      return;
    }
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is 100MB. Your file is ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB. Transcoding large files in browser memory may crash the tab.`);
      return;
    }

    // Determine duration using a headless video element
    const videoURL = URL.createObjectURL(selectedFile);
    const videoObj = document.createElement('video');
    videoObj.src = videoURL;
    videoObj.onloadedmetadata = () => {
      setDuration(videoObj.duration);
      URL.revokeObjectURL(videoURL);
      setFile(selectedFile);
      setOutputBlob(null);
    };
    videoObj.onerror = () => {
      setError('Could not decode the video metadata. It might be corrupted.');
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const processVideo = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError('');
      const zipBlob = await convertToHLS(file, duration, chunks, resolution);
      setOutputBlob(zipBlob);
    } catch (e: any) {
      setError('Conversion failed: ' + (e.message || String(e)));
      setStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadZip = () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hls_stream_${Date.now()}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const reset = () => {
    setFile(null);
    setOutputBlob(null);
    setError('');
    setIsProcessing(false);
    setStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <SEOHelmet
        title="MP4 to HLS Converter - Transcode Videos to m3u8 Locally"
        description="Convert your MP4 videos into scalable HTTP Live Streaming (HLS) chunks with m3u8 playlists using powerful WebAssembly offline. Instantly preview with our embedded HLS player."
      />
      
      <div className="w-full mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16 px-4">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold tracking-wider uppercase mb-2 border border-blue-200 dark:border-blue-800">
            <Film className="w-3 h-3" />
            <span>Browser-Based Transcoder</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            Advanced <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">HLS Converter</span> & Player
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Chunk big MP4 files into robust HTTP Live Streams (.m3u8). Processes completely offline via WebAssembly, guaranteeing zero latency. Upload constrained securely to 100MB to preserve browser stability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Workspace */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-gray-800 rounded-3xl">
              
              <div className="p-4 bg-gray-50 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                       <div className="w-3 h-3 rounded-full bg-red-400" />
                       <div className="w-3 h-3 rounded-full bg-yellow-400" />
                       <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Video Processing Engine</span>
                 </div>
                 {file && (
                   <Button variant="secondary" size="sm" onClick={reset} className="h-8 text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                      Reset Environment
                   </Button>
                 )}
              </div>

              <div className="p-8">
                {error && (
                  <div className="mb-6 w-full p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-400 uppercase tracking-widest">Processing Error</h4>
                      <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {!file ? (
                  <div
                    className="w-full bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-16 text-center cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                      <Upload className="w-10 h-10 text-blue-600 dark:text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload MP4 Video</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                      Drag and drop limits fixed strictly to <b>100MB</b> protecting localized WASM memory allocations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                       <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
                          <Film className="w-10 h-10" />
                       </div>
                       <div className="flex-1 w-full space-y-2 text-center md:text-left">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{file.name}</h3>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-gray-500">
                             <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md uppercase tracking-wider">{file.type || 'MP4'}</span>
                             <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                             <span className="flex items-center text-blue-600 dark:text-blue-400"><PlayCircle className="w-3.5 h-3.5 mr-1" /> {Math.round(duration)} Seconds Duration</span>
                          </div>
                       </div>
                    </div>

                    {isProcessing && (
                      <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 text-center space-y-5">
                         <div className="relative inline-block">
                           <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
                           <div className="absolute inset-0 flex items-center justify-center">
                             <Settings2 className="w-6 h-6 text-blue-500 animate-pulse" />
                           </div>
                         </div>
                         <div className="space-y-3 max-w-md mx-auto">
                           <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider">{status || 'Initializing Engine...'}</h4>
                           <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                             <div 
                               className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out relative"
                               style={{ width: `${progress}%` }}
                             >
                               <div className="absolute inset-0 bg-white/20 animate-pulse" />
                             </div>
                           </div>
                           <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{progress}% COMPLETED</p>
                         </div>
                      </div>
                    )}

                    {outputBlob && (
                      <div className="p-8 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 text-center space-y-6">
                         <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/10">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                         </div>
                         <div className="space-y-2">
                           <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Conversion Successful!</h3>
                           <p className="text-sm text-green-600 dark:text-green-400">Your video has been segmented perfectly. Download the ZIP, extract it, and try out the player tool below!</p>
                         </div>
                         <Button 
                           onClick={downloadZip}
                           className="w-full py-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-[2px] shadow-lg shadow-green-500/20 group"
                         >
                           <FileArchive className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                           Download HLS Stream (ZIP)
                         </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hidden input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </Card>

            {/* HLS Player Implementation */}
            <div className="pt-8">
               <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-inner">
                     <PlayCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Payload Testing</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Validate extracted HLS streams instantly inside your browser.</p>
                  </div>
               </div>
               
               <Card className="p-8 border-none shadow-xl bg-white dark:bg-gray-800 rounded-3xl">
                  <HLSPlayer />
               </Card>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 border-none shadow-xl bg-white dark:bg-gray-800 rounded-3xl">
              <div className="flex items-center gap-3 mb-8">
                <Settings2 className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-sm">Transcode Rules</h3>
              </div>

              {!file ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic leading-relaxed">
                    Awaiting source video to configure encoding vectors.
                  </p>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  
                  {/* Resolution Selector */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Output Resolution</label>
                    <select 
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      disabled={isProcessing}
                      className="w-full flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white ring-offset-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="original">Original Size (No Scaling)</option>
                      <option value="4k">4K Ultra HD (2160p)</option>
                      <option value="1080p">High Definition (1080p)</option>
                      <option value="720p">Standard HD (720p)</option>
                      <option value="480p">Standard (480p)</option>
                      <option value="360p">Low Bandwidth (360p)</option>
                      <option value="240p">Minimum Quality (240p)</option>
                    </select>
                  </div>

                  {/* Chunks Selector */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Chunks</label>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">{chunks}</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={chunks}
                        onChange={(e) => setChunks(Number(e.target.value))}
                        disabled={isProcessing}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg accent-blue-500 cursor-pointer appearance-none disabled:opacity-50"
                      />
                      <div className="flex justify-between mt-2 px-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">2 Chunks</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">30 Chunks</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Calculated Segment</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                         ~{Math.max(1, Math.ceil(duration / chunks))} <span className="text-sm font-medium text-gray-500">sec/chunk</span>
                      </p>
                    </div>
                  </div>

                  {/* Execution Button */}
                  <Button
                    onClick={processVideo}
                    disabled={isProcessing || !!outputBlob}
                    className="w-full py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[2px] shadow-xl shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Loader className="w-5 h-5 animate-spin" /> Transcoding Matrix...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> Start Processing
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </Card>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-900 border border-blue-100 dark:border-gray-800 rounded-3xl">
              <h4 className="text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-3">Notice on 4K Resolutions</h4>
              <p className="text-xs font-medium text-blue-900/70 dark:text-gray-400 leading-relaxed">
                Operating high-density transcode loops (like upgrading significantly to 4K resolutions locally) enforces immense mathematical pressure on your browser window. For long tracks, expect massive processor latency unless scaling parameters down. 
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
