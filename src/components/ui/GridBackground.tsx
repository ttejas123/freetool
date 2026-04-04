import { motion } from 'framer-motion';

export const GridBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 mesh-grid mesh-grid-faded opacity-[0.03] dark:opacity-[0.05]" />
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
           key={i}
           className="absolute rounded-full bg-brand-500/20 blur-3xl"
           initial={{ 
             width: Math.random() * 300 + 100,
             height: Math.random() * 300 + 100,
             x: Math.random() * 100 + '%',
             y: Math.random() * 100 + '%',
             opacity: 0.1
           }}
           animate={{ 
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
           }}
           transition={{ 
             duration: Math.random() * 10 + 20, 
             repeat: Infinity,
             ease: "linear"
           }}
        />
      ))}
    </div>
  );
};
