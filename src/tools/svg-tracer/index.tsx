import { useState, useRef, useCallback } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { Upload, Download, ScanLine, Trash2, Sliders } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

type ColorMode = '1' | '2' | '4' | '8' | '16';
type SmoothMode = 'none' | 'low' | 'high';

function imageToSvg(
  canvas: HTMLCanvasElement,
  colors: number,
  threshold: number,
  smooth: SmoothMode,
): string {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;

  // Build a simplified contour-based SVG using color quantization
  const palette: string[] = [];
  const blocks: string[] = [];

  const blockW = smooth === 'none' ? 1 : smooth === 'low' ? 2 : 4;

  for (let y = 0; y < height; y += blockW) {
    for (let x = 0; x < width; x += blockW) {
      const i = (y * width + x) * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
      if (a < threshold) continue;

      // Quantize color
      const step = Math.floor(256 / colors);
      const qr = Math.round(r / step) * step;
      const qg = Math.round(g / step) * step;
      const qb = Math.round(b / step) * step;
      const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`;
      if (!palette.includes(hex)) palette.push(hex);

      blocks.push(`<rect x="${x}" y="${y}" width="${blockW}" height="${blockW}" fill="${hex}"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>Traced Image</title>
  ${blocks.join('\n  ')}
</svg>`;
}

export default function SvgTracer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorMode>('4');
  const [threshold, setThreshold] = useState(128);
  const [smooth, setSmooth] = useState<SmoothMode>('low');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useFilePaste((files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setSvgOutput(null);
    setSvgDataUrl(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const trace = useCallback(() => {
    if (!imageUrl || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      // Scale down large images for performance
      const MAX = 600;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const svg = imageToSvg(canvas, parseInt(colors), threshold, smooth);
      setSvgOutput(svg);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      setSvgDataUrl(URL.createObjectURL(blob));
      setIsProcessing(false);
    };
    img.src = imageUrl;
  }, [imageUrl, colors, threshold, smooth]);

  const download = () => {
    if (!svgOutput) return;
    const a = document.createElement('a');
    a.href = svgDataUrl!;
    a.download = 'traced.svg';
    a.click();
  };

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="SVG Tracer — Bitmap to Vector Converter"
        description="Convert PNG and JPG images to scalable SVG vector files instantly in your browser. No upload needed."
      />

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto transform -rotate-3">
          <ScanLine className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">SVG Tracer</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Convert bitmap images (PNG/JPG) into scalable SVG vector format entirely in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload & Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 dark:bg-gray-800/50">
            <div
              className="border-2 border-dashed border-violet-300 dark:border-violet-700/50 rounded-xl p-8 text-center hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              {imageUrl ? (
                <div className="space-y-3">
                  <img src={imageUrl} alt="Source" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">Click to change image</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Drop image here or click to upload</p>
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP supported</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </Card>

          {svgOutput && (
            <Card className="p-6 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-violet-500" /> SVG Preview
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center min-h-48" dangerouslySetInnerHTML={{ __html: svgOutput }} />
            </Card>
          )}
        </div>

        {/* Right: Controls */}
        <div className="space-y-4">
          <Card className="p-6 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
              <Sliders className="w-4 h-4 text-violet-500" /> Settings
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Color Depth</label>
                <div className="grid grid-cols-5 gap-1">
                  {(['1','2','4','8','16'] as ColorMode[]).map(c => (
                    <button key={c} onClick={() => setColors(c)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${colors === c ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Alpha Threshold: {threshold}
                </label>
                <input type="range" min="0" max="255" value={threshold} onChange={e => setThreshold(+e.target.value)}
                  className="w-full accent-violet-600" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Detail Level</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['none','low','high'] as SmoothMode[]).map(s => (
                    <button key={s} onClick={() => setSmooth(s)}
                      className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${smooth === s ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={trace} disabled={!imageUrl || isProcessing} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                {isProcessing ? 'Tracing…' : 'Trace to SVG'}
              </Button>

              {svgOutput && (
                <Button onClick={download} variant="secondary" className="w-full gap-2">
                  <Download className="w-4 h-4" /> Download SVG
                </Button>
              )}

              {imageUrl && (
                <Button variant="secondary" onClick={() => { setImageUrl(null); setSvgOutput(null); }} className="w-full text-red-500 gap-2">
                  <Trash2 className="w-4 h-4" /> Clear
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800">
            <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
              💡 <strong>Tip:</strong> Use higher color depth for photos. Use 1–2 colors for logos and icons to get clean vectors perfect for Figma.
            </p>
          </Card>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
