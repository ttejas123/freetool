'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Undo2, Shapes } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

// ── Types ──────────────────────────────────────────────────────────────────
type ShapeId = 'circle' | 'half' | 'quarter' | 'square' | 'diagonal' | 'donut';
type Rotation = 0 | 90 | 180 | 270;
type GridSize = 2 | 3 | 4 | 5;

interface Cell {
  shape: ShapeId;
  rotation: Rotation;
}

// ── Shape draw functions (canvas) ──────────────────────────────────────────
function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeId,
  rotation: Rotation,
  x: number,
  y: number,
  size: number,
  fg: string,
  bg: string,
) {
  ctx.save();
  // Rotate around cell center
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-size / 2, -size / 2);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  ctx.strokeStyle = fg;

  const r = size / 2;
  const cx = size / 2;
  const cy = size / 2;

  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'half': // D-shape, filled semicircle
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.98, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(cx, size);
      ctx.lineTo(cx, 0);
      ctx.closePath();
      ctx.fill();
      break;

    case 'quarter': // filled quarter-circle wedge
      ctx.beginPath();
      ctx.moveTo(0, size);                         // bottom-left
      ctx.arc(0, size, size * 0.98, -Math.PI / 2, 0);
      ctx.lineTo(0, size);
      ctx.closePath();
      ctx.fill();
      break;

    case 'square': // plain filled square
      ctx.fillRect(0, 0, size, size);
      break;

    case 'diagonal': // right-angle triangle splitting cell diagonally
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.closePath();
      ctx.fill();
      break;

    case 'donut': { // ring / large arc
      ctx.lineWidth = size * 0.18;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.62, -Math.PI / 2, Math.PI / 2 + Math.PI);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

// ── SVG path helpers ───────────────────────────────────────────────────────
function cellToSvg(cell: Cell, x: number, y: number, size: number, fg: string, bg: string): string {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;
  const rot = cell.rotation;
  const rotAttr = `transform="rotate(${rot},${cx},${cy})"`;

  const rect = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${bg}"/>`;

  let shape = '';
  switch (cell.shape) {
    case 'circle':
      shape = `<circle cx="${cx}" cy="${cy}" r="${r * 0.98}" fill="${fg}" ${rotAttr}/>`;
      break;
    case 'half': {
      const rx = x + size / 2, ry1 = y, ry2 = y + size;
      shape = `<path d="M${rx},${ry1} A${r * 0.98},${r * 0.98} 0 0,1 ${rx},${ry2} Z" fill="${fg}" ${rotAttr}/>`;
      break;
    }
    case 'quarter': {
      const qx = x, qy = y + size;
      shape = `<path d="M${qx},${qy} A${size * 0.98},${size * 0.98} 0 0,1 ${x + size},${qy} Z" fill="${fg}" ${rotAttr}/>`;
      break;
    }
    case 'square':
      shape = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fg}" ${rotAttr}/>`;
      break;
    case 'diagonal':
      shape = `<polygon points="${x},${y} ${x + size},${y} ${x},${y + size}" fill="${fg}" ${rotAttr}/>`;
      break;
    case 'donut': {
      const strokeW = size * 0.18;
      const innerR = r * 0.62;
      shape = `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${fg}" stroke-width="${strokeW}" ${rotAttr}/>`;
      break;
    }
  }
  return rect + '\n  ' + shape;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SHAPE_ICONS: Record<ShapeId, any> = {
  circle:   <circle cx="20" cy="20" r="16" />,
  half:     <path d="M20,4 A16,16 0 0,1 20,36 Z" />,
  quarter:  <path d="M4,36 A32,32 0 0,1 36,36 Z" />,
  square:   <rect x="4" y="4" width="32" height="32" />,
  diagonal: <polygon points="4,4 36,4 4,36" />,
  donut:    <circle cx="20" cy="20" r="12" fill="none" strokeWidth="5" style={{ stroke: 'currentColor', fill: 'none' }} />,
};

const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: 'Circle', half: 'Half', quarter: 'Arc',
  square: 'Square', diagonal: 'Diagonal', donut: 'Ring',
};

const ROTATIONS: Rotation[] = [0, 90, 180, 270];
const ALL_SHAPES: ShapeId[] = ['circle', 'half', 'quarter', 'square', 'diagonal', 'donut'];

const PRESETS: { label: string; fg: string; bg: string }[] = [
  { label: 'Forest',  fg: '#1a2e1a', bg: '#e8f0e0' },
  { label: 'Ink',     fg: '#0f0f0f', bg: '#f5f2eb' },
  { label: 'Ocean',   fg: '#0d3b5e', bg: '#cce3f5' },
  { label: 'Dusk',    fg: '#3b1f5c', bg: '#f0e6ff' },
  { label: 'Ember',   fg: '#7b1c00', bg: '#ffe8d6' },
  { label: 'Slate',   fg: '#1e293b', bg: '#f1f5f9' },
];

// ── Main component ─────────────────────────────────────────────────────────
export default function GeoArt() {
  const [gridSize, setGridSize] = useState<GridSize>(3);
  const [cells, setCells] = useState<Cell[]>([]);
  const [history, setHistory] = useState<Cell[][]>([]);
  const [enabledShapes, setEnabledShapes] = useState<Set<ShapeId>>(
    new Set(['circle', 'half', 'quarter', 'square', 'diagonal'])
  );
  const [fg, setFg] = useState('#1a2e1a');
  const [bg, setBg] = useState('#e8f0e0');
  const [gap, setGap] = useState(6);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const CANVAS_SIZE = 560;

  // ── Cell generation ──────────────────────────────────────────────────────
  const randomCell = useCallback((shapes: ShapeId[]): Cell => ({
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    rotation: ROTATIONS[Math.floor(Math.random() * 4)],
  }), []);

  const generate = useCallback((size = gridSize) => {
    const shapes = [...enabledShapes];
    if (shapes.length === 0) return;
    const newCells = Array.from({ length: size * size }, () => randomCell(shapes));
    setHistory(h => [...h.slice(-10), cells]);
    setCells(newCells);
  }, [gridSize, enabledShapes, cells, randomCell]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    setCells(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
  }, [history]);

  // Bootstrap on mount and when grid size changes
  useEffect(() => {
    const shapes = [...enabledShapes];
    if (shapes.length === 0) return;
    const newCells = Array.from({ length: gridSize * gridSize }, () => randomCell(shapes));
    setCells(newCells);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize]);

  // ── Canvas render ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const n = gridSize;
    const totalGap = gap * (n + 1);  // outer + inner gaps
    const cellSize = (CANVAS_SIZE - totalGap) / n;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    cells.forEach((cell, i) => {
      const col = i % n;
      const row = Math.floor(i / n);
      const x = gap + col * (cellSize + gap);
      const y = gap + row * (cellSize + gap);
      drawShape(ctx, cell.shape, cell.rotation, x, y, cellSize, fg, bg);
    });
  }, [cells, gridSize, fg, bg, gap]);

  // ── SVG export ───────────────────────────────────────────────────────────
  const exportSvg = () => {
    const n = gridSize;
    const totalGap = gap * (n + 1);
    const cellSize = (CANVAS_SIZE - totalGap) / n;
    const parts: string[] = [];

    cells.forEach((cell, i) => {
      const col = i % n;
      const row = Math.floor(i / n);
      const x = gap + col * (cellSize + gap);
      const y = gap + row * (cellSize + gap);
      parts.push(cellToSvg(cell, x, y, cellSize, fg, bg));
    });

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
  <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${bg}"/>
  ${parts.join('\n  ')}
</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'geo-art.svg';
    a.click();
  };

  const exportPng = () => {
    const a = document.createElement('a');
    a.href = canvasRef.current!.toDataURL('image/png');
    a.download = 'geo-art.png';
    a.click();
  };

  const toggleShape = (s: ShapeId) => {
    setEnabledShapes(prev => {
      const next = new Set(prev);
      if (next.has(s) && next.size === 1) return prev; // keep at least 1
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const applyPreset = (p: typeof PRESETS[0]) => { setFg(p.fg); setBg(p.bg); };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="Geo Art Generator — Abstract Geometric Grid Art"
        description="Create stunning abstract geometric art by randomly placing shapes in a grid. Choose 2×2 to 5×5, pick shapes, colors, and export as SVG or PNG."
      />

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-lime-100 dark:bg-lime-900/30 rounded-2xl flex items-center justify-center mx-auto transform rotate-2">
          <Shapes className="w-8 h-8 text-lime-700 dark:text-lime-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Geo Art Generator</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Randomly fill a grid with geometric shapes — circles, arcs, diagonals — and export as production-ready SVG.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div className="w-full lg:w-56 flex-shrink-0 space-y-4">

          {/* Shape picker */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Shapes</p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_SHAPES.map(s => (
                <button
                  key={s}
                  title={SHAPE_LABELS[s]}
                  onClick={() => toggleShape(s)}
                  className={`aspect-square flex items-center justify-center rounded-xl border-2 transition-all ${
                    enabledShapes.has(s)
                      ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600'
                  }`}
                >
                  <svg width="36" height="36" viewBox="0 0 40 40" fill="currentColor">
                    {SHAPE_ICONS[s]}
                  </svg>
                </button>
              ))}
            </div>
          </Card>

          {/* Grid size */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Grid</p>
            <div className="space-y-1.5">
              {([2, 3, 4, 5] as GridSize[]).map(n => (
                <button
                  key={n}
                  onClick={() => setGridSize(n)}
                  className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${
                    gridSize === n
                      ? 'bg-lime-500 dark:bg-lime-600 text-white shadow-md shadow-lime-400/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-lime-50 dark:hover:bg-lime-900/20'
                  }`}
                >
                  {n}×{n}
                </button>
              ))}
            </div>
          </Card>

          {/* Gap */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Gap: {gap}px</p>
            <input
              type="range" min="0" max="20" value={gap}
              onChange={e => setGap(+e.target.value)}
              className="w-full accent-lime-500"
            />
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={() => generate(gridSize)}
              className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold gap-2 py-3 shadow-lg shadow-lime-500/20"
            >
              <RefreshCw className="w-4 h-4" /> Generate
            </Button>
            <Button
              variant="secondary"
              onClick={undo}
              disabled={history.length === 0}
              className="w-full gap-2"
            >
              <Undo2 className="w-4 h-4" /> Undo
            </Button>
          </div>
        </div>

        {/* ── Canvas ─────────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-4">
          <Card className="p-3 dark:bg-gray-900 overflow-hidden" style={{ background: bg }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="w-full rounded-xl block"
              style={{ aspectRatio: '1/1', maxHeight: '60vh', objectFit: 'contain' }}
            />
          </Card>

          {/* Export */}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportPng} className="flex-1 gap-2">
              <Download className="w-4 h-4" /> PNG
            </Button>
            <Button onClick={exportSvg} className="flex-1 gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white hover:bg-gray-800">
              <Download className="w-4 h-4" /> SVG
            </Button>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div className="w-full lg:w-52 flex-shrink-0 space-y-4">
          {/* Colors */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Colors</p>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Shape</span>
                <input type="color" value={fg} onChange={e => setFg(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Background</span>
                <input type="color" value={bg} onChange={e => setBg(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0" />
              </label>
              {/* Swap */}
              <button
                onClick={() => { const tmp = fg; setFg(bg); setBg(tmp); }}
                className="w-full text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 py-1 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
              >
                ⇄ Swap colors
              </button>
            </div>
          </Card>

          {/* Presets */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Presets</p>
            <div className="space-y-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  {/* Color swatch */}
                  <span className="flex gap-0.5 flex-shrink-0">
                    <span className="w-4 h-6 rounded-l-md" style={{ background: p.fg }} />
                    <span className="w-4 h-6 rounded-r-md" style={{ background: p.bg }} />
                  </span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Cell count */}
          <Card className="p-4 dark:bg-gray-800/50 text-center">
            <p className="text-3xl font-black text-lime-600 dark:text-lime-400">{gridSize * gridSize}</p>
            <p className="text-xs text-gray-400 mt-1">cells · {enabledShapes.size} shapes</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
