/**
 * Supabase Storage Adapter
 * ─────────────────────────
 * Implements StorageService using Supabase Storage.
 *
 * Required env vars:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   VITE_SUPABASE_STORAGE_BUCKET  (default: 'upload')
 */
import type { StorageService, UploadResult } from './types';

export class SupabaseStorageAdapter implements StorageService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private readonly bucket: string;

  constructor() {
    this.bucket = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string) || 'upload';
  }

  private async getClient() {
    if (this.client) return this.client;
    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    );
    return this.client;
  }

  async upload(file: File | Blob, path = 'upload/'): Promise<UploadResult> {
    const supabase = await this.getClient();
    const name = file instanceof File ? file.name : `blob-${Date.now()}`;
    const key = `${path}${Date.now()}-${name}`;

    const { error } = await supabase.storage.from(this.bucket).upload(key, file);
    if (error) throw new Error(`Supabase upload: ${error.message}`);

    const { data } = supabase.storage.from(this.bucket).getPublicUrl(key);
    return { url: data.publicUrl, key };
  }

  async delete(key: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.storage.from(this.bucket).remove([key]);
    if (error) throw new Error(`Supabase delete: ${error.message}`);
  }

  getUrl(key: string): string {
    const base = import.meta.env.VITE_SUPABASE_URL as string;
    return `${base}/storage/v1/object/public/${this.bucket}/${key}`;
  }
}
