'use client';

import { useState, useRef, useEffect } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { ImagePlay, Upload, Download, Trash2, Settings, Loader2 } from 'lucide-react';
// @ts-ignore
import GIF from 'gif.js';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

interface ImageItem {
  id: string;
  url: string;
  file: File;
}

export default function ImageToGif() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [delay, setDelay] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImages = (files: File[] | FileList) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length > 0) {
      const newImages = fileArray.map((file) => ({
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file),
        file,
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  useFilePaste((files) => {
    addImages(files);
  });

  useEffect(() => {
    // Cleanup generated object URLs
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImages(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string, url: string) => {
    URL.revokeObjectURL(url);
    setImages(images.filter(img => img.id !== id));
  };

  const generateGif = async () => {
    if (images.length === 0) return;
    
    setIsGenerating(true);
    setProgress(0);
    setGifUrl(null);

    try {
      // Use the CDN worker to avoid local build config issues for the worker.
      const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
        width: 500, // Fixed width for simplicity, could be dynamic
      });

      // Load all images
      const loadedImages = await Promise.all(
        images.map(img => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = img.url;
          });
        })
      );

      // Add frames
      loadedImages.forEach(img => {
        // Create a canvas to normalize sizes
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        // Keep aspect ratio based on 500px width
        const scale = 500 / img.width;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          gif.addFrame(canvas, { delay, copy: true });
        }
      });

      gif.on('progress', (p: number) => {
        setProgress(Math.round(p * 100));
      });

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        setGifUrl(url);
        setIsGenerating(false);
      });

      gif.render();
    } catch (err) {
      console.error('Error generating GIF:', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet 
        title="Images to GIF Converter | Free Online Animator"
        description="Convert multiple images into an animated GIF. Fast, free, and completely client-side. No data leaves your browser."
      />

      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-brand-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
          <ImagePlay className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          Images to GIF
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
          Upload your sequence of images to securely generate an animated GIF right in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card className="p-6 border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                Click to upload images
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, WEBP (Max 5MB each)
              </p>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Selected Images ({images.length})</h3>
                  <Button variant="secondary" size="sm" onClick={() => setImages([])} className="text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/30">
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square">
                      <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img.id, img.url);
                          }}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="col-span-1 space-y-6">
          <Card className="p-6 border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-brand-500" />
              Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Delay between frames (ms)
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="100" 
                    max="2000" 
                    step="100" 
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                  <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300 w-16 text-center">
                    {delay}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={generateGif} 
                  disabled={images.length < 2 || isGenerating}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating ({progress}%)
                    </>
                  ) : (
                    'Generate GIF'
                  )}
                </Button>
                {images.length < 2 && (
                  <p className="text-xs text-orange-500 mt-2 text-center">
                    Add at least 2 images to create a GIF
                  </p>
                )}
              </div>
            </div>
          </Card>

          {gifUrl && (
            <Card className="p-6 border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Ready to download!
              </h3>
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4 bg-gray-100 dark:bg-gray-900 min-h-[150px] flex items-center justify-center">
                <img src={gifUrl} alt="Generated GIF" className="max-w-full h-auto object-contain max-h-[250px]" />
              </div>
              <a 
                href={gifUrl} 
                download="animated.gif" 
                className="flex items-center justify-center w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download GIF
              </a>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
