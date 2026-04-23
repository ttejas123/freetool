'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

export const BackgroundEffects = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, radius: 150 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 7000); // Slightly more particles
      
      const themeColor = document.documentElement.classList.contains('dark') ? '59, 130, 246' : '37, 99, 235';

      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2.5 + 0.5; // Slightly larger
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: (Math.random() - 0.5) * 0.8,
          color: `rgba(${themeColor}, ${Math.random() * 0.6 + 0.4})`, // Even more opaque
          opacity: Math.random() * 0.7 + 0.3, // Even more opaque
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        // Antigravity random motion
        p.x += p.speedX;
        p.y += p.speedY;

        // Mouse repulsion
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseRef.current.radius) {
          const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force * 5;
          p.y -= Math.sin(angle) * force * 5;
        }

        // Screen boundaries
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        
        // Connect nearby particles (increased visibility)
        particles.forEach((p2) => {
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          
          if (dist2 < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 * (1 - dist2 / 120)})`; // Even more visible lines
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleResize = () => {
      init();
    };

    init();
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Background Mesh Grid (Maximum Visibility) */}
      <div className="absolute inset-0 mesh-grid opacity-[0.2] dark:opacity-[0.3]" />
      <div className="absolute inset-0 mesh-grid opacity-[0.1] dark:opacity-[0.15]" />
      <div className="absolute inset-0 mesh-grid opacity-[0.05] dark:opacity-[0.1]" />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-100 dark:opacity-95"
      />
      
      {/* Dynamic Glow Orbs (High Intensity) */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-500/15 blur-[120px] rounded-full animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent-purple/10 blur-[120px] rounded-full animate-float" />
    </div>
  );
};
