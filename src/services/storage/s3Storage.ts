/**
 * AWS S3 Storage Adapter
 * ───────────────────────
 * Implements StorageService using AWS S3.
 *
 * Required env vars:
 *   VITE_S3_REGION
 *   VITE_S3_ACCESS_KEY_ID
 *   VITE_S3_SECRET_ACCESS_KEY
 *   VITE_S3_BUCKET_NAME
 *   VITE_S3_PUBLIC_URL   (e.g. https://<bucket>.s3.<region>.amazonaws.com)
 */
import type { StorageService, UploadResult } from './types';
import { sanitizeFilename } from '@/lib/utils';

export class S3Storage implements StorageService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private s3: any = null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    this.bucket = import.meta.env.VITE_S3_BUCKET_NAME as string;
    this.publicUrl = import.meta.env.VITE_S3_PUBLIC_URL as string;
  }

  private async getClient() {
    if (this.s3) return this.s3;
    const { S3Client } = await import('@aws-sdk/client-s3');
    this.s3 = new S3Client({
      region: import.meta.env.VITE_S3_REGION as string,
      credentials: {
        accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY_ID as string,
        secretAccessKey: import.meta.env.VITE_S3_SECRET_ACCESS_KEY as string,
      },
    });
    return this.s3;
  }

  async upload(file: File | Blob, path = 'uploads/'): Promise<UploadResult> {
    const s3 = await this.getClient();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const rawName = file instanceof File ? file.name : `blob-${Date.now()}`;
    const name = sanitizeFilename(rawName);
    const key = `${path}${Date.now()}-${name}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
        ACL: 'public-read',
      }),
    );

    return { url: this.getUrl(key), key };
  }

  async delete(key: string): Promise<void> {
    const s3 = await this.getClient();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
