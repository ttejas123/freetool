'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Type } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

// ── Types ──────────────────────────────────────────────────────────────────
type FontFamily = 'Inter' | 'Georgia' | 'Courier New' | 'Impact' | 'Garamond' | 'Helvetica';
type MaskShape = 'none' | 'circle' | 'square' | 'diamond' | 'hexagon';
type AspectRatio = '1:1' | '16:9' | '4:3' | '3:2';
type HighlightMode = 'none' | 'alternate-row' | 'alternate-word' | 'random';

const FONT_FAMILIES: FontFamily[] = ['Inter', 'Georgia', 'Courier New', 'Impact', 'Garamond', 'Helvetica'];
const MASK_SHAPES: MaskShape[] = ['none', 'circle', 'square', 'diamond', 'hexagon'];
const ASPECT_RATIOS: Record<AspectRatio, [number, number]> = {
  '1:1': [600, 600],
  '16:9': [640, 360],
  '4:3': [640, 480],
  '3:2': [600, 400],
};

const PRESETS: {
  label: string; text: string; font: FontFamily; tilt: number; size: number;
  color: string; highlight: string; bg: string; spacing: number; highlightMode: HighlightMode;
}[] = [
  { label: 'Forest',   text: 'NATURE', font: 'Impact',     tilt: -15, size: 32, color: '#1a3a1a', highlight: '#5a9e35', bg: '#d4e8bf', spacing: 1.2, highlightMode: 'alternate-row' },
  { label: 'Cyberpunk',text: 'CYBER_01', font: 'Courier New', tilt: 0, size: 18, color: '#00ff41', highlight: '#39ff14', bg: '#0d0d0d', spacing: 0.9, highlightMode: 'alternate-word' },
  { label: 'Editorial',text: 'LUXURY', font: 'Garamond',   tilt: -8,  size: 28, color: '#c8a96e', highlight: '#f0e0c0', bg: '#1a1208', spacing: 1.4, highlightMode: 'alternate-row' },
  { label: 'Blueprint', text: 'SYSTEM', font: 'Courier New', tilt: -45, size: 20, color: '#1b4f8a', highlight: '#5499d6', bg: '#e8f2fc', spacing: 1.1, highlightMode: 'none' },
  { label: 'Retro',    text: 'GROOVY!', font: 'Impact',    tilt: 12,  size: 36, color: '#ff6b35', highlight: '#ffcc00', bg: '#1e0a2e', spacing: 1.3, highlightMode: 'random' },
  { label: 'Minimal',  text: 'studio.', font: 'Helvetica',  tilt: 0,  size: 16, color: '#888888', highlight: '#222222', bg: '#f5f5f5', spacing: 1.5, highlightMode: 'alternate-word' },
];

// ── Canvas clip paths ──────────────────────────────────────────────────────
function applyMaskClip(ctx: CanvasRenderingContext2D, mask: MaskShape, w: number, h: number) {
  if (mask === 'none') return;
  const cx = w / 2, cy = h / 2;
  const rx = Math.min(w, h) * 0.45;
  ctx.beginPath();
  switch (mask) {
    case 'circle':
      ctx.arc(cx, cy, rx, 0, Math.PI * 2);
      break;
    case 'square': {
      const s = rx * 1.4;
      ctx.rect(cx - s, cy - s, s * 2, s * 2);
      break;
    }
    case 'diamond':
      ctx.moveTo(cx, cy - rx * 1.4);
      ctx.lineTo(cx + rx * 1.4, cy);
      ctx.lineTo(cx, cy + rx * 1.4);
      ctx.lineTo(cx - rx * 1.4, cy);
      ctx.closePath();
      break;
    case 'hexagon': {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + rx * 1.1 * Math.cos(a);
        const y = cy + rx * 1.1 * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
  }
  ctx.clip();
}

// ── Main render function ────────────────────────────────────────────────────
function renderTextPattern(
  canvas: HTMLCanvasElement,
  text: string,
  font: FontFamily,
  fontSize: number,
  tilt: number,
  color: string,
  highlight: string,
  bg: string,
  spacing: number,
  highlightMode: HighlightMode,
  mask: MaskShape,
  randomTilt: boolean,
) {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width, h = canvas.height;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Apply mask clip
  ctx.save();
  applyMaskClip(ctx, mask, w, h);

  const rad = (tilt * Math.PI) / 180;
  const fontStr = `bold ${fontSize}px "${font}", sans-serif`;
  ctx.font = fontStr;

  // Measure text
  const metrics = ctx.measureText(text);
  const textW = metrics.width + fontSize * spacing;
  const textH = fontSize * 1.5 * spacing;

  // Diagonal tiling: figure out how many rows/cols we need
  const diagLen = Math.sqrt(w * w + h * h);
  const cols = Math.ceil(diagLen / textW) + 4;
  const rows = Math.ceil(diagLen / textH) + 4;

  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);

  let rowIdx = 0;
  for (let row = -rows; row <= rows; row++) {
    const yPos = row * textH;
    const xOffset = (row % 2) * (textW / 2); // stagger alternate rows
    let wordIdx = 0;
    for (let col = -cols; col <= cols; col++) {
      const xPos = col * textW + xOffset;

      // Tiny random tilt variation per instance
      const wobble = randomTilt ? (Math.random() - 0.5) * 0.08 : 0;
      if (wobble !== 0) {
        ctx.save();
        ctx.translate(xPos, yPos);
        ctx.rotate(wobble);
        ctx.translate(-xPos, -yPos);
      }

      // Pick color based on highlight mode
      let useHighlight = false;
      switch (highlightMode) {
        case 'alternate-row':   useHighlight = rowIdx % 2 === 0; break;
        case 'alternate-word':  useHighlight = wordIdx % 2 === 0; break;
        case 'random':          useHighlight = Math.random() > 0.65; break;
      }

      ctx.fillStyle = useHighlight ? highlight : color;
      ctx.font = fontStr; // reset after potential rotate
      ctx.textBaseline = 'middle';
      ctx.fillText(text, xPos, yPos);

      if (wobble !== 0) ctx.restore();
      wordIdx++;
    }
    rowIdx++;
  }

  ctx.restore(); // restore from main translate+rotate + clip
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TextBackground() {
  const [text, setText] = useState('FREETOOL');
  const [font, setFont] = useState<FontFamily>('Impact');
  const [fontSize, setFontSize] = useState(32);
  const [tilt, setTilt] = useState(-15);
  const [color, setColor] = useState('#1a3a1a');
  const [highlight, setHighlight] = useState('#5a9e35');
  const [bg, setBg] = useState('#d4e8bf');
  const [spacing, setSpacing] = useState(1.2);
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('alternate-row');
  const [mask, setMask] = useState<MaskShape>('none');
  const [aspect, setAspect] = useState<AspectRatio>('1:1');
  const [randomTilt, setRandomTilt] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderTextPattern(canvas, text || 'TEXT', font, fontSize, tilt, color, highlight, bg, spacing, highlightMode, mask, randomTilt);
  }, [text, font, fontSize, tilt, color, highlight, bg, spacing, highlightMode, mask, randomTilt]);

  // Update canvas when any param changes
  useEffect(() => { render(); }, [render]);

  // Resize canvas when aspect changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [w, h] = ASPECT_RATIOS[aspect];
    canvas.width = w;
    canvas.height = h;
    render();
  }, [aspect, render]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setText(p.text); setFont(p.font); setTilt(p.tilt); setFontSize(p.size);
    setColor(p.color); setHighlight(p.highlight); setBg(p.bg);
    setSpacing(p.spacing); setHighlightMode(p.highlightMode);
  };

  const exportPng = () => {
    const a = document.createElement('a');
    a.href = canvasRef.current!.toDataURL('image/png');
    a.download = 'text-background.png';
    a.click();
  };

  const exportSvg = () => {
    const [w, h] = ASPECT_RATIOS[aspect];
    const rad = (tilt * Math.PI) / 180;
    const textH = fontSize * 1.5 * spacing;
    const cols = Math.ceil(Math.sqrt(w * w + h * h) * 1.2 / (fontSize * spacing * 8)) + 4;
    const rows = Math.ceil(Math.sqrt(w * w + h * h) / textH) + 4;
    const disp = text || 'TEXT';

    const lines: string[] = [];
    let rowIdx = 0;
    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        const xOff = (row % 2) * (fontSize * spacing * 4);
        const cx = w / 2 + col * fontSize * spacing * 8 + xOff;
        const cy = h / 2 + row * textH;
        const c = rowIdx % 2 === 0 ? highlight : color;
        lines.push(`<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" fill="${c}" font-size="${fontSize}" font-family="${font}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" transform="rotate(${tilt},${(w/2).toFixed(1)},${(h/2).toFixed(1)})">${disp}</text>`);
      }
      rowIdx++;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <g transform="rotate(${rad * 180 / Math.PI},${w/2},${h/2})">
    ${lines.join('\n    ')}
  </g>
</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'text-background.svg';
    a.click();
  };

  // ── Highlight mode labels
  const HIGHLIGHT_LABELS: Record<HighlightMode, string> = {
    'none': 'None', 'alternate-row': 'Every Row',
    'alternate-word': 'Every Word', 'random': 'Random',
  };

  const MASK_ICONS: Record<MaskShape, string> = {
    none: '□', circle: '○', square: '▪', diamond: '◇', hexagon: '⬡',
  };

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="Text Background Generator — Premium Repeating Text Patterns"
        description="Create stunning tilted repeating text backgrounds for websites. Control font, tilt, colors, highlight mode, and export as PNG or SVG."
      />

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto transform -rotate-1">
          <Type className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Text Background Generator</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Fill a canvas with tilted repeating text — choose fonts, colors, shapes, and export production-ready backgrounds.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── LEFT: Text & Typography ───────────────────────────────────── */}
        <div className="w-full lg:w-56 flex-shrink-0 space-y-3">

          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Text</p>
            <input
              type="text"
              value={text}
              maxLength={20}
              onChange={e => setText(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter text…"
            />
          </Card>

          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Font</p>
            <div className="space-y-1">
              {FONT_FAMILIES.map(f => (
                <button key={f} onClick={() => setFont(f)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${font === f ? 'bg-cyan-500 text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  style={{ fontFamily: f }}>
                  {f}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800/50 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2">Size: {fontSize}px</label>
              <input type="range" min="10" max="80" value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full accent-cyan-500" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2">Spacing: {spacing.toFixed(1)}×</label>
              <input type="range" min="0.6" max="2.5" step="0.1" value={spacing} onChange={e => setSpacing(+e.target.value)} className="w-full accent-cyan-500" />
            </div>
          </Card>

        </div>

        {/* ── CENTER: Canvas ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Aspect ratio tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map(a => (
              <button key={a} onClick={() => setAspect(a)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${aspect === a ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                {a}
              </button>
            ))}
          </div>

          {/* Canvas */}
          <Card className="overflow-hidden p-0 dark:bg-gray-900" style={{ background: bg }}>
            <canvas
              ref={canvasRef}
              className="w-full block"
              style={{ display: 'block', maxHeight: '65vh', objectFit: 'contain' }}
            />
          </Card>

          {/* Export row */}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportPng} className="flex-1 gap-2 font-semibold">
              <Download className="w-4 h-4" /> PNG
            </Button>
            <Button onClick={exportSvg} className="flex-1 gap-2 font-semibold bg-gray-900 dark:bg-white dark:text-gray-900 text-white hover:bg-gray-700">
              <Download className="w-4 h-4" /> SVG
            </Button>
          </div>

          {/* Presets */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Presets</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="rounded-xl overflow-hidden border-2 border-transparent hover:border-cyan-400 transition-all group"
                  title={p.label}
                >
                  {/* Colored swatch */}
                  <div className="h-10 flex items-center justify-center text-xs font-bold relative overflow-hidden"
                    style={{ background: p.bg, color: p.color }}>
                    <span className="truncate px-1" style={{ fontFamily: p.font, transform: `rotate(${p.tilt * 0.3}deg)`, display: 'inline-block' }}>
                      {p.text}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 py-1 text-xs text-center font-medium text-gray-600 dark:text-gray-300 group-hover:text-cyan-500">
                    {p.label}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── RIGHT: Style Controls ─────────────────────────────────────── */}
        <div className="w-full lg:w-56 flex-shrink-0 space-y-3">

          {/* Tilt */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Tilt: {tilt}°</p>
            <input type="range" min="-90" max="90" value={tilt} onChange={e => setTilt(+e.target.value)} className="w-full accent-cyan-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>-90°</span><span>0°</span><span>90°</span>
            </div>

            {/* Random wobble toggle */}
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${randomTilt ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                onClick={() => setRandomTilt(r => !r)}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${randomTilt ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Random wobble</span>
            </label>

            {/* Quick tilt presets */}
            <div className="grid grid-cols-4 gap-1 mt-3">
              {[0, -15, -30, -45].map(t => (
                <button key={t} onClick={() => setTilt(t)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${tilt === t ? 'bg-cyan-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {t}°
                </button>
              ))}
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Colors</p>
            <div className="space-y-2.5">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Base text</span>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Highlight</span>
                <input type="color" value={highlight} onChange={e => setHighlight(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Background</span>
                <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0" />
              </label>
            </div>
          </Card>

          {/* Highlight mode */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Highlight Pattern</p>
            <div className="space-y-1">
              {(Object.keys(HIGHLIGHT_LABELS) as HighlightMode[]).map(m => (
                <button key={m} onClick={() => setHighlightMode(m)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${highlightMode === m ? 'bg-cyan-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {HIGHLIGHT_LABELS[m]}
                </button>
              ))}
            </div>
          </Card>

          {/* Mask shape */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Mask Shape</p>
            <div className="grid grid-cols-5 gap-1">
              {MASK_SHAPES.map(s => (
                <button key={s} onClick={() => setMask(s)} title={s}
                  className={`aspect-square flex items-center justify-center rounded-xl text-lg transition-all ${mask === s ? 'bg-cyan-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'}`}>
                  {MASK_ICONS[s]}
                </button>
              ))}
            </div>
          </Card>

          {/* Re-randomize if wobble on */}
          {randomTilt && (
            <Button onClick={render} variant="secondary" className="w-full gap-2">
              <RefreshCw className="w-4 h-4" /> Re-randomize
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
