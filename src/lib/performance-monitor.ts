/**
 * Performance Monitor for Resource Efficiency
 * Tracks memory usage, API calls, response times, and timeout patterns
 * Optimized for free-tier deployment constraints
 */

interface PerformanceMetrics {
  timestamp: number;
  memory: {
    used: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  api: {
    totalCalls: number;
    averageResponseTime: number;
    timeoutCount: number;
    errorRate: number;
  };
  cache: {
    hitRate: number;
    size: number;
    memoryUsage: number;
  };
  session: {
    duration: number;
    userActivity: number;
    backgroundTasks: number;
  };
}

interface APICallMetric {
  endpoint: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  memoryBefore: number;
  memoryAfter?: number;
  error?: string;
}

class PerformanceMonitor {
  private metrics: any = {
    timestamp: Date.now(),
    memory: {
      used: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    },
    api: {
      totalCalls: 0,
      averageResponseTime: 0,
      timeoutCount: 0,
      errorRate: 0
    },
    cache: {
      hitRate: 0,
      size: 0,
      memoryUsage: 0
    },
    session: {
      duration: 0,
      userActivity: 0,
      backgroundTasks: 0
    },
    // Legacy structure for compatibility
    memoryUsage: { used: 0, total: 0 },
    apiCalls: { count: 0, averageTime: 0, errors: 0 },
    cacheStats: { hits: 0, misses: 0, hitRate: 0 },
    networkRequests: { active: 0, completed: 0, failed: 0 },
    userActions: { total: 0, errors: 0 }
  };

  private subscribers: ((metrics: PerformanceMetrics) => void)[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private memoryCheckInterval?: NodeJS.Timeout;
  private lastAlertTime = 0;
  private alertCooldown = 30000; // 30 seconds cooldown between alerts

  init() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startMemoryMonitoring();
    this.setupPerformanceObserver();

    // Monitor every 15 seconds to reduce noise
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
    }, 15000);
  }

  private startMemoryMonitoring() {
    const updateMemory = () => {
      if (typeof window !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        if (memory) {
          const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
          const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);

          this.metrics.memoryUsage = {
            used: usedMB,
            total: totalMB
          };

          // Force notification on significant memory changes
          if (usedMB > 300) {
            this.notifySubscribers();
          }
        }
      } else if (typeof process !== 'undefined' && process.memoryUsage) {
        // Server-side memory monitoring
        const memory = process.memoryUsage();
        const usedMB = Math.round(memory.heapUsed / 1024 / 1024);
        const totalMB = Math.round(memory.heapTotal / 1024 / 1024);
        
        this.metrics.memoryUsage = {
          used: usedMB,
          total: totalMB
        };
      } else {
        // Fallback estimation
        const estimatedUsage = this.estimateMemoryUsage();
        this.metrics.memoryUsage = {
          used: estimatedUsage,
          total: estimatedUsage * 2
        };
      }
    };

    updateMemory();
    // Less frequent memory checks to reduce load
    this.memoryCheckInterval = setInterval(updateMemory, 5000);
  }

  private estimateMemoryUsage(): number {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return 50; // Default value for SSR
    }
    
    // Rough estimation based on DOM nodes and data
    const nodeCount = document.querySelectorAll('*').length;
    const estimatedMB = Math.max(50, Math.min(500, nodeCount / 10));
    return Math.round(estimatedMB);
  }

  private checkAlerts() {
    const now = Date.now();
    const { memoryUsage, apiCalls } = this.metrics;

    // Check cooldown period
    if (now - this.lastAlertTime < this.alertCooldown) {
      return;
    }

    // Alert if memory usage > 400MB (raised threshold to reduce noise)
    if (memoryUsage.used > 400) {
      console.warn(`Performance Alert: High Memory Usage ${memoryUsage.used}MB+`);
      this.lastAlertTime = now;
      this.notifySubscribers();
    }

    // Alert if error rate > 10%
    const errorRate = apiCalls.count > 0 ? 
      (apiCalls.errors / apiCalls.count) * 100 : 0;

    if (errorRate > 10) {
      console.warn(`Performance Alert: High Error Rate ${errorRate.toFixed(1)}%`);
      this.lastAlertTime = now;
      this.notifySubscribers();
    }

    // Alert on high API latency
    if (apiCalls.averageTime > 5000) {
      console.warn(`Performance Alert: High API Latency ${apiCalls.averageTime.toFixed(0)}ms`);
      this.lastAlertTime = now;
      this.notifySubscribers();
    }
  }

  private updateMetrics() {
    // Update cache stats
    this.updateCacheStats();
    // Force update to subscribers
    this.notifySubscribers();
  }

  private updateCacheStats() {
    // Get cache stats from various cache systems
    const hits = this.getCacheHits();
    const misses = this.getCacheMisses();

    this.metrics.cacheStats = {
      hits,
      misses,
      hitRate: hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0
    };
  }

  private getCacheHits(): number {
    // Check localStorage for cache data
    try {
      const cacheData = localStorage.getItem('drive_cache_stats');
      if (cacheData) {
        const stats = JSON.parse(cacheData);
        return stats.hits || 0;
      }
    } catch (error) {
      // Ignore errors
    }
    return Math.floor(Math.random() * 50); // Mock data for demo
  }

  private getCacheMisses(): number {
    // Check localStorage for cache data
    try {
      const cacheData = localStorage.getItem('drive_cache_stats');
      if (cacheData) {
        const stats = JSON.parse(cacheData);
        return stats.misses || 0;
      }
    } catch (error) {
      // Ignore errors
    }
    return Math.floor(Math.random() * 10); // Mock data for demo
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackApiCall(entry.duration);
          } else if (entry.entryType === 'resource' && entry.name.includes('/api/')) {
            this.trackApiCall(entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource'] });
    } catch (error) {
      console.warn('Performance Observer not supported', error);
    }
  }

  trackApiCall(duration: number, isError = false) {
    const { apiCalls } = this.metrics;

    apiCalls.count++;
    if (isError) apiCalls.errors++;

    // Update average time
    apiCalls.averageTime = ((apiCalls.averageTime * (apiCalls.count - 1)) + duration) / apiCalls.count;

    this.notifySubscribers();
  }

  startAPICall(endpoint: string): string {
    const callId = `${endpoint}_${Date.now()}_${Math.random()}`;
    // Store call start time for tracking
    if (typeof window !== 'undefined') {
      localStorage.setItem(`api_call_${callId}`, Date.now().toString());
    }
    return callId;
  }

  endAPICall(callId: string, success: boolean, error?: string) {
    if (typeof window !== 'undefined') {
      const startTimeStr = localStorage.getItem(`api_call_${callId}`);
      if (startTimeStr) {
        const startTime = parseInt(startTimeStr);
        const duration = Date.now() - startTime;
        this.trackApiCall(duration, !success);
        localStorage.removeItem(`api_call_${callId}`);
      }
    } else {
      // Server-side fallback
      this.trackApiCall(1000, !success);
    }
  }

  trackUserAction(isError = false) {
    this.metrics.userActions.total++;
    if (isError) this.metrics.userActions.errors++;

    this.notifySubscribers();
  }

  trackNetworkRequest(status: 'start' | 'complete' | 'error') {
    const { networkRequests } = this.metrics;

    switch (status) {
      case 'start':
        networkRequests.active++;
        break;
      case 'complete':
        networkRequests.active--;
        networkRequests.completed++;
        break;
      case 'error':
        networkRequests.active--;
        networkRequests.failed++;
        break;
    }

    this.notifySubscribers();
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.subscribers.push(callback);
    // Immediately provide current metrics
    callback(this.metrics);
  }

  unsubscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.metrics });
      } catch (error) {
        console.error('Error notifying performance subscriber:', error);
      }
    });
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  destroy() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    this.subscribers = [];
  }
}

export const performanceMonitor = typeof window !== 'undefined' ? new PerformanceMonitor() : new PerformanceMonitor();

// Auto-initialize
if (typeof window !== 'undefined') {
  // Client-side initialization
  performanceMonitor?.init();

  // Track user activity
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, () => {
      localStorage.setItem('lastUserActivity', Date.now().toString());
    }, { passive: true });
  });
} else if (typeof process !== 'undefined') {
  // Server-side initialization - safe initialization
  performanceMonitor?.init();
}