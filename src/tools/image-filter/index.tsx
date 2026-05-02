'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { Upload, Download, Trash2, Wand2, Sliders, Scissors, Eraser, LayoutTemplate, ChevronRight, ChevronLeft, Maximize2, Minimize2, RotateCw, FlipHorizontal, Smile, X, Check, MoreHorizontal, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEOHelmet } from '@/components/SEOHelmet';
import { applyWebGPUFilter } from './webgpu-filters';
import { motion, AnimatePresence } from 'framer-motion';
import { removeBackground } from '@imgly/background-removal';
import { CARD_TEMPLATES } from './templates';
import Cropper, { Area, Point } from 'react-easy-crop';


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

interface Layer {
  id: string;
  type: 'image' | 'text' | 'emoji';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  filter: Filter | 'none';
  strength: number;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  isVisible: boolean;
  textStyle?: {
    bold: boolean;
    italic: boolean;
    fontFamily?: 'serif' | 'sans-serif' | 'monospace' | 'cursive';
  };
}

export default function ImageFilter() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [history, setHistory] = useState<Layer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'filters' | 'adjust' | 'edit' | 'transform' | 'text'>('layers');
  const [isComparing, setIsComparing] = useState(false);
  
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const addToHistory = useCallback((currentLayers: Layer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...currentLayers]);
    if (newHistory.length > 50) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayers(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayers(history[historyIndex + 1]);
    }
  };

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const newLayer: Layer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image',
      content: url,
      x: 0, y: 0, width: 100, height: 100,
      rotation: 0, opacity: 1,
      filter: 'none', strength: 50,
      adjustments: { brightness: 0, contrast: 1, saturation: 1 },
      isVisible: true
    };
    const updatedLayers = [...layers, newLayer];
    setLayers(updatedLayers);
    setSelectedLayerId(newLayer.id);
    addToHistory(updatedLayers);
  }, [layers, addToHistory]);

  useFilePaste((files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  const renderScene = useCallback(async () => {
    if (layers.length === 0 || !renderCanvasRef.current) return;
    setIsProcessing(true);

    const canvas = renderCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    
    // Base size on first image layer or default
    const firstImg = layers.find(l => l.type === 'image');
    if (firstImg) {
      const img = new Image();
      img.src = firstImg.content;
      await new Promise(r => img.onload = r);
      canvas.width = img.width;
      canvas.height = img.height;
    } else {
      canvas.width = 1200;
      canvas.height = 1200;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const layer of layers) {
      if (!layer.isVisible) continue;
      
      ctx.save();
      const lx = (layer.x * canvas.width) / 100;
      const ly = (layer.y * canvas.height) / 100;
      const lw = (layer.width * canvas.width) / 100;
      const lh = (layer.height * canvas.height) / 100;

      ctx.translate(lx + lw/2, ly + lh/2);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.globalAlpha = layer.opacity;

      if (layer.type === 'image') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = layer.content;
        await new Promise(r => img.onload = r);

        // Create temporary canvas for WebGPU processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tctx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
        tctx.drawImage(img, 0, 0);

        let processedCanvas: HTMLCanvasElement;
        if (layer.filter !== 'none') {
          processedCanvas = await applyWebGPUFilter(tempCanvas, layer.filter, layer.strength, layer.adjustments) || tempCanvas;
        } else {
          processedCanvas = await applyWebGPUFilter(tempCanvas, 'none', 0, layer.adjustments) || tempCanvas;
        }

        ctx.drawImage(processedCanvas, -lw/2, -lh/2, lw, lh);
      } else if (layer.type === 'emoji' || layer.type === 'text') {
        const fontSize = (layer.height * canvas.height) / 100;
        ctx.font = `${layer.textStyle?.italic ? 'italic ' : ''}${layer.textStyle?.bold ? 'bold ' : ''}${fontSize}px ${layer.textStyle?.fontFamily || 'serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(layer.content, 0, 0);
      }
      ctx.restore();
    }

    canvas.toBlob(blob => {
      if (blob) setOutputUrl(URL.createObjectURL(blob));
      setIsProcessing(false);
    }, 'image/png');
  }, [layers]);

  useEffect(() => {
    const timer = setTimeout(renderScene, 300);
    return () => clearTimeout(timer);
  }, [renderScene]);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw', 'ne', 'sw', 'se'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, lx: 0, ly: 0, lw: 0, lh: 0 });

  const handleMouseDown = (e: React.MouseEvent, layerId: string, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se' = 'move') => {
    e.stopPropagation();
    setSelectedLayerId(layerId);
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    if (mode === 'move') setIsDragging(true);
    else setIsResizing(mode);

    setDragStart({ 
      x: e.clientX, 
      y: e.clientY, 
      lx: layer.x, 
      ly: layer.y, 
      lw: layer.width, 
      lh: layer.height 
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!selectedLayerId) return;

    const dx = ((e.clientX - dragStart.x) / (workspaceRef.current?.clientWidth || 1)) * 100;
    const dy = ((e.clientY - dragStart.y) / (workspaceRef.current?.clientHeight || 1)) * 100;

    setLayers(prev => prev.map(l => {
      if (l.id !== selectedLayerId) return l;
      
      if (isDragging) {
        return { ...l, x: dragStart.lx + dx, y: dragStart.ly + dy };
      }
      
      if (isResizing) {
        let { x, y, width, height } = l;
        if (isResizing.includes('e')) width = dragStart.lw + dx;
        if (isResizing.includes('s')) height = dragStart.lh + dy;
        if (isResizing.includes('w')) { x = dragStart.lx + dx; width = dragStart.lw - dx; }
        if (isResizing.includes('n')) { y = dragStart.ly + dy; height = dragStart.lh - dy; }
        return { ...l, x, y, width, height };
      }
      return l;
    }));
  }, [isDragging, isResizing, dragStart, selectedLayerId]);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(null);
      addToHistory(layers);
    }
  }, [isDragging, isResizing, layers, addToHistory]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const addText = (type: 'text' | 'emoji', content: string) => {
    const newLayer: Layer = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      x: 40, y: 40, width: 20, height: 20,
      rotation: 0, opacity: 1,
      filter: 'none', strength: 50,
      adjustments: { brightness: 0, contrast: 1, saturation: 1 },
      isVisible: true,
      textStyle: { bold: false, italic: false, fontFamily: 'serif' }
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    addToHistory(updated);
  };

  return (
    <div className="w-full mx-auto animate-in fade-in duration-500 min-h-[80vh] flex flex-col items-center py-12">
      <SEOHelmet
        title="Pro Canvas Editor — Multi-Layer Image Filtering & Design"
        description="Professional layer-based image editor with WebGPU filters, stickers, text, and undo/redo history."
      />

      <AnimatePresence>
        {!isEditorOpen ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl flex flex-col items-center space-y-12"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-pink-100 dark:bg-pink-900/30 rounded-3xl flex items-center justify-center mx-auto transform rotate-6">
                <Wand2 className="w-10 h-10 text-pink-600" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight">Pro Design <span className="text-pink-600">Canvas</span></h1>
              <p className="text-gray-500 max-w-lg mx-auto text-lg">Upload images, add text, and apply WebGPU filters in a professional layer-based workspace.</p>
            </div>

            <Card 
              className="p-20 dark:bg-gray-800/50 w-full cursor-pointer border-2 border-dashed border-pink-200 dark:border-pink-900/30 hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition-all group"
              onClick={() => fileInputRef.current?.click()}
              onDrop={e => { 
                e.preventDefault(); 
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file); 
              }}
              onDragOver={e => e.preventDefault()}
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-pink-500" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Drop your image here</p>
                  <p className="text-gray-400 mt-2">or click to browse from computer</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </Card>

            {layers.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center gap-6">
                <div className="flex -space-x-4">
                  {layers.filter(l => l.type === 'image').slice(0, 5).map(l => (
                    <img key={l.id} src={l.content} className="w-16 h-16 rounded-xl border-4 border-white dark:border-gray-900 object-cover" />
                  ))}
                </div>
                <Button size="lg" className="h-16 px-12 rounded-2xl bg-pink-600 hover:bg-pink-700 text-lg font-bold shadow-2xl shadow-pink-500/30" onClick={() => setIsEditorOpen(true)}>
                  Open Pro Editor ({layers.length} Layers)
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-950 flex flex-col text-white overflow-hidden"
          >
            {/* Top Bar */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-xl z-50">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-bold tracking-tight text-sm uppercase hidden md:block">Pro Canvas</h2>
                </div>
                
                <div className="h-6 w-[1px] bg-white/10" />
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={undo} disabled={historyIndex <= 0}
                    className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={redo} disabled={historyIndex >= history.length - 1}
                    className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${isComparing ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  Compare Original
                </button>
                
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                  {['png', 'jpg', 'webp'].map(fmt => (
                    <button 
                      key={fmt}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = outputUrl || '';
                        link.download = `pro-design.${fmt}`;
                        link.click();
                      }}
                      className="px-4 py-2 text-[10px] font-bold uppercase hover:bg-pink-600 rounded-lg transition-all"
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Tools */}
              <div className="w-20 border-r border-white/10 flex flex-col items-center py-8 gap-8 bg-gray-900/30">
                {[
                  { id: 'layers', icon: LayoutTemplate, label: 'Layers' },
                  { id: 'filters', icon: Wand2, label: 'Filters' },
                  { id: 'adjust', icon: Sliders, label: 'Adjust' },
                  { id: 'text', icon: Smile, label: 'Elements' },
                  { id: 'transform', icon: RotateCw, label: 'Layout' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`group flex flex-col items-center gap-2 transition-all ${activeTab === item.id ? 'text-pink-500' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <div className={`p-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-pink-500/15 ring-1 ring-pink-500/50' : 'group-hover:bg-white/5'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 bg-gray-950 relative flex items-center justify-center p-12 overflow-hidden">
                <div 
                  ref={workspaceRef}
                  className="relative bg-gray-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden flex items-center justify-center"
                  style={{ 
                    width: 'min(90%, 1000px)', 
                    height: 'min(90%, 700px)',
                    position: 'relative'
                  }}
                >
                  <AnimatePresence>
                    {isComparing && layers.find(l => l.type === 'image') && (
                      <motion.img 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        src={layers.find(l => l.type === 'image')?.content} 
                        className="absolute inset-0 w-full h-full object-contain z-[100] bg-gray-950" 
                      />
                    )}
                  </AnimatePresence>

                  {layers.map(layer => (
                    <div
                      key={layer.id}
                      onMouseDown={(e) => handleMouseDown(e, layer.id)}
                      className={`absolute cursor-move select-none ${selectedLayerId === layer.id ? 'z-40' : 'z-10'} ${!layer.isVisible ? 'opacity-0 pointer-events-none' : ''}`}
                      style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        width: `${layer.width}%`,
                        height: `${layer.height}%`,
                        transform: `rotate(${layer.rotation}deg)`,
                        opacity: layer.opacity
                      }}
                    >
                      <div className="w-full h-full relative group">
                        {layer.type === 'image' ? (
                          <img src={layer.content} className="w-full h-full object-contain" draggable={false} />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center drop-shadow-2xl overflow-hidden"
                            style={{ 
                              fontSize: `${layer.height * 5}px`, // Simple scaling
                              fontWeight: layer.textStyle?.bold ? 'bold' : 'normal',
                              fontStyle: layer.textStyle?.italic ? 'italic' : 'normal',
                              fontFamily: layer.textStyle?.fontFamily || 'serif',
                              lineHeight: 1
                            }}
                          >
                            {layer.content}
                          </div>
                        )}

                        {selectedLayerId === layer.id && (
                          <div className="absolute -inset-1 border-2 border-pink-500 rounded-sm pointer-events-none">
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-pink-500 rounded-full pointer-events-auto cursor-nw-resize" onMouseDown={(e) => handleMouseDown(e, layer.id, 'nw')} />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-pink-500 rounded-full pointer-events-auto cursor-ne-resize" onMouseDown={(e) => handleMouseDown(e, layer.id, 'ne')} />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-pink-500 rounded-full pointer-events-auto cursor-sw-resize" onMouseDown={(e) => handleMouseDown(e, layer.id, 'sw')} />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-pink-500 rounded-full pointer-events-auto cursor-se-resize" onMouseDown={(e) => handleMouseDown(e, layer.id, 'se')} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Floating Contextual Toolbar */}
                  {selectedLayer && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, x: '-50%' }} 
                      animate={{ opacity: 1, y: 0, x: '-50%' }}
                      className="absolute z-[100] bg-black/80 border border-white/20 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 flex items-center gap-2 pointer-events-auto"
                      style={{
                        left: `${selectedLayer.x + selectedLayer.width / 2}%`,
                        top: `${selectedLayer.y}%`,
                        marginTop: '-24px',
                        transform: 'translate(-50%, -100%)',
                        minWidth: 'max-content'
                      }}
                      onMouseDown={e => e.stopPropagation()}
                    >
                      {selectedLayer.type === 'text' && (
                        <>
                          <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                            <button 
                              onClick={() => {
                                const updated = layers.map(l => l.id === selectedLayerId ? { ...l, textStyle: { ...l.textStyle!, bold: !l.textStyle?.bold } } : l);
                                setLayers(updated); addToHistory(updated);
                              }}
                              className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${selectedLayer.textStyle?.bold ? 'bg-pink-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
                            >
                              B
                            </button>
                            <button 
                              onClick={() => {
                                const updated = layers.map(l => l.id === selectedLayerId ? { ...l, textStyle: { ...l.textStyle!, italic: !l.textStyle?.italic } } : l);
                                setLayers(updated); addToHistory(updated);
                              }}
                              className={`w-10 h-10 rounded-lg text-sm italic transition-all ${selectedLayer.textStyle?.italic ? 'bg-pink-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
                            >
                              I
                            </button>
                          </div>
                          
                          <div className="h-6 w-[1px] bg-white/10 mx-1" />
                          
                          <select 
                            value={selectedLayer.textStyle?.fontFamily}
                            onChange={(e) => {
                              const updated = layers.map(l => l.id === selectedLayerId ? { ...l, textStyle: { ...l.textStyle!, fontFamily: e.target.value as any } } : l);
                              setLayers(updated); addToHistory(updated);
                            }}
                            className="bg-white/5 px-4 h-10 rounded-xl text-[10px] uppercase font-black tracking-widest outline-none cursor-pointer hover:bg-white/10 text-pink-500 transition-all appearance-none text-center min-w-[120px]"
                          >
                            {['serif', 'sans-serif', 'monospace', 'cursive'].map(f => <option key={f} value={f} className="bg-gray-900">{f}</option>)}
                          </select>
                        </>
                      )}

                      <div className="h-6 w-[1px] bg-white/10 mx-1" />
                      
                      <button 
                        onClick={() => {
                          const updated = layers.filter(l => l.id !== selectedLayerId);
                          setLayers(updated); setSelectedLayerId(null); addToHistory(updated);
                        }}
                        className="w-10 h-10 flex items-center justify-center hover:bg-red-500/20 text-red-500 rounded-xl transition-all group"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110" />
                      </button>
                    </motion.div>
                  )}
                </div>

                {isProcessing && (
                  <div className="absolute bottom-8 right-8 flex items-center gap-3 bg-pink-600 px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-4">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Rendering...</span>
                  </div>
                )}
              </div>

              {/* Right Panel */}
              <div className="w-80 border-l border-white/10 bg-gray-900/50 backdrop-blur-xl p-6 overflow-y-auto z-50">
                <AnimatePresence mode="wait">
                  {activeTab === 'layers' && (
                    <motion.div key="layers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Layers</h3>
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/5 rounded-lg text-pink-500">
                          <Plus className="w-4 h-4" />
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                      </div>
                      
                      <div className="space-y-2">
                        {layers.map((layer) => (
                          <div 
                            key={layer.id}
                            onClick={() => setSelectedLayerId(layer.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedLayerId === layer.id ? 'bg-pink-600/10 border-pink-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                          >
                            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl overflow-hidden">
                              {layer.type === 'image' ? <img src={layer.content} className="w-full h-full object-cover" /> : layer.content}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase truncate">{layer.type} layer</p>
                              <p className="text-[8px] text-gray-500 uppercase">Pos: {Math.round(layer.x)},{Math.round(layer.y)}</p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); const updated = layers.filter(l => l.id !== layer.id); setLayers(updated); addToHistory(updated); }}
                              className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {selectedLayer && (activeTab === 'filters' || activeTab === 'adjust' || activeTab === 'text') && (
                    <motion.div key="props" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                      {selectedLayer.type === 'text' && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Edit Text</h3>
                          <textarea 
                            value={selectedLayer.content}
                            onChange={(e) => {
                              const updated = layers.map(l => l.id === selectedLayerId ? { ...l, content: e.target.value } : l);
                              setLayers(updated);
                            }}
                            onBlur={() => addToHistory(layers)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:ring-2 ring-pink-500 outline-none h-24 resize-none"
                            placeholder="Enter text..."
                          />
                        </div>
                      )}

                      {activeTab === 'filters' && selectedLayer.type === 'image' && (
                        <div className="space-y-6">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Filters</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, filter: 'none' } : l))}
                              className={`p-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${selectedLayer.filter === 'none' ? 'bg-pink-600 border-pink-500 shadow-lg shadow-pink-500/20' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                              None
                            </button>
                            {FILTERS.map(f => (
                              <button key={f.id} onClick={() => setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, filter: f.id } : l))}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${selectedLayer.filter === f.id ? 'bg-pink-600 border-pink-500 shadow-lg shadow-pink-500/20' : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-400'}`}>
                                <span className="text-xl">{f.emoji}</span>
                                <span className="text-[8px] font-bold uppercase">{f.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'adjust' && (
                        <div className="space-y-8">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Tune Layer</h3>
                          {[
                            { id: 'brightness', label: 'Brightness', min: -0.5, max: 0.5 },
                            { id: 'contrast', label: 'Contrast', min: 0.5, max: 1.5 },
                            { id: 'saturation', label: 'Saturation', min: 0, max: 2 },
                          ].map(adj => (
                            <div key={adj.id} className="space-y-4">
                              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                                <span>{adj.label}</span>
                                <button onClick={() => setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, adjustments: { ...l.adjustments, [adj.id]: adj.id === 'brightness' ? 0 : 1 } } : l))} className="text-pink-500/50 hover:text-pink-500">Reset</button>
                              </div>
                              <input 
                                type="range" min={adj.min} max={adj.max} step="0.01" 
                                value={selectedLayer.adjustments[adj.id as keyof typeof selectedLayer.adjustments]} 
                                onChange={e => setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, adjustments: { ...l.adjustments, [adj.id]: +e.target.value } } : l))}
                                onMouseUp={() => addToHistory(layers)}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none accent-pink-500" 
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'text' && (
                    <motion.div key="elements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Add Elements</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {['🔥', '❤️', '✨', '🚀', '⭐', '💯', '🎨', '📸', '💎', '🎉', '🌟', '🌈'].map(emoji => (
                          <button key={emoji} onClick={() => addText('emoji', emoji)} className="text-2xl p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125">{emoji}</button>
                        ))}
                      </div>
                      <Button variant="secondary" className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold uppercase" onClick={() => addText('text', 'Your Text Here')}>
                        <Plus className="w-4 h-4 mr-2" /> Add Text Layer
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={renderCanvasRef} className="hidden" />
    </div>
  );
}
