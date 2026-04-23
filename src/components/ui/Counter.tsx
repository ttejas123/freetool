'use client';

import { useEffect, useState, useRef } from 'react';
import { useInView, animate } from 'framer-motion';

interface CounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export const Counter = ({ value, duration = 2, suffix = "", className = "" }: CounterProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(spanRef, { once: true });

  useEffect(() => {
    if (isInView && spanRef.current) {
      const controls = animate(0, value, {
        duration,
        onUpdate: (latest) => {
          if (spanRef.current) {
            spanRef.current.textContent = Math.floor(latest).toLocaleString() + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [value, duration, isInView, suffix]);

  return (
    <span ref={spanRef} className={className}>
      0{suffix}
    </span>
  );
};
