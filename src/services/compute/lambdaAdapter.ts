/**
 * AWS Lambda Compute Adapter
 * ───────────────────────────
 * Implements ComputeService by invoking an AWS Lambda function via API Gateway.
 *
 * Required env vars:
 *   VITE_LAMBDA_COMPRESS_URL    (POST endpoint returning { result: string })
 *   VITE_LAMBDA_DECOMPRESS_URL  (POST endpoint returning { result: string })
 */
import type { ComputeService, CompressionAlgorithm } from './types';

export class LambdaComputeAdapter implements ComputeService {
  private readonly compressUrl = process.env.NEXT_PUBLIC_LAMBDA_COMPRESS_URL as string;
  private readonly decompressUrl = process.env.NEXT_PUBLIC_LAMBDA_DECOMPRESS_URL as string;

  async compress(data: string, algorithm: CompressionAlgorithm = 'deflate'): Promise<string> {
    const res = await fetch(this.compressUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, algorithm }),
    });
    if (!res.ok) throw new Error(`Lambda compress error: ${res.status} ${res.statusText}`);
    const json = (await res.json()) as { result: string };
    return json.result;
  }

  async decompress(data: string, algorithm: CompressionAlgorithm = 'deflate'): Promise<string> {
    const res = await fetch(this.decompressUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, algorithm }),
    });
    if (!res.ok) throw new Error(`Lambda decompress error: ${res.status} ${res.statusText}`);
    const json = (await res.json()) as { result: string };
    return json.result;
  }
}
