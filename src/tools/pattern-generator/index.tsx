import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Shapes } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

type PatternType = 'grid' | 'hexagons' | 'triangles' | 'circles' | 'chevron' | 'diamonds' | 'waves' | 'dots';
type ColorScheme = 'violet' | 'ocean' | 'sunset' | 'forest' | 'mono' | 'candy' | 'fire' | 'custom';

const COLOR_SCHEMES: Record<Exclude<ColorScheme, 'custom'>, [string, string]> = {
  violet:  ['#7c3aed','#ddd6fe'],
  ocean:   ['#0ea5e9','#e0f2fe'],
  sunset:  ['#f97316','#fef3c7'],
  forest:  ['#16a34a','#dcfce7'],
  mono:    ['#111827','#f9fafb'],
  candy:   ['#ec4899','#fce7f3'],
  fire:    ['#dc2626','#fef9c3'],
};


function drawPattern(
  canvas: HTMLCanvasElement,
  type: PatternType,
  color1: string,
  color2: string,
  size: number,
  rotation: number,
  opacity: number,
) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = opacity / 100;
  ctx.fillStyle = color1;
  ctx.strokeStyle = color1;

  const w = canvas.width, h = canvas.height;
  const s = size;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-w, -h);

  switch (type) {
    case 'grid':
      ctx.lineWidth = Math.max(1, s * 0.1);
      for (let x = -w; x < w * 2; x += s) {
        ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x, h * 2); ctx.stroke();
      }
      for (let y = -h; y < h * 2; y += s) {
        ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w * 2, y); ctx.stroke();
      }
      break;

    case 'dots':
      for (let x = -w; x < w * 2; x += s) {
        for (let y = -h; y < h * 2; y += s) {
          ctx.beginPath();
          ctx.arc(x, y, s * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;

    case 'circles':
      ctx.lineWidth = Math.max(1, s * 0.08);
      for (let x = -w; x < w * 2; x += s) {
        for (let y = -h; y < h * 2; y += s) {
          ctx.beginPath();
          ctx.arc(x, y, s * 0.45, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;

    case 'hexagons': {
      const hexH = s * Math.sqrt(3);
      ctx.lineWidth = Math.max(1, s * 0.06);
      for (let row = -2; row < h * 2 / hexH + 2; row++) {
        for (let col = -2; col < w * 2 / s + 2; col++) {
          const xOff = (row % 2) * (s * 0.75);
          const cx = col * s * 1.5 + xOff;
          const cy = row * hexH;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = cx + s * 0.5 * Math.cos(angle);
            const hy = cy + s * 0.5 * Math.sin(angle);
            i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }

    case 'triangles': {
      const th = s * Math.sqrt(3) / 2;
      for (let row = -2; row < h * 2 / th + 2; row++) {
        for (let col = -2; col < w * 2 / s + 2; col++) {
          const x0 = col * s + (row % 2 === 0 ? 0 : s / 2);
          const y0 = row * th;
          const flip = (col + row) % 2 === 0;
          ctx.beginPath();
          if (flip) {
            ctx.moveTo(x0, y0); ctx.lineTo(x0 + s, y0); ctx.lineTo(x0 + s/2, y0 + th);
          } else {
            ctx.moveTo(x0 + s/2, y0); ctx.lineTo(x0, y0 + th); ctx.lineTo(x0 + s, y0 + th);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
      break;
    }

    case 'chevron':
      ctx.lineWidth = Math.max(1, s * 0.1);
      for (let row = -2; row < h * 2 / s + 2; row++) {
        for (let col = -2; col < w * 2 / s + 2; col++) {
          const x0 = col * s, y0 = row * s;
          ctx.beginPath();
          ctx.moveTo(x0, y0 + s/2);
          ctx.lineTo(x0 + s/2, y0);
          ctx.lineTo(x0 + s, y0 + s/2);
          ctx.stroke();
        }
      }
      break;

    case 'diamonds':
      for (let row = -2; row < h * 2 / s + 2; row++) {
        for (let col = -2; col < w * 2 / s + 2; col++) {
          const xOff = (row % 2) * (s / 2);
          const cx = col * s + xOff, cy = row * s;
          ctx.beginPath();
          ctx.moveTo(cx, cy - s * 0.4);
          ctx.lineTo(cx + s * 0.4, cy);
          ctx.lineTo(cx, cy + s * 0.4);
          ctx.lineTo(cx - s * 0.4, cy);
          ctx.closePath();
          ctx.fill();
        }
      }
      break;

    case 'waves':
      ctx.lineWidth = Math.max(1, s * 0.08);
      for (let row = -2; row < h * 2 / (s/2) + 2; row++) {
        ctx.beginPath();
        const y0 = row * (s / 2);
        for (let x = -w; x < w * 2; x += 1) {
          const y = y0 + (s * 0.3) * Math.sin((x / s) * Math.PI * 2);
          x === -w ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

export default function PatternGenerator() {
  const [type, setType] = useState<PatternType>('hexagons');
  const [scheme, setScheme] = useState<ColorScheme>('violet');
  const [size, setSize] = useState(40);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(80);
  const [customColor1, setCustomColor1] = useState('#6366f1');
  const [customColor2, setCustomColor2] = useState('#f8fafc');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const CANVAS_SIZE = 600;

  const color1 = scheme === 'custom' ? customColor1 : COLOR_SCHEMES[scheme][0];
  const color2 = scheme === 'custom' ? customColor2 : COLOR_SCHEMES[scheme][1];

  const render = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    drawPattern(c, type, color1, color2, size, rotation, opacity);
  }, [type, color1, color2, size, rotation, opacity]);

  useEffect(() => { render(); }, [render]);

  const randomize = () => {
    const types: PatternType[] = ['grid','hexagons','triangles','circles','chevron','diamonds','waves','dots'];
    const schemes: ColorScheme[] = ['violet','ocean','sunset','forest','mono','candy','fire'];
    setType(types[Math.floor(Math.random() * types.length)]);
    setScheme(schemes[Math.floor(Math.random() * schemes.length)]);
    setSize(Math.floor(Math.random() * 60) + 20);
    setRotation(Math.floor(Math.random() * 45));
    setOpacity(Math.floor(Math.random() * 40) + 60);
  };

  const download = (format: 'png' | 'svg') => {
    const c = canvasRef.current!;
    if (format === 'png') {
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'pattern.png';
      a.click();
    } else {
      // Wrap canvas in SVG image
      const dataUrl = c.toDataURL('image/png');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"><image href="${dataUrl}" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"/></svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pattern.svg';
      a.click();
    }
  };

  const PATTERN_TYPES: { id: PatternType; label: string; icon: string }[] = [
    { id: 'hexagons',  label: 'Hexagons',  icon: '⬡' },
    { id: 'grid',      label: 'Grid',      icon: '▦' },
    { id: 'dots',      label: 'Dots',      icon: '⠿' },
    { id: 'circles',   label: 'Circles',   icon: '◯' },
    { id: 'triangles', label: 'Triangles', icon: '△' },
    { id: 'diamonds',  label: 'Diamonds',  icon: '◇' },
    { id: 'chevron',   label: 'Chevron',   icon: '∧' },
    { id: 'waves',     label: 'Waves',     icon: '∿' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="Pattern Generator — Geometric SVG Pattern Maker"
        description="Create beautiful geometric patterns — hexagons, grids, waves, diamonds and more. Export as PNG or SVG. Free and browser-based."
      />

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto transform rotate-1">
          <Shapes className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Pattern Generator</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Create stunning geometric patterns — hexagons, grids, waves, and more. Export as PNG or SVG.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Preview */}
        <div className="lg:col-span-2">
          <Card className="p-4 dark:bg-gray-800/50 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="w-full rounded-xl object-contain"
              style={{ aspectRatio: '1/1' }}
            />
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="p-5 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pattern Type</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {PATTERN_TYPES.map(p => (
                <button key={p.id} onClick={() => setType(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${type === p.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-400/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}>
                  <span className="text-base">{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Style</h3>
            <div className="space-y-4">
              {/* Color Scheme */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">Color Scheme</label>
                <div className="grid grid-cols-4 gap-1">
                  {(Object.keys(COLOR_SCHEMES) as Exclude<ColorScheme,'custom'>[]).map(s => (
                    <button key={s} onClick={() => setScheme(s)}
                      className={`h-7 rounded-lg transition-all border-2 ${scheme === s ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                      title={s}
                      style={{ background: `linear-gradient(135deg, ${COLOR_SCHEMES[s][0]}, ${COLOR_SCHEMES[s][1]})` }} />
                  ))}
                </div>
                {/* Custom colors */}
                <div className="flex gap-2 mt-2">
                  <label className="flex items-center gap-1 flex-1 text-xs text-gray-500">
                    <input type="color" value={customColor1} onChange={e => { setCustomColor1(e.target.value); setScheme('custom'); }} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                    Foreground
                  </label>
                  <label className="flex items-center gap-1 flex-1 text-xs text-gray-500">
                    <input type="color" value={customColor2} onChange={e => { setCustomColor2(e.target.value); setScheme('custom'); }} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                    Background
                  </label>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Size: {size}px</label>
                <input type="range" min="10" max="120" value={size} onChange={e => setSize(+e.target.value)} className="w-full accent-orange-500" />
              </div>

              {/* Rotation */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Rotation: {rotation}°</label>
                <input type="range" min="0" max="90" value={rotation} onChange={e => setRotation(+e.target.value)} className="w-full accent-orange-500" />
              </div>

              {/* Opacity */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Opacity: {opacity}%</label>
                <input type="range" min="10" max="100" value={opacity} onChange={e => setOpacity(+e.target.value)} className="w-full accent-orange-500" />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={randomize} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Shuffle
            </Button>
            <Button onClick={() => download('png')} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
              <Download className="w-4 h-4" /> PNG
            </Button>
          </div>
          <Button variant="secondary" onClick={() => download('svg')} className="w-full gap-2">
            <Download className="w-4 h-4" /> Export SVG
          </Button>
        </div>
      </div>
    </div>
  );
}
