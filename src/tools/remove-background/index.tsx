import { useState, useRef, useCallback } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { Upload, Download, Trash2, Eraser, Loader } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

export default function RemoveBackground() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedColor, setSelectedColor] = useState<[number, number, number] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useFilePaste((files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  const handleFile = useCallback((file: File) => {
    setImageUrl(URL.createObjectURL(file));
    setOutputUrl(null);
    setSelectedColor(null);
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
      if (!imageUrl) return;

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
    [imageUrl]
  );

  const removeBackground = useCallback(() => {
    if (!imageUrl || !selectedColor) {
      alert('Please upload an image and click on a background color');
      return;
    }

    setIsProcessing(true);

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
          // Smooth fade based on distance
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
      }, 'image/png');
    };
    img.src = imageUrl;
  }, [imageUrl, selectedColor, threshold]);

  const downloadImage = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = 'background-removed.png';
    a.click();
  };

  const reset = () => {
    setImageUrl(null);
    setOutputUrl(null);
    setSelectedColor(null);
    setThreshold(50);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <SEOHelmet
        title="Remove Background from Image Tool"
        description="Remove image backgrounds with smart color selection. Click on background, adjust sensitivity, and download transparent PNG instantly."
      />
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto transform -rotate-3">
            <Eraser className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Remove Background</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Remove backgrounds from images using smart color selection. Click on the background color and adjust sensitivity for perfect results.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Image Area - Takes 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-4">
            {!imageUrl ? (
              <Card className="p-10 dark:bg-gray-800/50">
                <div
                  className="border-2 border-dashed border-orange-300 dark:border-orange-700/50 rounded-xl p-10 text-center cursor-pointer hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Drop an image or click to upload</p>
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP</p>
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
              <Card className="p-4 dark:bg-gray-800/50">
                <div className="grid grid-cols-2 gap-4">
                  {/* Original */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Original</p>
                    <img
                      src={imageUrl}
                      alt="Original"
                      onClick={handleImageClick}
                      className="w-full rounded-lg object-contain max-h-80 cursor-crosshair hover:opacity-90 transition-opacity"
                      style={{ userSelect: 'none' }}
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center">Click to pick background color</p>
                  </div>

                  {/* Result */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Result</p>
                      {selectedColor && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded border border-gray-400 dark:border-gray-600"
                            style={{
                              backgroundColor: `rgb(${selectedColor[0]}, ${selectedColor[1]}, ${selectedColor[2]})`,
                            }}
                          />
                          <span className="text-xs text-gray-400">{selectedColor[0]}, {selectedColor[1]}, {selectedColor[2]}</span>
                        </div>
                      )}
                    </div>
                    {outputUrl ? (
                      <img
                        src={outputUrl}
                        alt="Result"
                        className="w-full rounded-lg object-contain max-h-80"
                        style={{
                          backgroundColor: '#1a1a1a',
                          backgroundImage:
                            'linear-gradient(45deg, #404040 25%, transparent 25%, transparent 75%, #404040 75%, #404040), linear-gradient(45deg, #404040 25%, transparent 25%, transparent 75%, #404040 75%, #404040)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: '0 0, 10px 10px',
                        }}
                      />
                    ) : (
                      <div className="w-full min-h-80 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-sm text-gray-400">
                        {isProcessing ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader className="w-6 h-6 animate-spin text-orange-500" />
                            Processing…
                          </div>
                        ) : selectedColor ? (
                          'Click "Remove Background" to process'
                        ) : (
                          'Click on original image to select color'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Controls Sidebar - 1 column on desktop, full width on mobile */}
          <div className="space-y-4">
            <Card className="p-5 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>

              {!imageUrl ? (
                <div className="text-center py-8">
                  <Eraser className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Upload an image to get started</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Sensitivity Slider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      <span>Sensitivity</span>
                      <span className="float-right text-orange-600 dark:text-orange-400 font-semibold">{threshold}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg accent-orange-500 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Lower = precise • Higher = forgiving
                    </p>
                  </div>

                  {/* Color Info */}
                  {selectedColor && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Color</p>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-orange-300 dark:border-orange-700"
                          style={{
                            backgroundColor: `rgb(${selectedColor[0]}, ${selectedColor[1]}, ${selectedColor[2]})`,
                          }}
                        />
                        <div className="text-xs">
                          <p className="text-gray-600 dark:text-gray-300">RGB</p>
                          <p className="text-gray-500 dark:text-gray-400">
                            {selectedColor[0]}, {selectedColor[1]}, {selectedColor[2]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Action Buttons */}
            {imageUrl && (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={removeBackground}
                  disabled={!selectedColor || isProcessing}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    selectedColor && !isProcessing
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Eraser className="w-4 h-4" />
                      Remove Background
                    </>
                  )}
                </Button>

                {outputUrl && (
                  <Button
                    onClick={downloadImage}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </Button>
                )}

                <Button
                  onClick={reset}
                  variant="secondary"
                  className="w-full py-3 px-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
