/**
 * Background cache refresh system
 * Optimized for free tier deployment constraints
 */

import { driveCache } from './cache';

// Background cache refresh configuration
const BACKGROUND_REFRESH_CONFIG = {
  // Refresh interval when user is idle (minutes)
  idleRefreshInterval: 10,

  // Maximum time to spend on background refresh (seconds)
  maxRefreshTime: 30,

  // Priority order for cache refresh
  refreshPriority: [
    '/api/drive/files',
    '/api/auth/check-drive-access',
    '/api/drive/user'
  ],

  // User activity detection
  activityEvents: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'],

  // Idle threshold in minutes
  idleThreshold: 5
};

class BackgroundCacheManager {
  private isUserIdle = false;
  private lastActivity = Date.now();
  private refreshInterval: NodeJS.Timeout | null = null;
  private activityListeners: (() => void)[] = [];
  private isPaused = false;

  constructor() {
    this.initializeActivityDetection();
    this.startBackgroundRefresh();
  }

  private initializeActivityDetection() {
    if (typeof window === 'undefined') return;

    const updateActivity = () => {
      this.lastActivity = Date.now();
      this.isUserIdle = false;
    };

    // Add activity listeners
    BACKGROUND_REFRESH_CONFIG.activityEvents.forEach(event => {
      const listener = () => updateActivity();
      window.addEventListener(event, listener, { passive: true });
      this.activityListeners.push(() => {
        window.removeEventListener(event, listener);
      });
    });

    // Check for idle state every minute
    setInterval(() => {
      const idleTime = Date.now() - this.lastActivity;
      this.isUserIdle = idleTime > (BACKGROUND_REFRESH_CONFIG.idleThreshold * 60 * 1000);
    }, 60000);
  }

  private startBackgroundRefresh() {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(async () => {
      if (this.isPaused || !this.isUserIdle) return;

      try {
        await this.performBackgroundRefresh();
      } catch (error) {
        console.warn('Background cache refresh failed:', error);
      }
    }, BACKGROUND_REFRESH_CONFIG.idleRefreshInterval * 60 * 1000);
  }

  private async performBackgroundRefresh() {
    const startTime = Date.now();
    const maxTime = BACKGROUND_REFRESH_CONFIG.maxRefreshTime * 1000;

    console.log('Starting background cache refresh...');

    for (const endpoint of BACKGROUND_REFRESH_CONFIG.refreshPriority) {
      // Check if we've exceeded max refresh time
      if (Date.now() - startTime > maxTime) {
        console.log('Background refresh time limit reached');
        break;
      }

      // Check if user became active
      if (!this.isUserIdle) {
        console.log('User became active, stopping background refresh');
        break;
      }

      try {
        // Refresh cache for this endpoint
        await this.refreshEndpointCache(endpoint);

        // Small delay between requests to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`Failed to refresh cache for ${endpoint}:`, error);
      }
    }

    console.log(`Background cache refresh completed in ${Date.now() - startTime}ms`);
  }

  private async refreshEndpointCache(endpoint: string) {
    try {
      // Use a lightweight request to refresh cache
      const response = await fetch(endpoint, {
        method: 'HEAD', // Use HEAD request when possible to save bandwidth
        cache: 'no-cache'
      });

      if (response.ok) {
        // Update our cache timestamp
        driveCache.set(`${endpoint}:lastRefreshed`, Date.now().toString(), 60 * 60); // 1 hour
      }
    } catch (error) {
      // Fallback to GET request if HEAD fails
      try {
        const response = await fetch(endpoint, {
          cache: 'no-cache'
        });

        if (response.ok) {
          const data = await response.text();
          // Update cache with fresh data
          driveCache.set(endpoint, data, 15 * 60); // 15 minutes
        }
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  }

  // Public methods for external control
  pause() {
    this.isPaused = true;
    console.log('Background cache refresh paused');
  }

  resume() {
    this.isPaused = false;
    console.log('Background cache refresh resumed');
  }

  forceRefresh() {
    if (!this.isPaused) {
      this.performBackgroundRefresh();
    }
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    // Remove activity listeners
    this.activityListeners.forEach(removeListener => removeListener());
    this.activityListeners = [];
  }

  // Status methods
  getStatus() {
    return {
      isUserIdle: this.isUserIdle,
      isPaused: this.isPaused,
      lastActivity: new Date(this.lastActivity).toISOString(),
      isActive: !!this.refreshInterval
    };
  }
}

// Create singleton instance
export const backgroundCacheManager = new BackgroundCacheManager();

// Export for use in other modules
export { BackgroundCacheManager, BACKGROUND_REFRESH_CONFIG };