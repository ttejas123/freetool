// ─── Database Service Interface ──────────────────────────────────────────────
// All database adapters must implement this interface.
// The frontend only ever imports from this file and `../index`.

export interface ShortLink {
  id: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: number;
}

export interface ToolStats {
  id: string;
  views: number;
  upvotes: number;
  uniqueUsers: number;
}

export interface DatabaseService {
  /**
   * Create and persist a new short URL entry.
   * Returns the full ShortLink with its generated id.
   */
  createShortUrl(data: { originalUrl: string; shortUrl: string }): Promise<ShortLink>;

  /**
   * Resolve a short code back to the original URL.
   * Returns null if the code doesn't exist.
   */
  getShortUrl(code: string): Promise<string | null>;

  /** Retrieve all stored short links, newest first. */
  getHistory(): Promise<ShortLink[]>;

  /** Wipe all stored short links. */
  clearHistory(): Promise<void>;

  /** ─── Tool Statistics ─── */
  
  /** Get metrics for a specific tool. */
  getToolStats(toolId: string): Promise<ToolStats>;

  /** Get all tool metrics (useful for ranking/sorting). */
  getAllToolStats(): Promise<ToolStats[]>;

  /** Record a view or upvote with optional unique user tracking. */
  recordToolAction(toolId: string, action: 'view' | 'upvote', userId?: string): Promise<void>;
}
