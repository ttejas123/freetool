import { useState, useRef, useCallback } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { Upload, Download, Trash2, Eraser, Loader, Sparkles, Settings2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';
import { removeBackground, type Config } from '@imgly/background-removal';

type RemovalMode = 'auto' | 'manual';

export default function RemoveBackground() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [selectedColor, setSelectedColor] = useState<[number, number, number] | null>(null);
  const [removalMode, setRemovalMode] = useState<RemovalMode>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useFilePaste((files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  const handleFile = useCallback((file: File) => {
    setImageUrl(URL.createObjectURL(file));
    setOutputUrl(null);
    setSelectedColor(null);
    setProgress(0);
    setProgressText('');
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

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!imageUrl || removalMode !== 'manual') return;

      const img = e.target as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);

      const newCanvas = document.createElement('canvas');
      newCanvas.width = img.naturalWidth;
      newCanvas.height = img.naturalHeight;
      const ctx = newCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(x, y, 1, 1);
      const data = imageData.data;
      setSelectedColor([data[0], data[1], data[2]]);
    },
    [imageUrl, removalMode]
  );

  const processManual = useCallback(() => {
    if (!imageUrl || !selectedColor) {
      alert('Please click on a background color first');
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    setProgressText('Analyzing pixels...');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const [targetR, targetG, targetB] = selectedColor;

      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate color distance
        const dr = r - targetR;
        const dg = g - targetG;
        const db = b - targetB;
        const distance = Math.sqrt(dr * dr + dg * dg + db * db);

        // Apply threshold - make similar colors transparent
        if (distance <= threshold) {
          const alpha = Math.max(0, Math.min(255, (distance / threshold) * 255));
          data[i + 3] = alpha;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setOutputUrl(URL.createObjectURL(blob));
        }
        setIsProcessing(false);
        setProgress(100);
      }, 'image/png');
    };
    img.src = imageUrl;
  }, [imageUrl, selectedColor, threshold]);

  const processAI = useCallback(async () => {
    if (!imageUrl) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressText('Loading AI model...');

    try {
      const config: Config = {
        publicPath: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'upload'}/wasm/`,
        progress: (key, current, total) => {
          const percentage = Math.round((current / total) * 100);
          setProgress(percentage);
          
          if (key.includes('model')) setProgressText(`Downloading AI model: ${percentage}%`);
          else if (key.includes('compute')) setProgressText(`Analyzing subject: ${percentage}%`);
          else setProgressText(`Processing: ${percentage}%`);
        }
      };

      const resultBlob = await removeBackground(imageUrl, config);
      setOutputUrl(URL.createObjectURL(resultBlob));
      setProgress(100);
      setProgressText('Background removed successfully!');
    } catch (error) {
      console.error('AI background removal failed:', error);
      alert('AI processing failed. Please try "Manual" mode or check your internet connection.');
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl]);

  const startRemoval = () => {
    if (removalMode === 'auto') {
      processAI();
    } else {
      processManual();
    }
  };

  const downloadImage = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = 'background-removed-freetool.png';
    a.click();
  };

  const reset = () => {
    setImageUrl(null);
    setOutputUrl(null);
    setSelectedColor(null);
    setThreshold(50);
    setProgress(0);
    setProgressText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <SEOHelmet
        title="AI Background Remover - Magic Eraser Tool"
        description="Extract subjects from images instantly with AI. Our Magic Eraser automatically removes backgrounds with professional precision. No manual effort required."
      />
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16 px-4">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Version 2.0 Powered by AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Background <span className="text-orange-600">Remover</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            Professional-grade subject extraction. Use AI for automatic "Magic Eraser" results or Manual mode for exact color removal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Workspace */}
          <div className="lg:col-span-8 space-y-6">
            {!imageUrl ? (
              <Card className="p-2 dark:bg-gray-800/40 border-dashed border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-300">
                <div
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-16 text-center cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-10 h-10 text-orange-600 dark:text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload your image</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                    Drag and drop or click to browse. Supports High-res PNG, JPG, and WEBP.
                  </p>
                  <div className="flex justify-center gap-4">
                     <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">PNG</span>
                     <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">JPG</span>
                     <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">WEBP</span>
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
                   {/* Tool Toolbar */}
                   <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-red-400" />
                         <div className="w-2 h-2 rounded-full bg-yellow-400" />
                         <div className="w-2 h-2 rounded-full bg-green-400" />
                         <span className="ml-2 text-xs font-medium text-gray-400 uppercase tracking-widest">Workspace</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setImageUrl(null)}
                          className="h-8 text-[11px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                   </div>

                   <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                      {/* Original Preview */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Source Image</h4>
                          {removalMode === 'manual' && (
                             <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                                <span className="animate-pulse">●</span> Tool Active: Pick Color
                             </div>
                          )}
                        </div>
                        <div className="relative group cursor-crosshair overflow-hidden rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                          <img
                            src={imageUrl}
                            alt="Original"
                            onClick={handleImageClick}
                            className={`w-full max-h-[450px] object-contain transition-transform duration-500 group-hover:scale-[1.02] ${removalMode === 'manual' ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                            style={{ userSelect: 'none' }}
                          />
                        </div>
                      </div>

                      {/* Result Preview */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Result</h4>
                          {outputUrl && (
                             <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md text-[10px] font-bold text-green-600 uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Processed
                             </div>
                          )}
                        </div>
                        
                        <div className="relative min-h-[300px] h-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {outputUrl ? (
                            <div className="relative w-full h-full flex items-center justify-center p-4">
                              <img
                                src={outputUrl}
                                alt="Result"
                                className="max-w-full max-h-[450px] object-contain drop-shadow-2xl"
                                style={{
                                  backgroundImage:
                                    'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
                                  backgroundSize: '20px 20px',
                                  backgroundPosition: '0 0, 10px 10px',
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-900/50">
                              {isProcessing ? (
                                <div className="text-center space-y-4 px-6 w-full">
                                  <div className="relative inline-block">
                                    <div className="w-16 h-16 border-4 border-orange-200 dark:border-orange-900/30 border-t-orange-600 rounded-full animate-spin mx-auto" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{progressText}</p>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[200px] mx-auto">
                                      <div 
                                        className="h-full bg-orange-600 transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">{progress}% Complete</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-8 space-y-3">
                                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto opacity-50">
                                    <Eraser className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-400">
                                    {removalMode === 'auto' 
                                      ? 'Click "Magic Remove" to start AI analysis' 
                                      : 'Select background color on the left to begin'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                   </div>
                </Card>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 dark:bg-gray-800/40 border-none shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Settings2 className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Processor Settings</h3>
              </div>

              {!imageUrl ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">
                    Waiting for image asset…
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Mode Selector */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Processing Engine</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setRemovalMode('auto')}
                        className={`p-3 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${
                          removalMode === 'auto'
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Sparkles className={`w-4 h-4 ${removalMode === 'auto' ? 'text-orange-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold ${removalMode === 'auto' ? 'text-orange-900 dark:text-orange-100' : 'text-gray-500'}`}>Magic AI</span>
                        <span className="text-[9px] text-gray-400">Auto-Detect</span>
                      </button>
                      <button
                        onClick={() => setRemovalMode('manual')}
                        className={`p-3 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${
                          removalMode === 'manual'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Eraser className={`w-4 h-4 ${removalMode === 'manual' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold ${removalMode === 'manual' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-500'}`}>Manual</span>
                        <span className="text-[9px] text-gray-400">Chroma Key</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual Controls */}
                  {removalMode === 'manual' && (
                    <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sensitivity</label>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">{threshold}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="150"
                          value={threshold}
                          onChange={(e) => setThreshold(Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg accent-blue-500 cursor-pointer appearance-none"
                        />
                         <div className="flex justify-between mt-2">
                           <span className="text-[9px] font-bold text-gray-400 uppercase">Strict</span>
                           <span className="text-[9px] font-bold text-gray-400 uppercase">Loose</span>
                         </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Color Target</p>
                        {selectedColor ? (
                          <div className="flex items-center justify-center gap-4">
                            <div
                              className="w-14 h-14 rounded-2xl border-4 border-white dark:border-gray-800 shadow-xl"
                              style={{
                                backgroundColor: `rgb(${selectedColor[0]}, ${selectedColor[1]}, ${selectedColor[2]})`,
                              }}
                            />
                            <div className="text-xs">
                              <p className="text-gray-400 font-medium">RGB VALUES</p>
                              <p className="text-gray-900 dark:text-white font-black">{selectedColor.join(', ')}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-[10px] font-medium text-orange-600 animate-pulse">Click image to sample color</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Info */}
                  {removalMode === 'auto' && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-bold text-orange-900 dark:text-orange-200 uppercase tracking-wider mb-1">AI Smart Extract</p>
                          <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
                            Upload photos of people, products or animals. Our neural engine will automatically segment the subject with high precision.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action CTA */}
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={startRemoval}
                      disabled={isProcessing || (removalMode === 'manual' && !selectedColor)}
                      className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-[2px] shadow-2xl transition-all duration-300 group ${
                        isProcessing 
                          ? 'opacity-80 pointer-events-none' 
                          : removalMode === 'auto'
                            ? 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-[1.02]' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02]'
                      }`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-3">
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Engaging...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {removalMode === 'auto' ? <Sparkles className="w-5 h-5 group-hover:animate-pulse" /> : <Eraser className="w-5 h-5" />}
                          <span>{removalMode === 'auto' ? 'Magic Remove' : 'Clear Background'}</span>
                        </div>
                      )}
                    </Button>

                    {outputUrl && (
                      <Button
                        onClick={downloadImage}
                        className="w-full py-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-[2px] shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                      >
                        <Download className="w-5 h-5" />
                        Download PNG
                      </Button>
                    )}

                    <Button
                      onClick={reset}
                      variant="secondary"
                      className="w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset Workspace
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Support Info */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800">
               <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 100% Client-side
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Private
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Secure
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
