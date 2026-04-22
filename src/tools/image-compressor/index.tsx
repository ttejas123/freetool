'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { 
  Upload, 
  Download, 
  Trash2, 
  Zap, 
  Loader, 
  Settings2, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon,
  Smartphone,
  Mail,
  Grid,
  Monitor
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';
import { supabase } from '@/lib/supabase';
import { formatBytes, calculateReduction, PRESETS, type CompressionSettings } from './utils';

export default function ImageCompressor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [_, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<CompressionSettings>({
    targetSizeKB: 200,
    format: 'auto',
    autoOptimize: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Cleanup worker on unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useFilePaste((files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  const handleFile = useCallback((file: File) => {
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    setCompressedUrl(null);
    setCompressedSize(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    setSettings(prev => ({ ...prev, ...PRESETS[presetName] }));
  };

  const compressImage = async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    setProgress(20);
    setError(null);

    // Fallback to Edge Function if > 5MB
    if (originalFile.size > 5 * 1024 * 1024) {
      handleEdgeCompression();
      return;
    }

    try {
      // Create Web Worker
      const worker = new Worker(new URL('./compression.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      const imageBitmap = await createImageBitmap(originalFile);
      
      worker.postMessage({
        imageBitmap,
        settings: {
          ...settings,
          width: settings.width || imageBitmap.width,
          height: settings.height || imageBitmap.height
        }
      }, [imageBitmap]);

      worker.onmessage = (e) => {
        const { success, blob, size, error: workerError } = e.data;
        if (success) {
          setCompressedUrl(URL.createObjectURL(blob));
          setCompressedSize(size);
          setProgress(100);
        } else {
          setError(workerError || 'Compression failed');
        }
        setIsProcessing(false);
        worker.terminate();
      };

    } catch (err: any) {
      setError(err.message || 'Processing error');
      setIsProcessing(false);
    }
  };

  const handleEdgeCompression = async () => {
    if (!originalFile) return;
    
    setProgress(30);
    const formData = new FormData();
    formData.append('file', originalFile);
    formData.append('targetSizeKB', settings.targetSizeKB.toString());
    formData.append('format', settings.format);
    if (settings.width) formData.append('width', settings.width.toString());
    if (settings.height) formData.append('height', settings.height.toString());

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('image-c', {
        body: formData,
      });

      if (invokeError) throw invokeError;

      if (data) {
        setCompressedUrl(URL.createObjectURL(data));
        setCompressedSize(data.size);
        setProgress(100);
      }
    } catch (err: any) {
      setError(`Edge optimization failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!compressedUrl) return;
    const a = document.createElement('a');
    a.href = compressedUrl;
    const ext = settings.format === 'auto' ? 'webp' : settings.format;
    a.download = `compressed-${originalFile?.name.split('.')[0]}.${ext}`;
    a.click();
  };

  const reset = () => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setCompressedUrl(null);
    setCompressedSize(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <SEOHelmet
        title="Image Compressor - Optimize for Web"
        description="Compress JPG, PNG, and WebP images to a target file size. Fast, secure, and running entirely in your browser."
      />
      <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16 px-4 font-sans">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold tracking-wider uppercase mb-2">
            <Zap className="w-3 h-3" />
            <span>Smart Optimization Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Image <span className="text-blue-600">Compressor</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 w-full mx-auto text-lg">
            Squeeze your images without losing the magic. Target specific file sizes or use one-click presets.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {!originalUrl ? (
              <Card className="p-2 dark:bg-gray-800/40 border-dashed border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300">
                <div
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-16 text-center cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-10 h-10 text-blue-600 dark:text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Drop your image here</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                    Or click to browse from your device.
                  </p>
                  <div className="flex justify-center gap-4">
                     <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">WEBP</span>
                     <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">JPG</span>
                     <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">PNG</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="overflow-hidden bg-gray-50 dark:bg-gray-900/40 border-none shadow-2xl">
                   <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-red-400" />
                         <div className="w-2 h-2 rounded-full bg-yellow-400" />
                         <div className="w-2 h-2 rounded-full bg-green-400" />
                         <span className="ml-2 text-xs font-medium text-gray-400 uppercase tracking-widest">Preview Workspace</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={reset}
                        className="h-8 text-[11px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                      </Button>
                   </div>

                   <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Original */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Original</h4>
                          <span className="text-xs font-bold text-gray-500">{formatBytes(originalFile?.size || 0)}</span>
                        </div>
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <img src={originalUrl} alt="Original" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      {/* Result */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Compressed</h4>
                          {compressedSize && (
                            <span className="text-xs font-bold text-green-600">
                              {formatBytes(compressedSize)} ({calculateReduction(originalFile?.size || 0, compressedSize).toFixed(1)}% smaller)
                            </span>
                          )}
                        </div>
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center">
                          {compressedUrl ? (
                            <img src={compressedUrl} alt="Compressed" className="w-full h-full object-contain" />
                          ) : (
                            <div className="text-center p-8 space-y-3">
                              {isProcessing ? (
                                <div className="space-y-4">
                                  <Loader className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest animate-pulse">Processing...</p>
                                </div>
                              ) : (
                                <>
                                  <ImageIcon className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto" />
                                  <p className="text-xs font-medium text-gray-400">Click "Optimize Image" to begin</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                   </div>
                </Card>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 dark:bg-gray-800/40 border-none shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Settings2 className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Optimization Panel</h3>
              </div>

              {!originalFile ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">
                    Upload an image to unlock controls
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Presets */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => applyPreset('whatsapp')} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left flex items-center gap-3 group">
                         <Smartphone className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                         <span className="text-xs font-bold text-gray-600 dark:text-gray-400 italic group-hover:not-italic group-hover:text-blue-700 dark:group-hover:text-blue-300">WhatsApp</span>
                       </button>
                       <button onClick={() => applyPreset('email')} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left flex items-center gap-3 group">
                         <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                         <span className="text-xs font-bold text-gray-600 dark:text-gray-400 italic group-hover:not-italic group-hover:text-blue-700 dark:group-hover:text-blue-300">Email</span>
                       </button>
                       <button onClick={() => applyPreset('thumbnail')} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left flex items-center gap-3 group">
                         <Grid className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                         <span className="text-xs font-bold text-gray-600 dark:text-gray-400 italic group-hover:not-italic group-hover:text-blue-700 dark:group-hover:text-blue-300">Thumbnail</span>
                       </button>
                       <button onClick={() => applyPreset('hd')} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left flex items-center gap-3 group">
                         <Monitor className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                         <span className="text-xs font-bold text-gray-600 dark:text-gray-400 italic group-hover:not-italic group-hover:text-blue-700 dark:group-hover:text-blue-300">HD (1080p)</span>
                       </button>
                    </div>
                  </div>

                  {/* Manual Settings */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="target-size" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Size</label>
                        <span className="text-xs font-black text-blue-600">{settings.targetSizeKB} KB</span>
                      </div>
                      <input
                        id="target-size"
                        type="range"
                        min="10"
                        max="2000"
                        step="10"
                        value={settings.targetSizeKB}
                        onChange={(e) => setSettings({ ...settings, targetSizeKB: Number(e.target.value) })}
                        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg accent-blue-600 appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="format-select" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Format</label>
                        <select
                          id="format-select"
                          value={settings.format}
                          onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="auto">Auto (Best)</option>
                          <option value="webp">WebP</option>
                          <option value="jpeg">JPEG</option>
                          <option value="png">PNG</option>
                        </select>
                      </div>
                      <div className="space-y-2 text-right">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Smart Mode</label>
                         <button 
                            onClick={() => setSettings({...settings, autoOptimize: !settings.autoOptimize})}
                            className={`w-full p-2 rounded-lg text-xs font-bold border transition-all ${settings.autoOptimize ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-400 border-gray-200 dark:border-gray-700'}`}
                         >
                            {settings.autoOptimize ? 'Enabled' : 'Disabled'}
                         </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-6">
                    <Button
                      onClick={compressImage}
                      disabled={isProcessing}
                      className="w-full py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[2px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-3">
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Compressing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          <span>Optimize Image</span>
                        </div>
                      )}
                    </Button>

                    {compressedUrl && (
                      <Button
                        onClick={downloadImage}
                        className="w-full py-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-[2px] shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                      >
                        <Download className="w-5 h-5" />
                        Download {settings.format === 'auto' ? 'WebP' : settings.format.toUpperCase()}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
               <h4 className="text-[10px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <CheckCircle2 className="w-3.5 h-3.5" /> High Performance
               </h4>
               <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                 We use **OffscreenCanvas** and **Web Workers** to ensure your browser stays responsive even while processing large images.
               </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
