/**
 * Cloudflare R2 Storage Adapter
 * ──────────────────────────────
 * Implements StorageService using Cloudflare R2 (S3-compatible API).
 * Uses the AWS SDK v3 S3Client with a custom endpoint pointing to your R2 bucket.
 *
 * Required env vars:
 *   VITE_R2_ACCOUNT_ID
 *   VITE_R2_ACCESS_KEY_ID
 *   VITE_R2_SECRET_ACCESS_KEY
 *   VITE_R2_BUCKET_NAME
 *   VITE_R2_PUBLIC_URL   (e.g. https://pub-<hash>.r2.dev)
 */
import type { StorageService, UploadResult } from './types';

export class R2Storage implements StorageService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private s3: any = null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    this.bucket = import.meta.env.VITE_R2_BUCKET_NAME as string;
    this.publicUrl = import.meta.env.VITE_R2_PUBLIC_URL as string;
  }

  private async getClient() {
    if (this.s3) return this.s3;
    // @ts-expect-error — optional peer dep: install @aws-sdk/client-s3 to use R2 provider
    const { S3Client } = await import('@aws-sdk/client-s3');
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID as string,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY as string,
      },
    });
    return this.s3;
  }

  async upload(file: File | Blob, path = 'uploads/'): Promise<UploadResult> {
    const s3 = await this.getClient();
    // @ts-expect-error — optional peer dep
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const name = file instanceof File ? file.name : `blob-${Date.now()}`;
    const key = `${path}${Date.now()}-${name}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
      }),
    );

    return { url: this.getUrl(key), key };
  }

  async delete(key: string): Promise<void> {
    const s3 = await this.getClient();
    // @ts-expect-error — optional peer dep
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
