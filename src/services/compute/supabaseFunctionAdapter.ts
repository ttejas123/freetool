/**
 * Supabase Edge Function Compute Adapter
 * ──────────────────────────────────────
 * Implements ComputeService by invoking a Supabase Edge Function.
 *
 * Required env vars:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * Expected Edge Function name: 'compress'
 * Body: { data: string; algorithm: string; mode: 'compress' | 'decompress' }
 * Response: { result: string }
 */
import type { ComputeService, CompressionAlgorithm } from './types';

export class SupabaseFunctionAdapter implements ComputeService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  private async getClient() {
    if (this.client) return this.client;
    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    );
    return this.client;
  }

  async compress(data: string, algorithm: CompressionAlgorithm = 'deflate'): Promise<string> {
    const supabase = await this.getClient();
    const { data: result, error } = await supabase.functions.invoke('compress', {
      body: { data, algorithm, mode: 'compress' },
    });
    if (error) throw new Error(`Supabase function compress: ${error.message}`);
    return (result as { result: string }).result;
  }

  async decompress(data: string, algorithm: CompressionAlgorithm = 'deflate'): Promise<string> {
    const supabase = await this.getClient();
    const { data: result, error } = await supabase.functions.invoke('compress', {
      body: { data, algorithm, mode: 'decompress' },
    });
    if (error) throw new Error(`Supabase function decompress: ${error.message}`);
    return (result as { result: string }).result;
  }
}
