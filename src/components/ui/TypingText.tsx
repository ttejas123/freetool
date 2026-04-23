'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface TypingTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const TypingText = ({ text, className = "", delay = 0 }: TypingTextProps) => {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: any;

    const type = () => {
      if (currentIndex <= text.length && textRef.current) {
        textRef.current.textContent = text.slice(0, currentIndex);
        currentIndex++;
        timeoutId = setTimeout(type, 40);
      }
    };

    const startTimeout = setTimeout(type, delay);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
    };
  }, [text, delay]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <span ref={textRef}></span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-[2px] h-[1em] bg-brand-500 ml-1 translate-y-[2px]"
      />
    </motion.span>
  );
};
