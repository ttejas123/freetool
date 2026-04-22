'use client';

import { useState, useEffect } from 'react';
import { initGA } from '@/lib/analytics';

export const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    } else if (consent === 'granted') {
      initGA();
    }
  }, []);

  if (!show) return null;

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'granted');
    setShow(false);
    initGA();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-[100] flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-700 dark:text-gray-300 flex-1">
        We use cookies to analyze traffic and show non-intrusive ads. 
        Please accept to support our platform.
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleDecline}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Decline
        </button>
        <button 
          onClick={handleAccept}
          className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-md transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
};
