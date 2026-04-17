import { getDatabase } from '../services';
import type { ToolStats } from '../services/database/types';

export interface ToolMetric extends ToolStats {}

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
 */
export const fetchAllToolMetrics = async (): Promise<Record<string, ToolMetric>> => {
    try {
        const db = await getDatabase();
        const stats = await db.getAllToolStats();
        const metrics: Record<string, ToolMetric> = {};
        
        stats.forEach(s => {
            metrics[s.id] = s;
        });

        // Cache in localStorage for immediate sync access on next load
        if (typeof window !== 'undefined') {
            localStorage.setItem('freetool_stats_cache', JSON.stringify(metrics));
        }

        return metrics;
    } catch (e) {
        console.error("Failed to fetch global metrics", e);
        return getCachedMetrics();
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
    const cache = getCachedMetrics();
    if (cache[toolId]) return cache[toolId];

    const seed = generateSeedStats(toolId);
    return {
        id: toolId,
        views: seed.views,
        upvotes: seed.upvotes,
        uniqueUsers: seed.uniqueUsers
    };
};
