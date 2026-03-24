import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Trash2, Grid3x3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

type Palette = 'original' | 'gameboy' | 'c64' | 'nes' | 'mono' | 'pastel';

const PALETTES: Record<Exclude<Palette, 'original'>, number[][]> = {
  gameboy: [[15,56,15],[48,98,48],[139,172,15],[155,188,15]],
  c64: [[0,0,0],[255,255,255],[136,0,0],[170,255,238],[204,68,204],[0,204,85],[0,0,170],[238,238,119],[221,136,85],[102,68,0],[255,119,119],[51,51,51],[119,119,119],[170,255,102],[0,136,255],[187,187,187]],
  nes: [[124,124,124],[0,0,252],[0,0,188],[68,40,188],[148,0,132],[168,0,32],[168,16,0],[136,20,0],[80,48,0],[0,120,0],[0,104,0],[0,88,0],[0,64,88],[0,0,0],[252,252,252],[60,188,252]],
  mono: [[0,0,0],[255,255,255]],
  pastel: [[255,179,186],[255,223,186],[255,255,186],[186,255,201],[186,225,255],[218,186,255]],
};

function nearestColor(r: number, g: number, b: number, palette: number[][]): [number,number,number] {
  let best = palette[0], bestDist = Infinity;
  for (const p of palette) {
    const d = (r-p[0])**2 + (g-p[1])**2 + (b-p[2])**2;
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return [best[0], best[1], best[2]];
}

export default function PixelArt() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [blockSize, setBlockSize] = useState(8);
  const [palette, setPalette] = useState<Palette>('original');
  const [outline, setOutline] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setImageUrl(URL.createObjectURL(file));
    setOutputUrl(null);
  }, []);

  const generate = useCallback(() => {
    if (!imageUrl) return;
    setIsProcessing(true);
    const img = new Image();
    img.onload = () => {
      const MAX = 512;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const srcW = Math.floor(img.width * scale);
      const srcH = Math.floor(img.height * scale);

      // Sample at pixel-art resolution
      const pixW = Math.floor(srcW / blockSize);
      const pixH = Math.floor(srcH / blockSize);

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = pixW; srcCanvas.height = pixH;
      const srcCtx = srcCanvas.getContext('2d')!;
      srcCtx.drawImage(img, 0, 0, pixW, pixH);
      const src = srcCtx.getImageData(0, 0, pixW, pixH);

      // Draw upscaled pixel art
      const dstCanvas = document.createElement('canvas');
      dstCanvas.width = pixW * blockSize;
      dstCanvas.height = pixH * blockSize;
      const dstCtx = dstCanvas.getContext('2d')!;
      dstCtx.imageSmoothingEnabled = false;

      const pal = palette !== 'original' ? PALETTES[palette] : null;

      for (let y = 0; y < pixH; y++) {
        for (let x = 0; x < pixW; x++) {
          const i = (y * pixW + x) * 4;
          let r = src.data[i], g = src.data[i+1], b = src.data[i+2];

          if (pal) {
            [r, g, b] = nearestColor(r, g, b, pal);
          }

          dstCtx.fillStyle = `rgb(${r},${g},${b})`;
          dstCtx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

          if (outline) {
            dstCtx.strokeStyle = 'rgba(0,0,0,0.15)';
            dstCtx.lineWidth = 0.5;
            dstCtx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
          }
        }
      }

      dstCanvas.toBlob(blob => {
        if (blob) setOutputUrl(URL.createObjectURL(blob));
        setIsProcessing(false);
      });
    };
    img.src = imageUrl;
  }, [imageUrl, blockSize, palette, outline]);

  const PALETTE_LABELS: Record<Palette, string> = {
    original: 'Original',  gameboy: 'Game Boy',
    c64: 'C64',            nes: 'NES',
    mono: 'Mono',          pastel: 'Pastel',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="Pixel Art Generator — Convert Photos to Pixel Art"
        description="Transform any photo into stunning pixel art with retro color palettes like Game Boy, NES, and C64. Free and browser-based."
      />

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
          <Grid3x3 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Pixel Art Generator</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Convert photos into retro pixel art with classic palettes like Game Boy, NES, and C64.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!imageUrl ? (
            <Card className="p-10 dark:bg-gray-800/50">
              <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 rounded-xl p-10 text-center cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}>
                <Upload className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">Drop an image or click to upload</p>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP supported</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </Card>
          ) : (
            <Card className="p-4 dark:bg-gray-800/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">Original</p>
                  <img src={imageUrl} alt="Original" className="w-full rounded-lg object-contain max-h-72" style={{ imageRendering: 'auto' }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">Pixel Art</p>
                  {outputUrl
                    ? <img src={outputUrl} alt="Pixel Art" className="w-full rounded-lg object-contain max-h-72" style={{ imageRendering: 'pixelated' }} />
                    : <div className="w-full min-h-32 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-sm text-gray-400">
                        {isProcessing ? 'Processing…' : 'Configure & click Generate'}
                      </div>
                  }
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>

            <div className="space-y-5">
              {/* Pixel size */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Pixel Size: {blockSize}px
                </label>
                <input type="range" min="2" max="32" value={blockSize} onChange={e => setBlockSize(+e.target.value)}
                  className="w-full accent-emerald-500" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Fine</span><span>Chunky</span>
                </div>
              </div>

              {/* Palette */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Color Palette</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(PALETTE_LABELS) as Palette[]).map(p => (
                    <button key={p} onClick={() => setPalette(p)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${palette === p ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                      {PALETTE_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outline toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-6 rounded-full transition-colors relative ${outline ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                  onClick={() => setOutline(o => !o)}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${outline ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Grid outline</span>
              </label>

              <Button onClick={generate} disabled={!imageUrl || isProcessing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {isProcessing ? 'Generating…' : 'Generate Pixel Art'}
              </Button>

              {outputUrl && (
                <a href={outputUrl} download="pixel-art.png"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" /> Download PNG
                </a>
              )}

              {imageUrl && (
                <Button variant="secondary" onClick={() => { setImageUrl(null); setOutputUrl(null); }} className="w-full gap-2 text-red-500">
                  <Trash2 className="w-4 h-4" /> Clear
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
