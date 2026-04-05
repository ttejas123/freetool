import { useState, useRef, useEffect } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Button } from '../../components/ui/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { 
  RefreshCw, 
  Image as ImageIcon, 
  Settings, 
  Monitor, 
  Layout, 
  Smartphone, 
  Copy, 
  Check, 
  AlertCircle,
  Hash,
  Palette,
  Type
} from 'lucide-react';
import chroma from 'chroma-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type PaletteRole = 'primary' | 'secondary' | 'accent' | 'surface' | 'background';

interface ColorInfo {
  role: PaletteRole;
  hex: string;
}

// --- Constants ---
const KEYWORD_MAP: Record<string, string[]> = {
  'modern startup': ['#2563eb', '#7c3aed', '#f59e0b', '#f8fafc', '#0f172a'],
  'nature': ['#166534', '#15803d', '#84cc16', '#f0fdf4', '#064e3b'],
  'cyberpunk': ['#f0abfc', '#818cf8', '#22d3ee', '#1e1b4b', '#09090b'],
  'minimalist': ['#18181b', '#27272a', '#71717a', '#f4f4f5', '#ffffff'],
  'deep ocean': ['#0c4a6e', '#0369a1', '#0ea5e9', '#f0f9ff', '#082f49'],
  'sunset': ['#9d174d', '#be123c', '#fb923c', '#fff7ed', '#4c0519'],
  'lavender': ['#7c3aed', '#a78bfa', '#ddd6fe', '#f5f3ff', '#1e1b4b'],
  'forest': ['#064e3b', '#065f46', '#10b981', '#f0fdfa', '#022c22'],
};

const ROLES: PaletteRole[] = ['primary', 'secondary', 'accent', 'surface', 'background'];
const ROLE_LABELS: Record<PaletteRole, string> = {
  primary: 'Primary (Brand)',
  secondary: 'Secondary (Action)',
  accent: 'Accent (Detail)',
  surface: 'Surface (Cards)',
  background: 'Background (Base)',
};

export default function ColorPalette() {
  const [colors, setColors] = useState<ColorInfo[]>([
    { role: 'primary', hex: '#2563eb' },
    { role: 'secondary', hex: '#7c3aed' },
    { role: 'accent', hex: '#f59e0b' },
    { role: 'surface', hex: '#f8fafc' },
    { role: 'background', hex: '#ffffff' },
  ]);
  const [keyword, setKeyword] = useState('');
  const [activePreview, setActivePreview] = useState<'website' | 'dashboard' | 'mobile'>('website');
  const [showCopied, setShowCopied] = useState<string | null>(null);
  const { copyToClipboard } = useCopyToClipboard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- New Picker State ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<string>('#2563eb');
  const [magnifier, setMagnifier] = useState<{ x: number, y: number, color: string, show: boolean }>({
    x: 0,
    y: 0,
    color: '#000000',
    show: false
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw image to canvas for picking
  useEffect(() => {
    if (selectedImage && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Calculate scale to fit canvas while maintaining aspect ratio
            const maxWidth = canvas.parentElement?.clientWidth || 400;
            const maxHeight = 400;
            
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = selectedImage;
    }
  }, [selectedImage]);

  // --- Logic ---

  const generateFromKeyword = (query: string) => {
    const q = query.toLowerCase().trim();
    
    // Exact keyword match
    if (KEYWORD_MAP[q]) {
      applyPalette(KEYWORD_MAP[q]);
      return;
    }

    // Fuzzy keyword match
    const existingKey = Object.keys(KEYWORD_MAP).find(k => q.includes(k) || k.includes(q));
    if (existingKey) {
      applyPalette(KEYWORD_MAP[existingKey]);
      return;
    }

    // Try treating as a color seed
    try {
      if (chroma.valid(q)) {
        const seed = chroma(q);
        const palette = generateHarmoniousPalette(seed);
        applyPalette(palette);
      }
    } catch (e) {
      // Ignore invalid colors
    }
  };

  const generateHarmoniousPalette = (seed: chroma.Color) => {
    return [
      seed.hex(),
      seed.set('hsl.h', '+30').hex(),
      seed.set('hsl.h', '+180').hex(), // Complement
      seed.brighten(2.5).hex(),
      seed.darken(3).hex(),
    ];
  };

  const applyPalette = (hexArray: string[]) => {
    const newColors = ROLES.map((role, i) => ({
      role,
      hex: hexArray[i] || '#000000',
    }));
    setColors(newColors);
  };

  const shufflePalette = () => {
    const randomHue = Math.floor(Math.random() * 360);
    const seed = chroma.hsl(randomHue, 0.6, 0.5);
    applyPalette(generateHarmoniousPalette(seed));
  };

  const handleColorChange = (role: PaletteRole, newHex: string) => {
    if (!chroma.valid(newHex)) return;
    setColors(prev => prev.map(c => c.role === role ? { ...c, hex: newHex } : c));
  };

  const extractColorsFromImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSelectedImage(img.src);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);

        const imageData = ctx.getImageData(0, 0, 100, 100).data;
        const colorCounts: Record<string, number> = {};

        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const hex = chroma(r, g, b).hex();
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([hex]) => hex);

        // Filter for distinct colors
        const distinct: string[] = [];
        for (const hex of sortedColors) {
          if (distinct.length >= 5) break;
          // Use deltaE if available, otherwise just check hex
          if (distinct.every(d => chroma.deltaE(d, hex) > 20)) {
            distinct.push(hex);
          }
        }

        if (distinct.length > 0) applyPalette(distinct);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale coordinates to actual canvas internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const actualX = x * scaleX;
    const actualY = y * scaleY;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(actualX, actualY, 1, 1).data;
      const hex = chroma(pixel[0], pixel[1], pixel[2]).hex();
      setMagnifier({ x, y, color: hex, show: true });
    } catch (err) {
      // Out of bounds or other canvas issue
    }
  };

  const handleImageClick = () => {
    if (magnifier.show) {
      setPickedColor(magnifier.color);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) extractColorsFromImage(file);
      }
    }
  };

  const getContrastScore = (color: string, bg: string) => {
    const contrast = chroma.contrast(color, bg);
    if (contrast >= 7) return { label: 'AAA', pass: true };
    if (contrast >= 4.5) return { label: 'AA', pass: true };
    if (contrast >= 3) return { label: 'Large Text Only', pass: true };
    return { label: 'Fail', pass: false };
  };

  const copyFormat = (format: 'hex' | 'rgb' | 'css' | 'tailwind') => {
    let text = '';
    if (format === 'hex') text = colors.map(c => c.hex).join(', ');
    if (format === 'rgb') text = colors.map(c => `rgb(${chroma(c.hex).rgb().join(', ')})`).join('\n');
    if (format === 'css') {
      text = ':root {\n' + colors.map(c => `  --color-${c.role}: ${c.hex};`).join('\n') + '\n}';
    }
    if (format === 'tailwind') {
      text = 'colors: {\n' + colors.map(c => `  ${c.role}: '${c.hex}',`).join('\n') + '\n}';
    }
    copyToClipboard(text);
    setShowCopied(format);
    setTimeout(() => setShowCopied(null), 2000);
  };

  // --- Sub-Components ---

  const PreviewComponent = () => {
    const p = colors.find(c => c.role === 'primary')?.hex || '#000';
    const s = colors.find(c => c.role === 'secondary')?.hex || '#000';
    const a = colors.find(c => c.role === 'accent')?.hex || '#000';
    const surf = colors.find(c => c.role === 'surface')?.hex || '#fff';
    const bg = colors.find(c => c.role === 'background')?.hex || '#fff';
    const isDark = chroma(bg).luminance() < 0.5;
    const text = isDark ? '#ffffff' : '#0f172a';

    const renderPreview = () => {
      if (activePreview === 'website') {
        return (
          <div className="w-full h-full p-8 rounded-xl overflow-auto border border-gray-200 dark:border-gray-800 transition-colors" style={{ backgroundColor: bg, color: text }}>
            <nav className="flex justify-between items-center mb-12">
              <div className="font-bold text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: p }} />
                Ozone
              </div>
              <div className="flex gap-4 text-sm font-medium">
                <span className="opacity-70">Features</span>
                <span className="opacity-70">Pricing</span>
                <button className="px-4 py-2 rounded-full text-white" style={{ backgroundColor: s }}>Sign Up</button>
              </div>
            </nav>
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-4xl font-extrabold tracking-tight">Level up your <span style={{ color: p }}>workflow</span> today.</h2>
              <p className="text-lg opacity-80">Everything you need to build, scale, and thrive in the modern web era.</p>
              <div className="flex justify-center gap-4">
                <button className="px-6 py-3 rounded-lg font-bold text-white shadow-lg" style={{ backgroundColor: p }}>Get Started</button>
                <button className="px-6 py-3 rounded-lg font-bold border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>Learn More</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-16">
              <div className="p-6 rounded-2xl shadow-sm border border-black/5" style={{ backgroundColor: surf }}>
                <div className="w-10 h-10 rounded-full mb-4 flex items-center justify-center text-white" style={{ backgroundColor: a }}>
                  <Monitor className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2">Cross Platform</h3>
                <p className="text-sm opacity-70">Run your apps anywhere with seamless synchronization.</p>
              </div>
              <div className="p-6 rounded-2xl shadow-sm border border-black/5" style={{ backgroundColor: surf }}>
                <div className="w-10 h-10 rounded-full mb-4 flex items-center justify-center text-white" style={{ backgroundColor: s }}>
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2">Fully Managed</h3>
                <p className="text-sm opacity-70">Don't worry about infrastructure, we handle the hard parts.</p>
              </div>
            </div>
          </div>
        );
      }

      if (activePreview === 'dashboard') {
        return (
          <div className="w-full h-full flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800" style={{ backgroundColor: bg, color: text }}>
            <div className="w-64 p-6 border-r border-black/5 flex flex-col gap-6" style={{ backgroundColor: surf }}>
              <div className="font-bold text-lg mb-4">Admin Pro</div>
              {['Overview', 'Analytics', 'Customers', 'Messages', 'Settings'].map((item, i) => (
                <div key={item} className={`flex items-center gap-3 text-sm p-3 rounded-xl transition-colors ${i === 1 ? 'text-white' : 'opacity-70'}`} 
                  style={i === 1 ? { backgroundColor: p } : {}}>
                  <Layout className="w-4 h-4" />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 p-8 space-y-8 overflow-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Analytics</h2>
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: surf }} />
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: p }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-6 rounded-2xl border border-black/5" style={{ backgroundColor: surf }}>
                    <div className="text-sm opacity-60 mb-1">Monthly Growth</div>
                    <div className="text-2xl font-bold" style={{ color: i === 1 ? p : text }}>+$24,500</div>
                    <div className="mt-4 h-2 w-full rounded-full bg-black/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ backgroundColor: i === 1 ? p : a, width: i === 1 ? '70%' : '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full h-64 rounded-2xl border border-black/5 p-6" style={{ backgroundColor: surf }}>
                <div className="font-bold mb-4">Traffic Performance</div>
                <div className="flex items-end gap-2 h-32">
                  {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-lg transition-transform hover:scale-105" 
                      style={{ height: `${h}%`, backgroundColor: i % 2 === 0 ? p : s }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (activePreview === 'mobile') {
          return (
            <div className="w-full h-full flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 rounded-xl">
               <div className="w-[300px] h-[600px] rounded-[3rem] border-[8px] border-gray-800 shadow-2xl relative overflow-hidden flex flex-col" style={{ backgroundColor: bg }}>
                  <div className="absolute top-0 inset-x-0 h-6 flex justify-center pt-1">
                    <div className="w-20 h-5 bg-gray-800 rounded-b-2xl" />
                  </div>
                  
                  <div className="mt-12 px-6 flex-1 flex flex-col">
                      <div className="mb-8">
                          <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center text-white" style={{ backgroundColor: p }}>
                              <Palette className="w-6 h-6" />
                          </div>
                          <h2 className="text-2xl font-bold" style={{ color: text }}>Welcome back!</h2>
                          <p className="text-sm opacity-60" style={{ color: text }}>Login to continue your journey.</p>
                      </div>
      
                      <div className="space-y-4 mb-8">
                          <div className="h-12 w-full rounded-xl border border-black/5 px-4 flex items-center text-sm" style={{ backgroundColor: surf, color: text }}>
                              Email Address
                          </div>
                          <div className="h-12 w-full rounded-xl border border-black/5 px-4 flex items-center text-sm" style={{ backgroundColor: surf, color: text }}>
                              Password
                          </div>
                      </div>
      
                      <button className="w-full h-12 rounded-xl text-white font-bold shadow-lg" style={{ backgroundColor: p }}>
                          Sign In
                      </button>
      
                      <div className="mt-6 flex flex-col gap-3">
                          <div className="text-center text-xs opacity-50 font-medium uppercase tracking-widest">Or login with</div>
                          <div className="flex gap-4">
                              <div className="flex-1 h-12 rounded-xl border border-black/5" style={{ backgroundColor: surf }} />
                              <div className="flex-1 h-12 rounded-xl border border-black/5" style={{ backgroundColor: surf }} />
                          </div>
                      </div>
                  </div>
      
                  <div className="p-6 border-t border-black/5 bg-gray-50/10 flex justify-between">
                      {[1,2,3,4].map(i => (
                          <div key={i} className="w-6 h-6 rounded-lg opacity-40" style={{ backgroundColor: i === 1 ? p : text }} />
                      ))}
                  </div>
               </div>
            </div>
          );
        }
      return null;
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key={activePreview}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          {renderPreview()}
        </motion.div>
      </AnimatePresence>
    );
  };

  // --- Render ---

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500" onPaste={handlePaste}>
      <SEOHelmet 
        title="Smart Color Palette V2 | Ozone" 
        description="Professional color palette generator. keyword to palette, image to palette, and real-time UI preview with contrast checker." 
      />

      {/* Hero / Header */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
          <Palette className="w-3 h-3" /> Tool Version 2.0
        </div>
        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">Smart Color <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Palette</span></h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">Generate stunning design systems using keywords, colors, or images. Instant UI previews and accessibility testing.</p>
        
        <div className="max-w-xl mx-auto relative mt-8">
            <input 
                type="text"
                placeholder='Try "Modern Startup", "Nature", or "#7c3aed"'
                className="w-full h-14 pl-12 pr-32 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 focus:border-blue-500 outline-none transition-all shadow-xl dark:text-white"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateFromKeyword(keyword)}
            />
            <Hash className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
            <button 
                onClick={() => generateFromKeyword(keyword)}
                className="absolute right-2 top-2 h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg active:scale-95"
            >
                Generate
            </button>
        </div>
      </section>

      {/* Toolbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Interactive Editor */}
        <div className="lg:col-span-5 space-y-8 sticky top-24">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                        <Settings className="w-5 h-5 text-blue-500" /> Palette Editor
                    </h3>
                    <Button onClick={shufflePalette} variant="secondary" size="sm" className="gap-2 rounded-xl">
                        <RefreshCw className="w-4 h-4" /> Shuffle
                    </Button>
                </div>

                <div className="space-y-4">
                    {colors.map((color) => {
                        const score = getContrastScore(color.hex, colors.find(c => c.role === 'background')?.hex || '#fff');
                        return (
                            <motion.div 
                                layout
                                key={color.role} 
                                className="flex items-center gap-4 group"
                            >
                                <div className="relative">
                                    <input 
                                        type="color" 
                                        value={color.hex} 
                                        onChange={(e) => handleColorChange(color.role, e.target.value)}
                                        className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">{ROLE_LABELS[color.role]}</div>
                                    <input 
                                        type="text" 
                                        value={color.hex}
                                        onChange={(e) => handleColorChange(color.role, e.target.value)}
                                        className="bg-transparent font-mono font-bold text-gray-900 dark:text-white focus:outline-none w-full"
                                    />
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${score.pass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {score.label}
                                    </div>
                                    <div className="text-[10px] opacity-40 font-mono mt-0.5">WCAG 2.1</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Image Color Picker</p>
                        {selectedImage && (
                            <button 
                                onClick={() => setSelectedImage(null)} 
                                className="text-xs text-blue-500 font-bold hover:underline"
                            >
                                Clear Image
                            </button>
                        )}
                    </div>

                    {!selectedImage ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-48 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                        >
                            <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <span className="text-xs font-medium text-gray-400">Click or Paste Image to Pick Colors</span>
                            <input 
                                type="file" 
                                hidden 
                                ref={fileInputRef} 
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && extractColorsFromImage(e.target.files[0])}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-crosshair">
                                <canvas 
                                    ref={canvasRef}
                                    onMouseMove={handleImageMouseMove}
                                    onMouseLeave={() => setMagnifier(prev => ({ ...prev, show: false }))}
                                    onClick={handleImageClick}
                                    className="block mx-auto max-w-full h-auto shadow-sm"
                                />
                                
                                <AnimatePresence>
                                    {magnifier.show && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="absolute pointer-events-none z-20 flex flex-col items-center gap-2"
                                            style={{ left: magnifier.x - 40, top: magnifier.y - 100 }}
                                        >
                                            <div 
                                                className="w-20 h-20 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden"
                                                style={{ backgroundColor: magnifier.color }}
                                            >
                                                <div className="bg-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm text-gray-900">{magnifier.color}</div>
                                            </div>
                                            <div className="w-1 h-8 bg-blue-500/50 rounded-full" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Picked Color & Shades */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="w-16 h-16 rounded-2xl shadow-lg border-2 border-white dark:border-gray-800"
                                        style={{ backgroundColor: pickedColor }}
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">Selected Color</div>
                                        <div className="text-lg font-black dark:text-white font-mono">{pickedColor}</div>
                                    </div>
                                    <div className="ml-auto flex gap-2">
                                        {ROLES.slice(0, 3).map(role => (
                                            <button 
                                                key={role}
                                                onClick={() => handleColorChange(role, pickedColor)}
                                                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all dark:text-white"
                                            >
                                                Use as {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Shades Gallery */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Tints & Shades</p>
                                    <div className="flex h-12 rounded-xl overflow-hidden shadow-sm">
                                        {[
                                            ...chroma.scale(['white', pickedColor]).colors(6).slice(1, 5),
                                            pickedColor,
                                            ...chroma.scale([pickedColor, 'black']).colors(6).slice(1, 5)
                                        ].map((color, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setPickedColor(color)}
                                                className="flex-1 transition-all hover:flex-[1.5] group relative"
                                                style={{ backgroundColor: color }}
                                            >
                                                <div className="absolute inset-x-0 bottom-1 opacity-0 group-hover:opacity-100 text-[8px] font-mono text-center mix-blend-difference invert">
                                                    {color}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={() => copyFormat('css')} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-sm font-bold transition-colors dark:text-white">
                        {showCopied === 'css' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} CSS Vars
                    </button>
                    <button onClick={() => copyFormat('tailwind')} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-sm font-bold transition-colors dark:text-white">
                        {showCopied === 'tailwind' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Tailwind
                    </button>
                </div>
            </div>
        </div>

        {/* Right: Previews */}
        <div className="lg:col-span-7 space-y-6">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
                <button 
                  onClick={() => setActivePreview('website')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activePreview === 'website' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                    <Monitor className="w-4 h-4" /> Website
                </button>
                <button 
                  onClick={() => setActivePreview('dashboard')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activePreview === 'dashboard' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                    <Layout className="w-4 h-4" /> Dashboard
                </button>
                <button 
                  onClick={() => setActivePreview('mobile')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activePreview === 'mobile' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                    <Smartphone className="w-4 h-4" /> Mobile
                </button>
            </div>

            <div className="aspect-[16/10] bg-gray-50 dark:bg-gray-950 rounded-[2.5rem] p-4 border border-gray-100 dark:border-gray-800 shadow-inner group relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    LIVE PREVIEW
                </div>
                <PreviewComponent />
            </div>

            {/* Accessibility / Stats Card */}
            <div className="p-8 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <AlertCircle className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Type className="w-6 h-6" />
                        <h3 className="text-xl font-black italic uppercase tracking-wider">Typography Check</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-blue-100 text-sm mb-4">Heading Contrast (Primary on Background)</p>
                            <div className="text-3xl font-bold mb-2" style={{ color: colors.find(c => c.role === 'primary')?.hex }}>Ozone Pro Regular</div>
                            <div className="text-sm opacity-80">This heading uses your brand primary color. It should be easily readable against the chosen background.</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                                <div className="text-4xl font-black mb-1">
                                    {chroma.contrast(colors.find(c => c.role === 'primary')?.hex || '#000', colors.find(c => c.role === 'background')?.hex || '#fff').toFixed(2)}:1
                                </div>
                                <div className="text-xs font-bold opacity-60">CONTRAST RATIO</div>
                            </div>
                            <div className="flex-1 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                                <div className="text-4xl font-black mb-1">
                                    {getContrastScore(colors.find(c => c.role === 'primary')?.hex || '#000', colors.find(c => c.role === 'background')?.hex || '#fff').label}
                                </div>
                                <div className="text-xs font-bold opacity-60">WCAG SCORE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
