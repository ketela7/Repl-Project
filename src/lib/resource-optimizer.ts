/**
 * Resource Optimizer for Free-Tier Deployment
 * Automatically optimizes memory, API calls, and processing based on usage patterns
 * Implements intelligent throttling and resource management
 */

import { performanceMonitor } from './performance-monitor';

interface OptimizationStrategy {
  memory: {
    cacheSize: number;
    gcThreshold: number;
    maxConcurrentRequests: number;
  };
  api: {
    batchSize: number;
    requestDelay: number;
    timeoutLimit: number;
    retryCount: number;
  };
  processing: {
    chunkSize: number;
    pauseBetweenChunks: number;
    backgroundProcessing: boolean;
  };
}

class ResourceOptimizer {
  private currentStrategy: OptimizationStrategy;
  private baseStrategy: OptimizationStrategy;
  private optimizationTimer: NodeJS.Timeout | null = null;
  private isOptimizing = false;

  constructor() {
    this.baseStrategy = {
      memory: {
        cacheSize: 500,
        gcThreshold: 300 * 1024 * 1024, // 300MB
        maxConcurrentRequests: 3
      },
      api: {
        batchSize: 10,
        requestDelay: 100,
        timeoutLimit: 30000,
        retryCount: 3
      },
      processing: {
        chunkSize: 20,
        pauseBetweenChunks: 50,
        backgroundProcessing: true
      }
    };

    this.currentStrategy = { ...this.baseStrategy };
    this.startOptimization();
  }

  private startOptimization() {
    // Run optimization every 30 seconds
    this.optimizationTimer = setInterval(() => {
      this.optimizeResources();
    }, 30000);

    // Initial optimization after 5 seconds
    setTimeout(() => {
      this.optimizeResources();
    }, 5000);
  }

  private async optimizeResources() {
    if (this.isOptimizing) return;
    this.isOptimizing = true;

    try {
      const metrics = performanceMonitor.getCurrentMetrics();
      if (!metrics) return;

      const newStrategy = this.calculateOptimalStrategy(metrics);
      const hasChanges = this.applyStrategy(newStrategy);

      if (hasChanges) {
        await this.executeOptimizations(metrics);
      }
    } catch (error) {
      console.warn('Resource optimization error:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  private calculateOptimalStrategy(metrics: any): OptimizationStrategy {
    const strategy = JSON.parse(JSON.stringify(this.baseStrategy));
    
    // Memory optimization
    const memoryUsageMB = metrics.memory.heapUsed / 1024 / 1024;
    
    if (memoryUsageMB > 400) {
      // Critical memory usage - aggressive optimization
      strategy.memory.cacheSize = Math.floor(strategy.memory.cacheSize * 0.6);
      strategy.memory.gcThreshold = 200 * 1024 * 1024;
      strategy.memory.maxConcurrentRequests = 2;
      strategy.api.batchSize = 5;
      strategy.processing.chunkSize = 10;
    } else if (memoryUsageMB > 300) {
      // High memory usage - moderate optimization
      strategy.memory.cacheSize = Math.floor(strategy.memory.cacheSize * 0.8);
      strategy.memory.gcThreshold = 250 * 1024 * 1024;
      strategy.memory.maxConcurrentRequests = 2;
      strategy.api.batchSize = 7;
      strategy.processing.chunkSize = 15;
    } else if (memoryUsageMB < 150) {
      // Low memory usage - can be more aggressive
      strategy.memory.cacheSize = Math.floor(strategy.memory.cacheSize * 1.2);
      strategy.memory.maxConcurrentRequests = 4;
      strategy.api.batchSize = 15;
      strategy.processing.chunkSize = 30;
    }

    // API response time optimization
    if (metrics.api.averageResponseTime > 5000) {
      // Very slow responses
      strategy.api.requestDelay = 200;
      strategy.api.timeoutLimit = 20000;
      strategy.api.batchSize = Math.max(3, Math.floor(strategy.api.batchSize * 0.6));
      strategy.processing.pauseBetweenChunks = 100;
    } else if (metrics.api.averageResponseTime > 3000) {
      // Slow responses
      strategy.api.requestDelay = 150;
      strategy.api.timeoutLimit = 25000;
      strategy.api.batchSize = Math.max(5, Math.floor(strategy.api.batchSize * 0.8));
      strategy.processing.pauseBetweenChunks = 75;
    } else if (metrics.api.averageResponseTime < 1000) {
      // Fast responses - can be more aggressive
      strategy.api.requestDelay = 50;
      strategy.api.batchSize = Math.min(20, Math.floor(strategy.api.batchSize * 1.3));
      strategy.processing.pauseBetweenChunks = 25;
    }

    // Error rate optimization
    if (metrics.api.errorRate > 5) {
      // High error rate - be more conservative
      strategy.api.retryCount = 5;
      strategy.api.requestDelay = Math.max(200, strategy.api.requestDelay * 1.5);
      strategy.memory.maxConcurrentRequests = 1;
    } else if (metrics.api.errorRate > 2) {
      strategy.api.retryCount = 4;
      strategy.api.requestDelay = Math.max(150, strategy.api.requestDelay * 1.2);
      strategy.memory.maxConcurrentRequests = 2;
    }

    // Background processing optimization based on user activity
    if (metrics.session.userActivity < 20) {
      // User inactive - enable more background processing
      strategy.processing.backgroundProcessing = true;
      strategy.processing.chunkSize = Math.floor(strategy.processing.chunkSize * 1.5);
    } else if (metrics.session.userActivity > 80) {
      // User very active - minimize background processing
      strategy.processing.backgroundProcessing = false;
      strategy.processing.chunkSize = Math.floor(strategy.processing.chunkSize * 0.7);
      strategy.processing.pauseBetweenChunks = Math.max(100, strategy.processing.pauseBetweenChunks);
    }

    return strategy;
  }

  private applyStrategy(newStrategy: OptimizationStrategy): boolean {
    const currentStr = JSON.stringify(this.currentStrategy);
    const newStr = JSON.stringify(newStrategy);
    
    if (currentStr === newStr) return false;

    this.currentStrategy = newStrategy;
    this.notifySystemsOfChanges();
    return true;
  }

  private notifySystemsOfChanges() {
    // Update cache system
    try {
      const driveCache = require('./cache').driveCache;
      if (driveCache && typeof driveCache.setMaxSize === 'function') {
        driveCache.setMaxSize(this.currentStrategy.memory.cacheSize);
      }
    } catch {}

    // Update request queue
    try {
      const requestQueue = require('./request-queue').requestQueue;
      if (requestQueue && typeof requestQueue.setMaxConcurrent === 'function') {
        requestQueue.setMaxConcurrent(this.currentStrategy.memory.maxConcurrentRequests);
      }
    } catch {}

    // Update API optimizer
    try {
      const apiOptimizer = require('./api-optimizer').apiOptimizer;
      if (apiOptimizer && typeof apiOptimizer.setBatchSize === 'function') {
        apiOptimizer.setBatchSize(this.currentStrategy.api.batchSize);
      }
    } catch {}
  }

  private async executeOptimizations(metrics: any) {
    const optimizations: Promise<void>[] = [];

    // Memory optimizations
    if (metrics.memory.heapUsed > this.currentStrategy.memory.gcThreshold) {
      optimizations.push(this.triggerGarbageCollection());
    }

    // Cache optimizations
    if (metrics.cache.size > this.currentStrategy.memory.cacheSize) {
      optimizations.push(this.optimizeCache());
    }

    // Background task optimizations
    if (metrics.session.backgroundTasks > 10) {
      optimizations.push(this.optimizeBackgroundTasks());
    }

    await Promise.allSettled(optimizations);
  }

  private async triggerGarbageCollection(): Promise<void> {
    try {
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
      
      // For client-side, trigger cleanup in components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resource-cleanup'));
      }
    } catch (error) {
      console.warn('Garbage collection failed:', error);
    }
  }

  private async optimizeCache(): Promise<void> {
    try {
      const driveCache = require('./cache').driveCache;
      if (driveCache && typeof driveCache.cleanup === 'function') {
        driveCache.cleanup();
      }

      const clientStorage = require('./client-storage').clientStorage;
      if (clientStorage && typeof clientStorage.cleanup === 'function') {
        await clientStorage.cleanup();
      }
    } catch (error) {
      console.warn('Cache optimization failed:', error);
    }
  }

  private async optimizeBackgroundTasks(): Promise<void> {
    try {
      // Pause non-critical background tasks
      const backgroundCacheManager = require('./background-cache').backgroundCacheManager;
      if (backgroundCacheManager && typeof backgroundCacheManager.pause === 'function') {
        backgroundCacheManager.pause();
        
        // Resume after 30 seconds
        setTimeout(() => {
          if (backgroundCacheManager.resume) backgroundCacheManager.resume();
        }, 30000);
      }
    } catch (error) {
      console.warn('Background task optimization failed:', error);
    }
  }

  // Public API methods
  getCurrentStrategy(): OptimizationStrategy {
    return { ...this.currentStrategy };
  }

  forceOptimization(): Promise<void> {
    return this.optimizeResources();
  }

  // Get optimized parameters for different operations
  getFileOperationLimits() {
    return {
      maxConcurrent: this.currentStrategy.memory.maxConcurrentRequests,
      chunkSize: this.currentStrategy.processing.chunkSize,
      batchSize: this.currentStrategy.api.batchSize,
      timeout: this.currentStrategy.api.timeoutLimit
    };
  }

  getAPICallSettings() {
    return {
      batchSize: this.currentStrategy.api.batchSize,
      delay: this.currentStrategy.api.requestDelay,
      timeout: this.currentStrategy.api.timeoutLimit,
      retries: this.currentStrategy.api.retryCount
    };
  }

  getCacheSettings() {
    return {
      maxSize: this.currentStrategy.memory.cacheSize,
      gcThreshold: this.currentStrategy.memory.gcThreshold
    };
  }

  shouldEnableBackgroundProcessing(): boolean {
    return this.currentStrategy.processing.backgroundProcessing;
  }

  // Utility methods for specific optimizations
  async optimizeForBulkOperations(itemCount: number) {
    const limits = this.getFileOperationLimits();
    const chunks = Math.ceil(itemCount / limits.chunkSize);
    
    return {
      chunkSize: limits.chunkSize,
      totalChunks: chunks,
      pauseBetweenChunks: this.currentStrategy.processing.pauseBetweenChunks,
      maxConcurrent: limits.maxConcurrent
    };
  }

  async optimizeForAPIBatch(requestCount: number) {
    const settings = this.getAPICallSettings();
    const batches = Math.ceil(requestCount / settings.batchSize);
    
    return {
      batchSize: settings.batchSize,
      totalBatches: batches,
      delayBetweenBatches: settings.delay * batches, // Progressive delay
      timeout: settings.timeout
    };
  }

  getResourceStatus() {
    const metrics = performanceMonitor.getCurrentMetrics();
    if (!metrics) return null;

    const memoryUsageMB = metrics.memory.heapUsed / 1024 / 1024;
    const strategy = this.currentStrategy;

    return {
      memory: {
        current: memoryUsageMB,
        threshold: strategy.memory.gcThreshold / 1024 / 1024,
        status: memoryUsageMB > 400 ? 'critical' : memoryUsageMB > 300 ? 'high' : 'normal'
      },
      api: {
        responseTime: metrics.api.averageResponseTime,
        errorRate: metrics.api.errorRate,
        status: metrics.api.averageResponseTime > 5000 ? 'slow' : metrics.api.errorRate > 5 ? 'unstable' : 'good'
      },
      optimization: {
        level: memoryUsageMB > 400 ? 'aggressive' : memoryUsageMB > 300 ? 'moderate' : 'normal',
        backgroundProcessing: strategy.processing.backgroundProcessing
      }
    };
  }

  destroy() {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
  }
}

export const resourceOptimizer = new ResourceOptimizer();

// Auto-cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => resourceOptimizer.destroy());
  process.on('SIGINT', () => resourceOptimizer.destroy());
  process.on('SIGTERM', () => resourceOptimizer.destroy());
}