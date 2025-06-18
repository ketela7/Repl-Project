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
  private metrics: PerformanceMetrics[] = [];
  private apiCalls: Map<string, APICallMetric> = new Map();
  private sessionStart = Date.now();
  private maxMetricsHistory = 100; // Keep last 100 measurements
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isClient = typeof window !== 'undefined';

  init() {
    if (this.isClient) {
      this.startClientMonitoring();
    } else {
      this.startServerMonitoring();
    }
  }

  private startClientMonitoring() {
    // Monitor on client side using Performance API
    this.monitoringInterval = setInterval(() => {
      this.collectClientMetrics();
    }, 10000); // Collect every 10 seconds

    // Monitor page visibility for resource optimization
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.onPageHidden();
        } else {
          this.onPageVisible();
        }
      });
    }
  }

  private startServerMonitoring() {
    // Monitor on server side using Node.js process
    this.monitoringInterval = setInterval(() => {
      this.collectServerMetrics();
    }, 5000); // More frequent on server
  }

  private collectClientMetrics() {
    if (!this.isClient) return;

    const memory = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };

    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      memory: {
        used: memory.usedJSHeapSize || 0,
        heapUsed: memory.usedJSHeapSize || 0,
        heapTotal: memory.totalJSHeapSize || 0,
        external: 0
      },
      api: this.calculateAPIMetrics(),
      cache: this.calculateCacheMetrics(),
      session: {
        duration: Date.now() - this.sessionStart,
        userActivity: this.getUserActivityScore(),
        backgroundTasks: this.getBackgroundTaskCount()
      }
    };

    this.addMetric(metric);
  }

  private collectServerMetrics() {
    if (this.isClient) return;

    const memUsage = process.memoryUsage();
    
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      memory: {
        used: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      },
      api: this.calculateAPIMetrics(),
      cache: this.calculateCacheMetrics(),
      session: {
        duration: Date.now() - this.sessionStart,
        userActivity: 0,
        backgroundTasks: 0
      }
    };

    this.addMetric(metric);
  }

  // Track API call start
  startAPICall(endpoint: string, requestId?: string): string {
    const id = requestId || `${endpoint}-${Date.now()}-${Math.random()}`;
    const memoryBefore = this.isClient 
      ? ((performance as any).memory?.usedJSHeapSize || 0)
      : process.memoryUsage().heapUsed;

    this.apiCalls.set(id, {
      endpoint,
      startTime: Date.now(),
      status: 'pending',
      memoryBefore
    });

    return id;
  }

  // Track API call completion
  endAPICall(id: string, success: boolean = true, error?: string) {
    const call = this.apiCalls.get(id);
    if (!call) return;

    const endTime = Date.now();
    const memoryAfter = this.isClient 
      ? ((performance as any).memory?.usedJSHeapSize || 0)
      : process.memoryUsage().heapUsed;

    call.endTime = endTime;
    call.duration = endTime - call.startTime;
    call.status = success ? 'success' : 'error';
    call.memoryAfter = memoryAfter;
    call.error = error;

    // Check for timeout (>30s is concerning for free tier)
    if (call.duration > 30000) {
      call.status = 'timeout';
      this.onTimeoutDetected(call);
    }

    // Check for memory spike (>100MB increase is concerning)
    const memoryIncrease = memoryAfter - call.memoryBefore;
    if (memoryIncrease > 100 * 1024 * 1024) {
      this.onMemorySpikeDetected(call, memoryIncrease);
    }

    this.apiCalls.set(id, call);
  }

  private calculateAPIMetrics() {
    const calls = Array.from(this.apiCalls.values());
    const completedCalls = calls.filter(call => call.endTime);
    
    if (completedCalls.length === 0) {
      return {
        totalCalls: 0,
        averageResponseTime: 0,
        timeoutCount: 0,
        errorRate: 0
      };
    }

    const totalResponseTime = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const timeoutCount = calls.filter(call => call.status === 'timeout').length;
    const errorCount = calls.filter(call => call.status === 'error').length;

    return {
      totalCalls: calls.length,
      averageResponseTime: totalResponseTime / completedCalls.length,
      timeoutCount,
      errorRate: (errorCount / completedCalls.length) * 100
    };
  }

  private calculateCacheMetrics() {
    // Integrate with existing cache systems
    try {
      const driveCache = require('./cache').driveCache;
      const stats = driveCache?.getStats() || { size: 0, maxSize: 0 };
      
      return {
        hitRate: this.calculateCacheHitRate(),
        size: stats.size,
        memoryUsage: this.estimateCacheMemoryUsage(stats.size)
      };
    } catch {
      return { hitRate: 0, size: 0, memoryUsage: 0 };
    }
  }

  private calculateCacheHitRate(): number {
    // Simple hit rate calculation based on recent API calls
    const recentCalls = Array.from(this.apiCalls.values())
      .filter(call => Date.now() - call.startTime < 60000); // Last minute

    if (recentCalls.length === 0) return 0;

    const fastCalls = recentCalls.filter(call => (call.duration || 0) < 500);
    return (fastCalls.length / recentCalls.length) * 100;
  }

  private estimateCacheMemoryUsage(cacheSize: number): number {
    // Rough estimate: 10KB per cache entry
    return cacheSize * 10 * 1024;
  }

  private getUserActivityScore(): number {
    if (!this.isClient) return 0;
    
    // Simple activity score based on recent interactions
    const lastActivity = localStorage.getItem('lastUserActivity');
    if (!lastActivity) return 0;
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    return Math.max(0, 100 - (timeSinceActivity / 1000)); // Decay over time
  }

  private getBackgroundTaskCount(): number {
    // Count active background tasks from other systems
    try {
      const apiOptimizer = require('./api-optimizer').apiOptimizer;
      const requestQueue = require('./request-queue').requestQueue;
      
      const optimizerStats = apiOptimizer?.getStats() || { queueSize: 0 };
      const queueStats = requestQueue?.getQueueStats() || { queueSize: 0, activeRequests: 0 };
      
      return optimizerStats.queueSize + queueStats.queueSize + queueStats.activeRequests;
    } catch {
      return 0;
    }
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(metric);
  }

  private checkPerformanceAlerts(metric: PerformanceMetrics) {
    const alerts: string[] = [];

    // Memory alerts (conservative for free tier)
    if (metric.memory.heapUsed > 400 * 1024 * 1024) { // 400MB
      alerts.push(`High memory usage: ${Math.round(metric.memory.heapUsed / 1024 / 1024)}MB`);
    }

    // Response time alerts
    if (metric.api.averageResponseTime > 5000) { // 5 seconds
      alerts.push(`Slow API responses: ${Math.round(metric.api.averageResponseTime)}ms average`);
    }

    // Error rate alerts
    if (metric.api.errorRate > 5) { // 5% error rate
      alerts.push(`High error rate: ${metric.api.errorRate.toFixed(1)}%`);
    }

    // Timeout alerts
    if (metric.api.timeoutCount > 0) {
      alerts.push(`API timeouts detected: ${metric.api.timeoutCount}`);
    }

    if (alerts.length > 0) {
      this.onPerformanceAlert(alerts, metric);
    }
  }

  private onTimeoutDetected(call: APICallMetric) {
    console.warn(`API Timeout detected: ${call.endpoint} took ${call.duration}ms`);
    
    // Log to monitoring system or trigger optimization
    if (this.isClient && typeof navigator !== 'undefined') {
      navigator.sendBeacon('/api/performance/timeout', JSON.stringify({
        endpoint: call.endpoint,
        duration: call.duration,
        timestamp: Date.now()
      }));
    }
  }

  private onMemorySpikeDetected(call: APICallMetric, increase: number) {
    console.warn(`Memory spike detected: ${call.endpoint} increased memory by ${Math.round(increase / 1024 / 1024)}MB`);
    
    // Trigger garbage collection if possible
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }

  private onPerformanceAlert(alerts: string[], metric: PerformanceMetrics) {
    console.warn('Performance Alert:', alerts.join('; '));
    
    // Could send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
    }
  }

  private onPageHidden() {
    // Reduce activity when page is hidden
    this.pause();
  }

  private onPageVisible() {
    // Resume full monitoring when page is visible
    this.resume();
  }

  // Public API methods
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getResourceEfficiencyScore(): number {
    const current = this.getCurrentMetrics();
    if (!current) return 0;

    let score = 100;

    // Memory efficiency (40% of score)
    const memoryUsageMB = current.memory.heapUsed / 1024 / 1024;
    const memoryPenalty = Math.max(0, (memoryUsageMB - 200) / 10); // Penalty after 200MB
    score -= memoryPenalty * 0.4;

    // Response time efficiency (30% of score)
    const responseTimePenalty = Math.max(0, (current.api.averageResponseTime - 1000) / 100); // Penalty after 1s
    score -= responseTimePenalty * 0.3;

    // Error rate penalty (20% of score)
    score -= current.api.errorRate * 0.2;

    // Cache efficiency bonus (10% of score)
    const cacheBonus = current.cache.hitRate * 0.1;
    score += cacheBonus;

    return Math.max(0, Math.min(100, score));
  }

  getOptimizationRecommendations(): string[] {
    const current = this.getCurrentMetrics();
    if (!current) return [];

    const recommendations: string[] = [];

    // Memory recommendations
    if (current.memory.heapUsed > 300 * 1024 * 1024) {
      recommendations.push('Consider reducing cache size or implementing more aggressive garbage collection');
    }

    // API recommendations
    if (current.api.averageResponseTime > 3000) {
      recommendations.push('Optimize API calls with batching or caching');
    }

    if (current.api.errorRate > 2) {
      recommendations.push('Investigate and fix API errors to improve reliability');
    }

    // Cache recommendations
    if (current.cache.hitRate < 50) {
      recommendations.push('Improve cache strategy to reduce API calls');
    }

    return recommendations;
  }

  pause() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  resume() {
    if (!this.monitoringInterval) {
      if (this.isClient) {
        this.startClientMonitoring();
      } else {
        this.startServerMonitoring();
      }
    }
  }

  destroy() {
    this.pause();
    this.metrics = [];
    this.apiCalls.clear();
  }

  // Export data for analysis
  exportData() {
    return {
      metrics: this.metrics,
      apiCalls: Array.from(this.apiCalls.entries()),
      summary: {
        sessionDuration: Date.now() - this.sessionStart,
        totalAPICalls: this.apiCalls.size,
        averageMemoryUsage: this.metrics.length > 0 
          ? this.metrics.reduce((sum, m) => sum + m.memory.heapUsed, 0) / this.metrics.length 
          : 0,
        resourceEfficiencyScore: this.getResourceEfficiencyScore()
      }
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize
if (typeof window !== 'undefined') {
  // Client-side initialization
  performanceMonitor.init();
  
  // Track user activity
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, () => {
      localStorage.setItem('lastUserActivity', Date.now().toString());
    }, { passive: true });
  });
} else if (typeof process !== 'undefined') {
  // Server-side initialization
  performanceMonitor.init();
}