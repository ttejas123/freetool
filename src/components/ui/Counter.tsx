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
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration,
        onUpdate: (latest) => setCount(Math.floor(latest)),
      });
      return () => controls.stop();
    }
  }, [value, duration, isInView]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};
