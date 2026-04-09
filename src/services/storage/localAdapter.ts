/**
 * Local Storage Adapter
 * ─────────────────────
 * Implements StorageService using the browser's Blob Object URL API.
 * Uploaded files are stored as in-memory Object URLs for the current session.
 * Zero external dependencies — works on every browser.
 *
 * Note: Object URLs are tab-scoped and cleared on page close. For persistent
 * storage switch to a cloud provider (Supabase / R2 / S3).
 */
import type { StorageService, UploadResult } from './types';
import { sanitizeFilename } from '@/lib/utils';

// In-memory store: key → object URL
const store = new Map<string, string>();

export class LocalStorage implements StorageService {
  async upload(file: File | Blob, path = 'uploads/'): Promise<UploadResult> {
    const rawName = file instanceof File ? file.name : `blob-${Date.now()}`;
    const name = sanitizeFilename(rawName);
    const key = `${path}${Date.now()}-${name}`;
    const url = URL.createObjectURL(file);
    store.set(key, url);
    return { url, key };
  }

  async delete(key: string): Promise<void> {
    const url = store.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      store.delete(key);
    }
  }

  getUrl(key: string): string {
    return store.get(key) ?? '';
  }
}
