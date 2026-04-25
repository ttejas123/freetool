'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export const GridBackground = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const generated = [...Array(6)].map((_, i) => ({
      id: i,
      initial: {
        width: Math.random() * 300 + 100,
        height: Math.random() * 300 + 100,
        x: Math.random() * 100 + '%',
        y: Math.random() * 100 + '%',
        opacity: 0.1
      },
      animate: {
        x: [
          Math.random() * 100 + '%',
          Math.random() * 100 + '%',
          Math.random() * 100 + '%'
        ],
        y: [
          Math.random() * 100 + '%',
          Math.random() * 100 + '%',
          Math.random() * 100 + '%'
        ],
        opacity: [0.05, 0.15, 0.05]
      },
      duration: Math.random() * 10 + 20
    }));
    // Defer to avoid cascading render lint error
    setTimeout(() => {
      setParticles(generated);
    }, 0);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 mesh-grid mesh-grid-faded opacity-[0.03] dark:opacity-[0.05]" />
      
      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
           key={p.id}
           className="absolute rounded-full bg-brand-500/20 blur-3xl"
           initial={p.initial}
           animate={p.animate}
           transition={{ 
             duration: p.duration, 
             repeat: Infinity,
             ease: "linear"
           }}
        />
      ))}
    </div>
  );
};
