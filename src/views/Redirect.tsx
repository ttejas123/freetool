'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDatabase } from '@/services';

export function Redirect() {
  const searchParams = useSearchParams();
  const code = searchParams.get('c');

  useEffect(() => {
    async function performRedirect() {
      if (!code) {
        window.location.replace('/tinyurl-generator');
        return;
      }
      
      try {
        const db = await getDatabase();
        const originalUrl = await db.getShortUrl(code);
        
        if (originalUrl) {
          window.location.replace(originalUrl);
        } else {
          // If not found, go back home
          window.location.replace('/tinyurl-generator');
        }
      } catch (err) {
        window.location.replace('/tinyurl-generator');
      }
    }
    
    performRedirect();
  }, [code]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900 absolute top-0 left-0 z-50">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
        <p className="text-gray-500 font-medium tracking-wide">Redirecting...</p>
      </div>
    </div>
  );
}
