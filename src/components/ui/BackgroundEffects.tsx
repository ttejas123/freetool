'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

export const BackgroundEffects = () => {
  const { theme } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const draw = () => {
      const isDark = theme === 'dark';
      const accentColor = isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)';
      const purpleColor = isDark ? 'rgba(147, 51, 234, 0.12)' : 'rgba(147, 51, 234, 0.08)';
      const pinkColor = isDark ? 'rgba(236, 72, 153, 0.12)' : 'rgba(236, 72, 153, 0.08)';

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 1. Clear background
      ctx.fillStyle = isDark ? '#050505' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw mesh grid
      ctx.beginPath();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.035)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // 3. Draw subtle static orbs for depth
      const drawOrb = (x: number, y: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      
      drawOrb(canvas.width * 0.35, canvas.height * 0.4, 900, accentColor);
      drawOrb(canvas.width * 0.65, canvas.height * 0.4, 900, purpleColor);
      drawOrb(canvas.width * 0.5, canvas.height * 0.6, 1000, pinkColor);
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#050505] opacity-50" />
    </div>
  );
};
