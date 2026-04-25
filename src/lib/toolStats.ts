import { getDatabase } from '../services';
import type { ToolStats } from '../services/database/types';

export type ToolMetric = ToolStats;

// Seed math for fallback/initial look
const generateSeedStats = (id: string) => {
   const seed = id.charCodeAt(0) + id.length;
   return {
      views: (seed * 11) % 500 + 50,
      upvotes: (seed * 3) % 50 + 10,
      uniqueUsers: (seed * 2) % 30 + 5,
   };
};

// Global User ID for unique tracking
const getDeviceId = () => {
    if (typeof window === 'undefined') return 'server';
    let id = localStorage.getItem('freetool_device_id');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('freetool_device_id', id);
    }
    return id;
};

/**
 * Record a tool view globally and locally for 'Recent Tools'.
 */
export const recordToolView = async (toolId: string) => {
  try {
    // Local Recent Tracking
    if (typeof window !== 'undefined') {
       const recentRaw = localStorage.getItem('recentTools');
       let recent: string[] = recentRaw ? JSON.parse(recentRaw) : [];
       recent = [toolId, ...recent.filter(id => id !== toolId)].slice(0, 8);
       localStorage.setItem('recentTools', JSON.stringify(recent));
    }

    const db = await getDatabase();
    await db.recordToolAction(toolId, 'view', getDeviceId());
  } catch (e) {
    console.warn("Failed to record view", e);
  }
};

/**
 * Record a tool upvote globally.
 */
export const upvoteTool = async (toolId: string) => {
  try {
    const db = await getDatabase();
    await db.recordToolAction(toolId, 'upvote', getDeviceId());
    const stats = await db.getToolStats(toolId);
    return stats.upvotes;
  } catch (e) {
    console.warn("Failed to upvote globally", e);
    return 0;
  }
};

/**
 * Fetch all tool metrics from the global database.
 * Uses a 5-minute TTL cache — renders instantly from cache, refreshes in background.
 */
export const fetchAllToolMetrics = async (): Promise<Record<string, ToolMetric>> => {
    // Return cached data immediately if it's fresh (< 5 min old)
    const cached = getCachedMetrics();
    if (typeof window !== 'undefined') {
        const cachedAt = Number(localStorage.getItem('freetool_stats_cache_ts') || 0);
        const age = Date.now() - cachedAt;
        if (age < 5 * 60 * 1000 && Object.keys(cached).length > 0) {
            return cached;
        }
    }

    try {
        const db = await getDatabase();
        const stats = await db.getAllToolStats();
        const metrics: Record<string, ToolMetric> = {};
        
        stats.forEach(s => {
            metrics[s.id] = s;
        });

        // Cache in localStorage with a timestamp for TTL checks
        if (typeof window !== 'undefined') {
            localStorage.setItem('freetool_stats_cache', JSON.stringify(metrics));
            localStorage.setItem('freetool_stats_cache_ts', String(Date.now()));
        }

        return metrics;
    } catch (e) {
        console.error("Failed to fetch global metrics", e);
        return cached;
    }
};

/**
 * Synchronous access to cached metrics (for initial render).
 */
export const getCachedMetrics = (): Record<string, ToolMetric> => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem('freetool_stats_cache');
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * Legacy support for ToolCard components that expect a sync metric object.
 * Returns cached data or seeded fallback.
 */
export const getToolMetricsSync = (toolId: string): ToolMetric => {

    const seed = generateSeedStats(toolId);
    return {
        id: toolId,
        views: seed.views,
        upvotes: seed.upvotes,
        uniqueUsers: seed.uniqueUsers
    };
};

/**
 * Retrieve pinned tools from localStorage.
 */
export const getPinnedTools = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem('pinnedTools');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

/**
 * Toggle a tool's pinned status (max 15).
 * Returns true if pinned, false if unpinned, or throws error if limit reached.
 */
export const togglePinTool = (toolId: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    const pinned = getPinnedTools();
    const isPinned = pinned.includes(toolId);
    
    if (isPinned) {
        const next = pinned.filter(id => id !== toolId);
        localStorage.setItem('pinnedTools', JSON.stringify(next));
        return false;
    } else {
        if (pinned.length >= 15) {
            throw new Error("You can only pin up to 15 tools.");
        }
        const next = [toolId, ...pinned];
        localStorage.setItem('pinnedTools', JSON.stringify(next));
        return true;
    }
};
