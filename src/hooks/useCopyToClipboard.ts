'use client';

import { useState, useCallback } from 'react';
import { toast } from '../store/toastStore';

export function useCopyToClipboard(timeout = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    (text: string) => {
      if (!navigator?.clipboard) {
        toast.error('Clipboard not supported');
        return false;
      }
      try {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setIsCopied(false), timeout);
        return true;
      } catch (error) {
        toast.error('Failed to copy');
        setIsCopied(false);
        return false;
      }
    },
    [timeout]
  );

  return { isCopied, copyToClipboard };
}
