import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeFilename(filename: string): string {
  if (!filename) return `file-${Date.now()}`;
  
  // Normalize Unicode characters (e.g., é -> e) and remove diacritics
  const normalized = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Get extension (if any)
  const parts = normalized.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
  const nameWithoutExt = parts.join('_'); // Replace dots in filename with underscores

  const sanitized = nameWithoutExt
    .replace(/\s+/g, '_')           // Spaces to underscores
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Remove everything except alphanumeric, dash, and underscore
    .replace(/_{2,}/g, '_')         // Collapse multiple underscores
    .replace(/^_+|_+$/g, '');       // Trim underscores from start/end

  const finalName = sanitized || 'file';

  return ext ? `${finalName}.${ext}` : finalName;
}
