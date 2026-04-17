/**
 * Local Database Adapter
 * ─────────────────────
 * Implements DatabaseService using browser localStorage.
 * This is the default adapter — zero external dependencies.
 * Drop-in replacement for the legacy tinyurl-generator/utils.ts logic.
 */
import type { DatabaseService, ShortLink, ToolStats } from './types';

const STORAGE_KEY = 'tinyurl_history';
const STATS_KEY = 'freetool_tool_stats';
const VISITOR_KEY = 'freetool_tool_visitors';

export class LocalDatabase implements DatabaseService {
  async createShortUrl(data: { originalUrl: string; shortUrl: string }): Promise<ShortLink> {
    const code = Math.random().toString(36).substring(2, 8);
    const shortUrl = data.shortUrl || `${window.location.origin}/t/${code}`;

    const link: ShortLink = {
      id: code,
      originalUrl: data.originalUrl,
      shortUrl,
      createdAt: Date.now(),
    };

    const history = await this.getHistory();
    history.unshift(link);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    return link;
  }

  async getShortUrl(code: string): Promise<string | null> {
    const history = await this.getHistory();
    const found = history.find((l) => l.id === code);
    return found ? found.originalUrl : null;
  }

  async getHistory(): Promise<ShortLink[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ShortLink[]) : [];
    } catch {
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** ─── Tool Statistics Implementation ─── */

  async getToolStats(toolId: string): Promise<ToolStats> {
    const allStats = await this.getAllStatsMap();
    return allStats[toolId] || { id: toolId, views: 0, upvotes: 0, uniqueUsers: 0 };
  }

  async getAllToolStats(): Promise<ToolStats[]> {
    const allStats = await this.getAllStatsMap();
    return Object.values(allStats);
  }

  async recordToolAction(toolId: string, action: 'view' | 'upvote', userId?: string): Promise<void> {
    const allStats = await this.getAllStatsMap();
    const stats = allStats[toolId] || { id: toolId, views: 0, upvotes: 0, uniqueUsers: 0 };

    if (action === 'view') {
      stats.views += 1;
    } else if (action === 'upvote') {
      stats.upvotes += 1;
    }

    if (userId) {
      const visitors = this.getVisitors();
      const visitorKey = `${toolId}:${userId}`;
      if (!visitors.has(visitorKey)) {
        visitors.add(visitorKey);
        stats.uniqueUsers += 1;
        this.saveVisitors(visitors);
      }
    }

    allStats[toolId] = stats;
    localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
  }

  private async getAllStatsMap(): Promise<Record<string, ToolStats>> {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private getVisitors(): Set<string> {
    try {
      const raw = localStorage.getItem(VISITOR_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  private saveVisitors(visitors: Set<string>): void {
    localStorage.setItem(VISITOR_KEY, JSON.stringify(Array.from(visitors)));
  }
}
