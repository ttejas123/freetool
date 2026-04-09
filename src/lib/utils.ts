import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes a filename by:
 * 1. Replacing spaces with underscores
 * 2. Removing non-alphanumeric characters (keeps dots, dashes, underscores)
 * 3. Collapsing multiple underscores into one
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return `file-${Date.now()}`;
  
  // Get extension
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const nameWithoutExt = parts.join('.');

  const sanitized = nameWithoutExt
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, ''); // Trim underscores from start/end

  return ext ? `${sanitized}.${ext}` : sanitized;
}
