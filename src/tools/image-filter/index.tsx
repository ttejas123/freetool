'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { Upload, Download, Trash2, Wand2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

type Filter = 'halftone' | 'grayscale' | 'dither' | 'sepia' | 'invert' | 'pixelate' | 'posterize' | 'neon';

const FILTERS: { id: Filter; label: string; emoji: string }[] = [
  { id: 'halftone',  label: 'Halftone',   emoji: '◉' },
  { id: 'grayscale', label: 'Grayscale',  emoji: '▓' },
  { id: 'dither',    label: 'Dither',     emoji: '░' },
  { id: 'sepia',     label: 'Sepia',      emoji: '🟫' },
  { id: 'invert',    label: 'Invert',     emoji: '◑' },
  { id: 'pixelate',  label: 'Pixelate',   emoji: '▦' },
  { id: 'posterize', label: 'Posterize',  emoji: '🎨' },
  { id: 'neon',      label: 'Neon Glow',  emoji: '🌟' },
];

function applyFilter(src: HTMLCanvasElement, filter: Filter, strength: number): HTMLCanvasElement {
  const dst = document.createElement('canvas');
  dst.width = src.width;
  dst.height = src.height;
  const ctx = dst.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  const imageData = ctx.getImageData(0, 0, dst.width, dst.height);
  const d = imageData.data;
  const w = dst.width;

  switch (filter) {
    case 'grayscale':
      for (let i = 0; i < d.length; i += 4) {
        const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
        d[i] = d[i+1] = d[i+2] = g;
      }
      break;

    case 'sepia':
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        d[i]   = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i+1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i+2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      break;

    case 'invert':
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i]; d[i+1] = 255 - d[i+1]; d[i+2] = 255 - d[i+2];
      }
      break;

    case 'dither': {
      // Floyd-Steinberg dithering
      const err = new Float32Array(d.length);
      for (let y = 0; y < dst.height; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const old = d[i+c] + err[i+c];
            const nw = old < 128 ? 0 : 255;
            const e = old - nw;
            d[i+c] = nw;
            if (x+1 < w)        err[i+4+c]        += e * 7/16;
            if (y+1 < dst.height) {
              if (x > 0)         err[((y+1)*w+(x-1))*4+c] += e * 3/16;
              err[((y+1)*w+x)*4+c]   += e * 5/16;
              if (x+1 < w)       err[((y+1)*w+(x+1))*4+c] += e * 1/16;
            }
          }
        }
      }
      break;
    }

    case 'halftone': {
      const radius = Math.max(2, Math.floor(strength / 15));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, dst.width, dst.height);
      ctx.fillStyle = '#000';
      for (let y = 0; y < dst.height; y += radius * 2) {
        for (let x = 0; x < w; x += radius * 2) {
          const i = (Math.min(y, dst.height-1) * w + Math.min(x, w-1)) * 4;
          const gray = (d[i] + d[i+1] + d[i+2]) / 3;
          const r2 = radius * (1 - gray / 255);
          ctx.beginPath();
          ctx.arc(x + radius, y + radius, Math.max(0.5, r2), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return dst;
    }

    case 'pixelate': {
      const block = Math.max(2, Math.floor(strength / 10));
      for (let y = 0; y < dst.height; y += block) {
        for (let x = 0; x < w; x += block) {
          const i = (y * w + x) * 4;
          const r = d[i], g = d[i+1], b = d[i+2];
          for (let oy = 0; oy < block && y+oy < dst.height; oy++) {
            for (let ox = 0; ox < block && x+ox < w; ox++) {
              const j = ((y+oy)*w+(x+ox))*4;
              d[j] = r; d[j+1] = g; d[j+2] = b;
            }
          }
        }
      }
      break;
    }

    case 'posterize': {
      const levels = Math.max(2, Math.floor(10 - strength / 15));
      const step = 255 / (levels - 1);
      for (let i = 0; i < d.length; i += 4) {
        d[i]   = Math.round(Math.round(d[i] / step) * step);
        d[i+1] = Math.round(Math.round(d[i+1] / step) * step);
        d[i+2] = Math.round(Math.round(d[i+2] / step) * step);
      }
      break;
    }

    case 'neon':
      for (let i = 0; i < d.length; i += 4) {
        const g2 = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
        d[i]   = g2 > 128 ? 255 : 0;
        d[i+1] = g2 > 64  ? Math.min(255, d[i+1] * 2) : 0;
        d[i+2] = g2 > 96  ? 255 : 0;
      }
      break;
  }

  ctx.putImageData(imageData, 0, 0);
  return dst;
}

export default function ImageFilter() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>('halftone');
  const [strength, setStrength] = useState(50);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const srcCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setOutputUrl(null);
  }, []);

  useFilePaste((files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  const applyEffect = useCallback(() => {
    if (!imageUrl || !srcCanvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = srcCanvasRef.current!;
      c.width = Math.floor(img.width * scale);
      c.height = Math.floor(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      const result = applyFilter(c, activeFilter, strength);
      result.toBlob(blob => {
        if (blob) setOutputUrl(URL.createObjectURL(blob));
      }, 'image/png');
    };
    img.src = imageUrl;
  }, [imageUrl, activeFilter, strength]);

  useEffect(() => { 
    if (imageUrl) applyEffect(); 
  }, [imageUrl, applyEffect]);

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="Image Filter Tool — Halftone, Dither, Grayscale & More"
        description="Apply stunning visual filters to images: halftone, dithering, pixelate, posterize, neon glow and more — entirely in your browser."
      />

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mx-auto transform rotate-2">
          <Wand2 className="w-8 h-8 text-pink-600 dark:text-pink-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Image Filter</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Apply halftone, dither, neon glow and 5 more stunning effects to any image — entirely in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Upload */}
          {!imageUrl ? (
            <Card className="p-10 dark:bg-gray-800/50">
              <div
                className="border-2 border-dashed border-pink-300 dark:border-pink-700/50 rounded-xl p-8 text-center cursor-pointer hover:bg-pink-50/50 dark:hover:bg-pink-900/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={e => { 
                  e.preventDefault(); 
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file); 
                }}
                onDragOver={e => e.preventDefault()}
              >
                <Upload className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">Drop an image or click to upload</p>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </Card>
          ) : (
            <Card className="p-4 dark:bg-gray-800/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">Original</p>
                  <img src={imageUrl} alt="Original" className="w-full rounded-lg object-contain max-h-72" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">{FILTERS.find(f => f.id === activeFilter)?.label}</p>
                  {outputUrl
                    ? <img src={outputUrl} alt="Filtered" className="w-full rounded-lg object-contain max-h-72" />
                    : <div className="w-full min-h-32 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
            <div className="grid grid-cols-2 gap-2">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setActiveFilter(f.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeFilter === f.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20'}`}>
                  <span className="text-base">{f.emoji}</span> {f.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Strength: {strength}%
              </label>
              <input type="range" min="10" max="100" value={strength} onChange={e => setStrength(+e.target.value)}
                className="w-full accent-pink-500" />
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            {outputUrl && (
              <a href={outputUrl} download="filtered.png"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold transition-colors">
                <Download className="w-4 h-4" /> Download PNG
              </a>
            )}
            {imageUrl && (
              <Button variant="secondary" onClick={() => { setImageUrl(null); setOutputUrl(null); }} className="w-full gap-2 text-red-500">
                <Trash2 className="w-4 h-4" /> Clear
              </Button>
            )}
            {!imageUrl && <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>Upload Image</Button>}
          </div>
        </div>
      </div>

      <canvas ref={srcCanvasRef} className="hidden" />
    </div>
  );
}
