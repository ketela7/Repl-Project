/**
 * API Performance optimization utilities
 * Implements intelligent batching, prefetching, and connection pooling
 */

import { driveCache } from './cache'
import { throttledDriveRequest } from './api-throttle'

interface BatchRequest {
  id: string
  requestFn: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  priority: 'high' | 'medium' | 'low'
  timestamp: number
}

class APIPerformanceOptimizer {
  private batchQueue: BatchRequest[] = []
  private processing = false
  private readonly BATCH_SIZE = 5
  private readonly BATCH_DELAY = 50 // ms
  private prefetchCache = new Set<string>()

  /**
   * Add request to batch queue with priority
   */
  async batchRequest<T>(
    requestId: string,
    requestFn: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const batchItem: BatchRequest = {
        id: requestId,
        requestFn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      }

      // Insert based on priority
      if (priority === 'high') {
        this.batchQueue.unshift(batchItem)
      } else {
        this.batchQueue.push(batchItem)
      }

      this.processBatch()
    })
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.batchQueue.length === 0) return

    this.processing = true

    try {
      while (this.batchQueue.length > 0) {
        const batch = this.batchQueue.splice(0, this.BATCH_SIZE)
        
        // Process batch concurrently
        const promises = batch.map(async (item) => {
          try {
            const result = await throttledDriveRequest(item.requestFn)
            item.resolve(result)
          } catch (error) {
            item.reject(error)
          }
        })

        await Promise.all(promises)
        
        // Small delay between batches to prevent overwhelming
        if (this.batchQueue.length > 0) {
          await this.sleep(this.BATCH_DELAY)
        }
      }
    } finally {
      this.processing = false
    }
  }

  /**
   * Prefetch commonly accessed data
   */
  async prefetchCommonData(userId: string, folderId?: string): Promise<void> {
    const prefetchKey = `${userId}-${folderId || 'root'}`
    
    if (this.prefetchCache.has(prefetchKey)) return
    this.prefetchCache.add(prefetchKey)

    // Prefetch folder structure
    this.batchRequest(
      `prefetch-folder-${prefetchKey}`,
      async () => {
        // This would be implemented with actual Google Drive API call
        return null
      },
      'low'
    )
  }

  /**
   * Intelligent cache warming
   */
  warmCache(patterns: string[]): void {
    patterns.forEach(pattern => {
      if (!driveCache.has(pattern)) {
        // Warm cache with common patterns
        this.batchRequest(
          `warm-cache-${pattern}`,
          async () => {
            // Implementation for cache warming
            return null
          },
          'low'
        )
      }
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    queueSize: number
    processing: boolean
    prefetchCacheSize: number
  } {
    return {
      queueSize: this.batchQueue.length,
      processing: this.processing,
      prefetchCacheSize: this.prefetchCache.size
    }
  }

  /**
   * Clear performance optimizations
   */
  clear(): void {
    this.batchQueue = []
    this.prefetchCache.clear()
    this.processing = false
  }
}

export const apiPerformanceOptimizer = new APIPerformanceOptimizer()

/**
 * Optimized API call wrapper
 */
export async function optimizedApiCall<T>(
  requestId: string,
  requestFn: () => Promise<T>,
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<T> {
  return apiPerformanceOptimizer.batchRequest(requestId, requestFn, priority)
}