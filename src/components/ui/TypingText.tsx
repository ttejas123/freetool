'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TypingTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const TypingText = ({ text, className = "", delay = 0 }: TypingTextProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }
    }, 40);

    return () => clearTimeout(timeout);
  }, [currentIndex, text, delay]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-[2px] h-[1em] bg-brand-500 ml-1 translate-y-[2px]"
      />
    </motion.span>
  );
};
