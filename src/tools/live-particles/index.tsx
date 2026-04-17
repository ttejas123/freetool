import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, Download, RefreshCw, Video, StopCircle, Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';

// ── Types ──────────────────────────────────────────────────────────────────
type PatternType =
  | 'flower' | 'vortex' | 'lissajous' | 'wave'
  | 'spiral' | 'noise'  | 'starfield'  | 'text';

type ParticleShape = 'circle' | 'dot' | 'square' | 'star' | 'line';
type ColorMode     = 'single' | 'rainbow' | 'neon' | 'fire' | 'ocean';
type HoverMode     = 'repel'  | 'attract' | 'none';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  tx: number; ty: number;   // target (used in text mode)
  size: number;
  hue: number;
  alpha: number;
  phase: number;            // individual phase seed
  speed: number;            // individual speed factor
}

// ── Flow field functions — return angle (radians) given position ──────────
function flowAngle(
  pattern: PatternType,
  x: number, y: number,
  t: number, w: number, h: number,
): number {
  const cx = w / 2, cy = h / 2;
  const dx = x - cx, dy = y - cy;
  switch (pattern) {
    case 'flower': {
      const r = Math.sqrt(dx * dx + dy * dy);
      const a = Math.atan2(dy, dx);
      return a + 1.2 + Math.sin(r * 0.025 - t) * 2.5;
    }
    case 'vortex':
      return Math.atan2(dy, dx) + Math.PI / 2 + Math.sin(t * 0.5) * 0.3;
    case 'lissajous': {
      const nx = dx / (w * 0.4), ny = dy / (h * 0.4);
      return Math.atan2(3 * Math.cos(2 * nx * Math.PI + t) * Math.PI / h,
                        2 * Math.cos(3 * ny * Math.PI) * Math.PI / w) + t * 0.1;
    }
    case 'wave':
      return Math.sin(x * 0.018 + t) * Math.PI * 0.6 + Math.PI;
    case 'spiral': {
      const r2 = Math.sqrt(dx * dx + dy * dy);
      const a2 = Math.atan2(dy, dx);
      return a2 + Math.PI / 2 - r2 * 0.008 + t * 0.3;
    }
    case 'noise': {
      const v1 = Math.sin(x * 0.012 + t * 0.7) * Math.cos(y * 0.009 - t * 0.5);
      const v2 = Math.sin((x + y) * 0.008 + t * 0.3);
      return (v1 + v2) * Math.PI;
    }
    case 'starfield': {
      // radial outward
      return Math.atan2(dy, dx);
    }
    default:
      return 0;
  }
}

// ── Get text pixel positions ───────────────────────────────────────────────
function getTextPoints(text: string, w: number, h: number, count: number): [number, number][] {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const ctx = off.getContext('2d')!;
  const fSize = Math.min(w * 0.35, 100);
  ctx.font = `900 ${fSize}px "Inter", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, w / 2, h / 2);
  const d = ctx.getImageData(0, 0, w, h).data;
  const pts: [number, number][] = [];
  const step = 4;
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step)
      if (d[(y * w + x) * 4 + 3] > 128) pts.push([x, y]);

  // Shuffle & limit
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts.slice(0, count);
}

// ── Particle color getter ─────────────────────────────────────────────────
function particleColor(
  p: Particle, mode: ColorMode, baseColor: string, t: number,
): string {
  switch (mode) {
    case 'rainbow': return `hsla(${(p.hue + t * 30) % 360},90%,65%,${p.alpha})`;
    case 'neon': {
      const h = (p.hue + t * 20) % 360;
      return `hsla(${h},100%,70%,${p.alpha})`;
    }
    case 'fire': {
      const h = 10 + (p.phase * 40) % 30;
      return `hsla(${h},100%,${50 + p.phase * 20}%,${p.alpha})`;
    }
    case 'ocean': {
      const h = 185 + (p.hue % 60);
      return `hsla(${h},80%,55%,${p.alpha})`;
    }
    default: return baseColor;
  }
}

// ── Draw a particle ────────────────────────────────────────────────────────
function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  shape: ParticleShape,
  color: string,
) {
  const s = p.size;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.globalAlpha = p.alpha;
  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'dot':
      ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);
      break;
    case 'square':
      ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
      break;
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outer = (Math.PI / 2.5) * i - Math.PI / 2;
        const inner = outer + Math.PI / 5;
        ctx.lineTo(p.x + Math.cos(outer) * s, p.y + Math.sin(outer) * s);
        ctx.lineTo(p.x + Math.cos(inner) * s * 0.4, p.y + Math.sin(inner) * s * 0.4);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'line': {
      const len = s * 3;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x - len / 2, p.y);
      ctx.lineTo(p.x + len / 2, p.y);
      ctx.stroke();
      break;
    }
  }
  ctx.globalAlpha = 1;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LiveParticles() {
  // --- Config state ---
  const [pattern, setPattern]        = useState<PatternType>('flower');
  const [shape, setShape]            = useState<ParticleShape>('circle');
  const [colorMode, setColorMode]    = useState<ColorMode>('rainbow');
  const [baseColor, setBaseColor]    = useState('#7eb8f7');
  const [bgColor, setBgColor]        = useState('#05050f');
  const [density, setDensity]        = useState(1800);
  const [particleSize, setParticleSize] = useState(1.2);
  const [speed, setSpeed]            = useState(1.0);
  const [hoverMode, setHoverMode]    = useState<HoverMode>('repel');
  const [customText, setCustomText]  = useState('FREETOOL');

  // --- Runtime state ---
  const [isPlaying, setIsPlaying]  = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const playingRef   = useRef(true);
  const timeRef      = useRef(0);
  const mouseRef     = useRef<{ x: number; y: number; active: boolean }>({ x: -999, y: -999, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const recorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<BlobPart[]>([]);

  const W = 700, H = 700;

  // ── Init particles ────────────────────────────────────────────────────────
  const initParticles = useCallback((pat: PatternType, txt: string, count: number, sz: number) => {
    const pts = pat === 'text' && txt ? getTextPoints(txt, W, H, count) : null;
    particlesRef.current = Array.from({ length: count }, (_, i) => {
      const [tx, ty] = pts ? (pts[i % pts.length] ?? [W / 2, H / 2]) : [Math.random() * W, Math.random() * H];
      return {
        x: pat === 'text' ? Math.random() * W : tx,
        y: pat === 'text' ? Math.random() * H : ty,
        tx, ty,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: sz * (0.6 + Math.random() * 0.8),
        hue: Math.random() * 360,
        alpha: 0.6 + Math.random() * 0.4,
        phase: Math.random(),
        speed: 0.6 + Math.random() * 0.8,
      };
    });
  }, []);

  // ── Animation tick ────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    timeRef.current += 0.016 * speed;
    const t = timeRef.current;

    // Trail effect
    ctx.fillStyle = bgColor + 'cc'; // semi-transparent background
    ctx.fillRect(0, 0, W, H);

    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const mActive = mouseRef.current.active;
    const HOVER_R = 100;

    for (const p of particlesRef.current) {
      let ax = 0, ay = 0;

      if (pattern === 'text') {
        // Spring toward target
        const spring = 0.04;
        ax = (p.tx - p.x) * spring;
        ay = (p.ty - p.y) * spring;
        // mild noise disturbance
        ax += Math.sin(p.x * 0.02 + t) * 0.3;
        ay += Math.cos(p.y * 0.02 + t) * 0.3;
      } else if (pattern === 'starfield') {
        // Move radially outward, wrap back to center
        const angle = flowAngle(pattern, p.x, p.y, t, W, H);
        const spd = p.speed * speed * (0.5 + p.phase * 1.5);
        ax = Math.cos(angle) * spd;
        ay = Math.sin(angle) * spd;
        p.x += ax; p.y += ay;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          // reset near center
          const a2 = Math.random() * Math.PI * 2;
          const r = Math.random() * 30;
          p.x = W / 2 + Math.cos(a2) * r;
          p.y = H / 2 + Math.sin(a2) * r;
        }
        drawParticle(ctx, p, shape, particleColor(p, colorMode, baseColor, t));
        continue;
      } else {
        // Flow field
        const angle = flowAngle(pattern, p.x, p.y, t, W, H);
        const spd = p.speed * speed;
        ax = Math.cos(angle) * spd;
        ay = Math.sin(angle) * spd;
      }

      // Hover force
      if (mActive && hoverMode !== 'none') {
        const ddx = p.x - mx, ddy = p.y - my;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < HOVER_R && dist > 0) {
          const force = (HOVER_R - dist) / HOVER_R;
          const forceAmt = hoverMode === 'repel' ? force * 4 : -force * 3;
          ax += (ddx / dist) * forceAmt;
          ay += (ddy / dist) * forceAmt;
        }
      }

      p.vx = p.vx * 0.85 + ax * 0.15;
      p.vy = p.vy * 0.85 + ay * 0.15;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      drawParticle(ctx, p, shape, particleColor(p, colorMode, baseColor, t));
    }

    if (playingRef.current) animRef.current = requestAnimationFrame(tick);
  }, [pattern, shape, colorMode, baseColor, bgColor, speed, hoverMode]);

  // Re-init when key params change
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    initParticles(pattern, customText, density, particleSize);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
    playingRef.current = true;
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [pattern, density, particleSize, customText, initParticles, tick, bgColor]);

  // ── Controls ──────────────────────────────────────────────────────────────
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

  const startRecording = () => {
    const canvas = canvasRef.current!;
    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'particles.webm'; a.click();
      URL.revokeObjectURL(url);
    };
    recorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  const snapshot = () => {
    const a = document.createElement('a');
    a.href = canvasRef.current!.toDataURL('image/png');
    a.download = 'particles.png';
    a.click();
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    mouseRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      active: true,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  // ── UI definitions ─────────────────────────────────────────────────────────
  const PATTERNS: { id: PatternType; label: string; icon: string }[] = [
    { id: 'flower',    label: 'Flower',    icon: '✿' },
    { id: 'vortex',    label: 'Vortex',    icon: '🌀' },
    { id: 'lissajous', label: 'Knot',      icon: '∞' },
    { id: 'wave',      label: 'Wave',      icon: '〜' },
    { id: 'spiral',    label: 'Spiral',    icon: 'φ' },
    { id: 'noise',     label: 'Noise',     icon: '≈' },
    { id: 'starfield', label: 'Stars',     icon: '✦' },
    { id: 'text',      label: 'Text',      icon: 'Aa' },
  ];

  const SHAPES: { id: ParticleShape; icon: string }[] = [
    { id: 'circle', icon: '●' }, { id: 'dot', icon: '·' },
    { id: 'square', icon: '■' }, { id: 'star', icon: '★' },
    { id: 'line',   icon: '─' },
  ];

  const COLOR_MODES: { id: ColorMode; label: string; preview: string }[] = [
    { id: 'rainbow', label: 'Rainbow', preview: 'linear-gradient(135deg,#ff0,#f0f,#0ff)' },
    { id: 'neon',    label: 'Neon',    preview: 'linear-gradient(135deg,#39ff14,#ff006e)' },
    { id: 'fire',    label: 'Fire',    preview: 'linear-gradient(135deg,#ff6a00,#ff0000)' },
    { id: 'ocean',   label: 'Ocean',   preview: 'linear-gradient(135deg,#00b4d8,#0077b6)' },
    { id: 'single',  label: 'Custom',  preview: baseColor },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16">
      <SEOHelmet
        title="Live Particle Canvas — Interactive Animated Particle Patterns"
        description="Create stunning animated particle patterns: flower, vortex, starfield, text and more. Interact with hover, record as video, export as PNG."
      />

      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto transform rotate-3">
          <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Live Particle Canvas</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Interactive particle animations with 8 flow patterns — hover to interact, record as video, export as PNG.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* ── LEFT panel ────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 w-full xl:w-52 space-y-3">

          {/* Pattern picker */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Pattern</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PATTERNS.map(p => (
                <button key={p.id} onClick={() => setPattern(p.id)}
                  className={`flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold transition-all ${pattern === p.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
                  <span className="text-sm">{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Text mode input */}
          {pattern === 'text' && (
            <Card className="p-4 dark:bg-gray-800/50">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Text</p>
              <input
                type="text"
                value={customText}
                maxLength={10}
                onChange={e => setCustomText(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1 text-center">Up to 10 chars</p>
            </Card>
          )}

          {/* Particle shape */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Shape</p>
            <div className="flex gap-1">
              {SHAPES.map(s => (
                <button key={s.id} onClick={() => setShape(s.id)}
                  className={`flex-1 py-2 rounded-xl text-sm transition-all ${shape === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50'}`}>
                  {s.icon}
                </button>
              ))}
            </div>
          </Card>

          {/* Density + Size + Speed */}
          <Card className="p-4 dark:bg-gray-800/50 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Density: {density}</label>
              <input type="range" min="300" max="4000" step="100" value={density} onChange={e => setDensity(+e.target.value)} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Size: {particleSize.toFixed(1)}px</label>
              <input type="range" min="0.5" max="8" step="0.5" value={particleSize} onChange={e => setParticleSize(+e.target.value)} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Speed: {speed.toFixed(1)}×</label>
              <input type="range" min="0.1" max="3" step="0.1" value={speed} onChange={e => setSpeed(+e.target.value)} className="w-full accent-blue-500" />
            </div>
          </Card>
        </div>

        {/* ── CENTER: Canvas ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="relative group rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: bgColor }}>
            <canvas
              ref={canvasRef}
              width={W} height={H}
              className="w-full block cursor-crosshair"
              style={{ aspectRatio: '1/1', maxHeight: '70vh' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white" /> REC
              </div>
            )}
            {/* Hover hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-80 transition-opacity bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
              {hoverMode === 'repel' ? '🖱 Hover to repel particles' : hoverMode === 'attract' ? '🖱 Hover to attract particles' : '🖱 Hover interaction off'}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={togglePlay} variant="secondary" className="gap-2 flex-1">
              {isPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play</>}
            </Button>
            <Button onClick={() => initParticles(pattern, customText, density, particleSize)}
              variant="secondary" className="gap-2 flex-1">
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
            {!isRecording ? (
              <Button onClick={startRecording} className="gap-2 flex-1 bg-red-600 hover:bg-red-700 text-white">
                <Video className="w-4 h-4" /> Record
              </Button>
            ) : (
              <Button onClick={stopRecording} className="gap-2 flex-1 bg-red-700 hover:bg-red-800 text-white animate-pulse">
                <StopCircle className="w-4 h-4" /> Stop & Save
              </Button>
            )}
            <Button onClick={snapshot} variant="secondary" className="gap-2 flex-1">
              <Download className="w-4 h-4" /> PNG
            </Button>
          </div>
        </div>

        {/* ── RIGHT panel ────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 w-full xl:w-52 space-y-3">

          {/* Color mode */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Color Mode</p>
            <div className="space-y-1.5">
              {COLOR_MODES.map(c => (
                <button key={c.id} onClick={() => setColorMode(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${colorMode === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
                  <span className="w-5 h-5 rounded-md flex-shrink-0" style={{ background: c.preview }} />
                  <span className="text-xs font-semibold">{c.label}</span>
                </button>
              ))}
            </div>
            {colorMode === 'single' && (
              <div className="flex items-center gap-2 mt-3">
                <input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer border-0 p-0" />
                <span className="text-xs text-gray-400">{baseColor}</span>
              </div>
            )}
          </Card>

          {/* Background color */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Background</p>
            <div className="flex items-center gap-3">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="w-9 h-9 rounded-xl cursor-pointer border-0 p-0 flex-shrink-0" />
              <div className="flex gap-1 flex-wrap">
                {['#05050f','#0a0a0a','#1a0a2e','#040d0a','#f5f5f5'].map(c => (
                  <button key={c} onClick={() => setBgColor(c)}
                    className={`w-6 h-6 rounded-md border-2 transition-all ${bgColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </Card>

          {/* Hover mode */}
          <Card className="p-4 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Hover Effect</p>
            <div className="space-y-1.5">
              {(['repel','attract','none'] as HoverMode[]).map(m => (
                <button key={m} onClick={() => setHoverMode(m)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold capitalize transition-all ${hoverMode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
                  {m === 'repel' ? '↖ Repel' : m === 'attract' ? '↘ Attract' : '○ No hover effect'}
                </button>
              ))}
            </div>
          </Card>

          {/* Info card */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>Record tip:</strong> Start recording, let the animation run a few seconds, then click Stop & Save to download a <code>.webm</code> video.
            </p>
          </Card>

          {/* Stats */}
          <Card className="p-4 dark:bg-gray-800/50 text-center">
            <p className="text-2xl font-black text-blue-500">{density.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">particles · {pattern}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
