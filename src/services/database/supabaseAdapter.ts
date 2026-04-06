/**
 * Supabase Database Adapter
 * ─────────────────────────
 * Implements DatabaseService using the Supabase JS SDK.
 * The SDK is loaded lazily so it is never bundled unless this adapter is active.
 *
 * Required env vars:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * Supabase table schema (run in Supabase SQL editor):
 *   CREATE TABLE short_links (
 *     id          TEXT PRIMARY KEY,
 *     original_url TEXT NOT NULL,
 *     short_url    TEXT NOT NULL,
 *     created_at   BIGINT NOT NULL
 *   );
 */
import type { DatabaseService, ShortLink, ToolStats } from './types';

export class SupabaseDatabase implements DatabaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  private async getClient() {
    if (this.client) return this.client;

    // Dynamic import — Supabase SDK only bundled when provider = 'supabase'
    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    );
    return this.client;
  }

  async createShortUrl(data: { originalUrl: string; shortUrl: string }): Promise<ShortLink> {
    const supabase = await this.getClient();
    const code = Math.random().toString(36).substring(2, 8);
    const link: ShortLink = {
      id: code,
      originalUrl: data.originalUrl,
      shortUrl: data.shortUrl || `${window.location.origin}/t/${code}`,
      createdAt: Date.now(),
    };

    const { error } = await supabase.from('short_links').insert({
      code: link.id,
      original_url: link.originalUrl,
      short_url: link.shortUrl,
      // created_at is handled automatically by the DB table default, or we can omit it if it's auto-generated timestamp
    });

    if (error) throw new Error(`Supabase createShortUrl: ${error.message}`);
    return link;
  }

  async getShortUrl(code: string): Promise<string | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('short_links')
      .select('original_url')
      .eq('code', code)
      .single();

    if (error || !data) return null;
    return data.original_url as string;
  }

  async getHistory(): Promise<ShortLink[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('short_links')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data) return [];

    return (data as Array<Record<string, unknown>>).map((row) => {
      const code = (row.code || row.id) as string;
      return {
        id: code,
        originalUrl: row.original_url as string,
        shortUrl: `${window.location.origin}/t/${code}`,
        createdAt: typeof row.created_at === 'string' ? new Date(row.created_at).getTime() : (row.created_at as number),
      };
    });
  }

  async clearHistory(): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('short_links').delete().neq('code', '');
    if (error) throw new Error(`Supabase clearHistory: ${error.message}`);
  }

  /** ─── Tool Statistics Implementation ─── */

  async getToolStats(toolId: string): Promise<ToolStats> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('tool_stats')
      .select('*')
      .eq('id', toolId)
      .single();

    if (error || !data) {
      return { id: toolId, views: 0, upvotes: 0, uniqueUsers: 0 };
    }

    return {
      id: data.id,
      views: Number(data.views),
      upvotes: Number(data.upvotes),
      uniqueUsers: Number(data.unique_users),
    };
  }

  async getAllToolStats(): Promise<ToolStats[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('tool_stats')
      .select('*');

    if (error || !data) return [];

    return (data as any[]).map(row => ({
      id: row.id,
      views: Number(row.views),
      upvotes: Number(row.upvotes),
      uniqueUsers: Number(row.unique_users),
    }));
  }

  async recordToolAction(toolId: string, action: 'view' | 'upvote', userId?: string): Promise<void> {
    const supabase = await this.getClient();
    
    // Call the RPC function we defined in the migration
    const { error } = await supabase.rpc('record_tool_action', {
      p_tool_id: toolId,
      p_action: action,
      p_user_id: userId || null
    });

    if (error) {
      console.error(`Supabase recordToolAction ERROR: ${error.message}`);
      // Fallback to manual if RPC fails (e.g. migration not run yet)
      throw new Error(`Failed to record tool action: ${error.message}`);
    }
  }
}
