/**
 * Lightweight performance monitoring for Google Drive Manager
 * Optimized for cross-platform deployment
 */

interface PerformanceMetrics {
  loadTime: number;
  apiCalls: number;
  memoryUsage: number;
  lastUpdate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    apiCalls: 0,
    memoryUsage: 0,
    lastUpdate: Date.now()
  };

  private startTime = performance.now();

  markLoadComplete() {
    this.metrics.loadTime = performance.now() - this.startTime;
    this.metrics.lastUpdate = Date.now();
  }

  incrementApiCall() {
    this.metrics.apiCalls++;
    this.metrics.lastUpdate = Date.now();
  }

  updateMemoryUsage() {
    if ('memory' in performance) {
      // @ts-ignore
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    this.metrics.lastUpdate = Date.now();
  }

  getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  isHealthy(): boolean {
    const metrics = this.getMetrics();
    return metrics.loadTime < 5000 && metrics.memoryUsage < 100; // 5s load, 100MB memory
  }

  reset() {
    this.metrics = {
      loadTime: 0,
      apiCalls: 0,
      memoryUsage: 0,
      lastUpdate: Date.now()
    };
    this.startTime = performance.now();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-track page performance
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    performanceMonitor.markLoadComplete();
  });
}