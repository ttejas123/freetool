import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export const CursorGlow = () => {
  const [isMobile, setIsMobile] = useState(false);

  // Smooth springs for high-end feel
  const springX = useSpring(0, { stiffness: 100, damping: 25 });
  const springY = useSpring(0, { stiffness: 100, damping: 25 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e: MouseEvent) => {
      springX.set(e.clientX);
      springY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [springX, springY]);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.15] dark:opacity-[0.2]"
      >
        <div className="w-full h-full rounded-full bg-radial from-brand-500/80 via-transparent to-transparent blur-[80px]" />
      </motion.div>
      
      {/* Precision pointer dot */}
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="absolute w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
      />
    </div>
  );
};
