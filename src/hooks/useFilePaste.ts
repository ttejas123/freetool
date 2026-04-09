import { useEffect } from 'react';

/**
 * A hook that listens for global paste events and extracts files from the clipboard.
 * 
 * @param onFilesPasted Callback function that receives an array of pasted files.
 * @param enabled Optional boolean to enable/disable the listener.
 */
export function useFilePaste(onFilesPasted: (files: File[]) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        onFilesPasted(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesPasted, enabled]);
}
