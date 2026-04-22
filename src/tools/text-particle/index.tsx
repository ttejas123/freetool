'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Play, Pause, RefreshCw, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

interface Particle {
  x: number; y: number;
  tx: number; ty: number; // target
  vx: number; vy: number;
  radius: number;
  color: string;
  alpha: number;
}

type ParticleShape = 'circle' | 'square' | 'star' | 'ring';
type ColorMode = 'single' | 'rainbow' | 'gradient' | 'fire';

function getColor(mode: ColorMode, base: string, i: number, total: number): string {
  switch (mode) {
    case 'rainbow': return `hsl(${(i / total) * 360}, 90%, 60%)`;
    case 'gradient': {
      const t = i / total;
      const r = Math.round(100 + t * 155);
      const b = Math.round(255 - t * 200);
      return `rgb(${r},50,${b})`;
    }
    case 'fire': {
      const t = i / total;
      return `hsl(${30 - t * 30}, 100%, ${40 + t * 30}%)`;
    }
    default: return base;
  }
}

function textToPoints(text: string, fontSize: number, canvasW: number, canvasH: number): [number,number][] {
  const offscreen = document.createElement('canvas');
  offscreen.width = canvasW; offscreen.height = canvasH;
  const ctx = offscreen.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvasW / 2, canvasH / 2);

  const data = ctx.getImageData(0, 0, canvasW, canvasH).data;
  const points: [number, number][] = [];
  const step = 4;

  for (let y = 0; y < canvasH; y += step) {
    for (let x = 0; x < canvasW; x += step) {
      const i = (y * canvasW + x) * 4;
      if (data[i + 3] > 128) points.push([x, y]);
    }
  }
  return points;
}

export default function TextParticle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const playingRef = useRef(true);

  const [text, setText] = useState('FREETOOL');
  const [fontSize, setFontSize] = useState(120);
  const [particleSize, setParticleSize] = useState(3);
  const [colorMode, setColorMode] = useState<ColorMode>('gradient');
  const [baseColor, setBaseColor] = useState('#7c3aed');
  const [shape, setShape] = useState<ParticleShape>('circle');
  const [speed, setSpeed] = useState(6);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scattered, setScattered] = useState(false);

  const CANVAS_W = 800, CANVAS_H = 360;

  const buildParticles = useCallback(() => {
    const points = textToPoints(text, fontSize, CANVAS_W, CANVAS_H);
    const total = points.length;
    particlesRef.current = points.map(([tx, ty], i) => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      tx, ty,
      vx: 0, vy: 0,
      radius: particleSize * (0.7 + Math.random() * 0.6),
      color: getColor(colorMode, baseColor, i, total),
      alpha: 0.7 + Math.random() * 0.3,
    }));
  }, [text, fontSize, particleSize, colorMode, baseColor]);

  const scatter = useCallback(() => {
    particlesRef.current.forEach(p => {
      p.x = Math.random() * CANVAS_W;
      p.y = Math.random() * CANVAS_H;
      p.vx = (Math.random() - 0.5) * 10;
      p.vy = (Math.random() - 0.5) * 10;
    });
    setScattered(true);
  }, []);

  const gather = useCallback(() => setScattered(false), []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle, s: ParticleShape) => {
    ctx.beginPath();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    switch (s) {
      case 'circle':
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        break;
      case 'ring':
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      case 'star': {
        const spikes = 5, outerR = p.radius, innerR = p.radius * 0.4;
        ctx.moveTo(p.x, p.y - outerR);
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI / spikes) * i - Math.PI / 2;
          ctx.lineTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(10,10,20,0.18)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const ease = speed / 100;

    for (const p of particlesRef.current) {
      if (scattered) {
        p.vx *= 0.96;
        p.vy += 0.05; // gravity
        p.x += p.vx;
        p.y += p.vy;
      } else {
        const dx = p.tx - p.x, dy = p.ty - p.y;
        p.vx = p.vx * (1 - ease) + dx * ease;
        p.vy = p.vy * (1 - ease) + dy * ease;
        p.x += p.vx;
        p.y += p.vy;
      }
      drawParticle(ctx, p, shape);
    }

    if (playingRef.current) animRef.current = requestAnimationFrame(tick);
  }, [scattered, speed, shape, drawParticle]);

  // Boot animation on text/options change
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    buildParticles();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    playingRef.current = true;
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [buildParticles, tick]);

  const togglePlay = () => {
    if (playingRef.current) {
      cancelAnimationFrame(animRef.current);
      playingRef.current = false;
      setIsPlaying(false);
    } else {
      playingRef.current = true;
      setIsPlaying(true);
      animRef.current = requestAnimationFrame(tick);
    }
  };

  const downloadFrame = () => {
    const a = document.createElement('a');
    a.href = canvasRef.current!.toDataURL('image/png');
    a.download = 'particle-text.png';
    a.click();
  };

  const COLOR_MODES: { id: ColorMode; label: string }[] = [
    { id: 'gradient', label: 'Blue→Red' },
    { id: 'rainbow',  label: 'Rainbow'  },
    { id: 'fire',     label: 'Fire'     },
    { id: 'single',   label: 'Single'   },
  ];
  const SHAPES: { id: ParticleShape; icon: string }[] = [
    { id: 'circle', icon: '●' },
    { id: 'square', icon: '■' },
    { id: 'ring',   icon: '○' },
    { id: 'star',   icon: '★' },
  ];

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="Text Particle Effect — Animated Particle Text Generator"
        description="Create stunning animated particle text effects. Type any word and watch it explode into particles and reassemble. Export as PNG."
      />

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto transform -rotate-2">
          <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Text Particle Effect</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Watch any text explode into particles and reassemble — with rainbow, fire, and gradient modes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="overflow-hidden dark:bg-gray-900 p-0">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full block"
              style={{ background: '#0a0a14', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
            />
          </Card>

          <div className="flex gap-2">
            <Button onClick={togglePlay} variant="secondary" className="gap-2">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={scattered ? gather : scatter} variant="secondary" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {scattered ? 'Gather' : 'Explode!'}
            </Button>
            <Button onClick={downloadFrame} variant="secondary" className="gap-2 ml-auto">
              <Download className="w-4 h-4" /> Snapshot
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="p-5 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
            <div className="space-y-5">
              {/* Text input */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block uppercase tracking-wide">Text</label>
                <input
                  type="text"
                  value={text}
                  maxLength={12}
                  onChange={e => setText(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Font size */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Font size: {fontSize}px</label>
                <input type="range" min="60" max="200" value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full accent-indigo-500" />
              </div>

              {/* Particle size */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Particle size: {particleSize}px</label>
                <input type="range" min="1" max="8" value={particleSize} onChange={e => setParticleSize(+e.target.value)} className="w-full accent-indigo-500" />
              </div>

              {/* Speed */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Speed: {speed}%</label>
                <input type="range" min="1" max="20" value={speed} onChange={e => setSpeed(+e.target.value)} className="w-full accent-indigo-500" />
              </div>

              {/* Color mode */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">Color</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {COLOR_MODES.map(c => (
                    <button key={c.id} onClick={() => setColorMode(c.id)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${colorMode === c.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
                {colorMode === 'single' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                    <span className="text-xs text-gray-500">Pick color</span>
                  </div>
                )}
              </div>

              {/* Particle shape */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">Shape</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SHAPES.map(s => (
                    <button key={s.id} onClick={() => setShape(s.id)}
                      className={`py-2 rounded-xl text-base transition-all ${shape === s.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                      {s.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
