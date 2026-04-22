import { useEffect, useRef } from 'react';

/**
 * Lightweight IntersectionObserver hook — replaces framer-motion's whileInView.
 * Adds the class "in-view" to the element when it enters the viewport.
 */
export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('in-view');
        observer.disconnect(); // once: true equivalent
      }
    }, { threshold: 0.15, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
