/**
 * Background cache refresh system
 * Refreshes cache data when user is idle without blocking UI
 */

import { driveCache } from './cache';
import { requestQueue } from './request-queue';

interface BackgroundRefreshConfig {
  idleTimeout: number;
  refreshInterval: number;
  maxConcurrentRefresh: number;
}

class BackgroundCacheManager {
  private idleTimer: NodeJS.Timeout | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isIdle = false;
  private lastActivity = Date.now();
  private config: BackgroundRefreshConfig = {
    idleTimeout: 30000, // 30 seconds of inactivity
    refreshInterval: 300000, // 5 minutes refresh interval
    maxConcurrentRefresh: 2
  };

  private activeRefreshes = new Set<string>();

  init() {
    this.setupIdleDetection();
    this.startPeriodicRefresh();
  }

  private setupIdleDetection() {
    // Track user activity
    const resetIdleTimer = () => {
      this.lastActivity = Date.now();
      this.isIdle = false;
      
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }
      
      this.idleTimer = setTimeout(() => {
        this.isIdle = true;
        this.performBackgroundRefresh();
      }, this.config.idleTimeout);
    };

    // Listen for user interactions
    if (typeof window !== 'undefined') {
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetIdleTimer, { passive: true });
      });
    }

    resetIdleTimer();
  }

  private startPeriodicRefresh() {
    this.refreshTimer = setInterval(() => {
      if (this.isIdle) {
        this.performBackgroundRefresh();
      }
    }, this.config.refreshInterval);
  }

  private async performBackgroundRefresh() {
    if (!this.isIdle || this.activeRefreshes.size >= this.config.maxConcurrentRefresh) {
      return;
    }

    const cacheStats = driveCache.getStats();
    const staleKeys = this.identifyStaleEntries(cacheStats.keys);
    
    // Refresh most important cache entries
    const priorityKeys = staleKeys.slice(0, this.config.maxConcurrentRefresh);
    
    for (const key of priorityKeys) {
      if (!this.isIdle) break; // Stop if user becomes active
      
      this.refreshCacheEntry(key);
    }
  }

  private identifyStaleEntries(keys: string[]): string[] {
    // Prioritize folder listings and frequently accessed data
    return keys.filter(key => {
      // Focus on folder contents and root directory
      return key.includes('drive:') && 
             (key.includes(':root:') || key.includes(':::')); // Empty query = folder listing
    }).sort((a, b) => {
      // Prioritize root folder and recently accessed
      if (a.includes(':root:')) return -1;
      if (b.includes(':root:')) return 1;
      return 0;
    });
  }

  private async refreshCacheEntry(cacheKey: string) {
    if (this.activeRefreshes.has(cacheKey)) return;
    
    this.activeRefreshes.add(cacheKey);
    
    try {
      // Parse cache key to extract parameters
      const params = this.parseCacheKey(cacheKey);
      if (!params) return;

      // Perform background refresh
      const requestId = `bg-refresh-${cacheKey}`;
      await requestQueue.enqueue(
        requestId,
        () => this.fetchFreshData(params),
        'low' // Background refreshes have lowest priority
      );
      
      console.log(`Background refresh completed for: ${cacheKey}`);
    } catch (error) {
      console.warn(`Background refresh failed for ${cacheKey}:`, error);
    } finally {
      this.activeRefreshes.delete(cacheKey);
    }
  }

  private parseCacheKey(key: string): { parentId?: string; query?: string } | null {
    // Parse "drive:userId:parentId:query:mimeType:pageToken" format
    const parts = key.split(':');
    if (parts.length < 3 || parts[0] !== 'drive') return null;
    
    return {
      parentId: parts[2] || undefined,
      query: parts[3] || undefined
    };
  }

  private async fetchFreshData(params: { parentId?: string; query?: string }) {
    const searchParams = new URLSearchParams();
    if (params.parentId && params.parentId !== 'root') {
      searchParams.append('parentId', params.parentId);
    }
    if (params.query) {
      searchParams.append('query', params.query);
    }
    searchParams.append('pageSize', '30');
    
    const response = await fetch(`/api/drive/files?${searchParams}`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    throw new Error(`Background refresh failed: ${response.status}`);
  }

  updateActivity() {
    this.lastActivity = Date.now();
    this.isIdle = false;
  }

  destroy() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.removeEventListener(event, () => {});
      });
    }
  }

  getStats() {
    return {
      isIdle: this.isIdle,
      activeRefreshes: this.activeRefreshes.size,
      lastActivity: this.lastActivity
    };
  }
}

export const backgroundCacheManager = new BackgroundCacheManager();