'use client';

import { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  dataAdSlot?: string;
  className?: string;
}

export const AdBanner = ({ dataAdSlot = 'XXXXXXXXXX', className = '' }: AdBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load slightly before it comes into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !hasError) {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        // Only push if the banner hasn't been filled yet.
        const ins = containerRef.current?.querySelector('ins');
        if (ins && !ins.getAttribute('data-adsbygoogle-status')) {
          adsbygoogle.push({});
        }
      } catch (e) {
        console.error('AdSense failed to load', e);
        setHasError(true);
      }
    }
  }, [isVisible, hasError]);

  if (hasError) return null;

  // We use `min-h-[90px]` only before it becomes visible to reserve space to prevent layout shifts.
  // Once it becomes visible, we remove it, so if AdSense fails and collapses the `ins`, the wrapper collapses too.
  return (
    <>
      {isVisible && (
    <div 
      ref={containerRef} 
      className={`w-full flex justify-center items-center my-4 ${!isVisible ? 'min-h-[90px]' : ''} ${className}`}
    >
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client="ca-pub-7730608662007708"
          data-ad-slot={dataAdSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
    </div>
      )}
    </>
  );
};
