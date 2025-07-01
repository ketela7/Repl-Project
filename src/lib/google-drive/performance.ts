/**
 * Google Drive API Performance Optimizations
 * Based on: https://developers.google.com/workspace/drive/api/guides/performance
 */

export interface BatchRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  body?: any
  headers?: Record<string, string>
}

export interface BatchResponse {
  id: string
  status: number
  headers: Record<string, string>
  body: any
}

/**
 * Optimized field selectors for different use cases
 * Reduces bandwidth by only requesting needed fields
 */
export const FIELD_SELECTORS = {
  // Minimal fields for file listing
  LIST_MINIMAL: 'nextPageToken, files(id, name, mimeType)',

  // Standard fields for main file view - MUST include capabilities for bulk operations
  LIST_STANDARD:
    'nextPageToken, incompleteSearch, files(id, name, mimeType, size, createdTime, modifiedTime, owners(displayName, emailAddress), shared, trashed, starred, webViewLink, thumbnailLink, parents, capabilities(canEdit, canShare, canDelete, canDownload, canCopy, canTrash, canUntrash, canRename, canMoveItemWithinDrive))',

  // Detailed fields for file details dialog
  DETAILS_FULL:
    'id, name, mimeType, size, createdTime, modifiedTime, owners(displayName, emailAddress), shared, trashed, starred, webViewLink, webContentLink, thumbnailLink, parents, capabilities(canEdit, canShare, canDelete, canDownload), permissions(id, role, type, emailAddress, displayName)',

  // Minimal fields for exists check
  EXISTS_CHECK: 'files(id)',

  // Fields for folder structure
  FOLDER_STRUCTURE: 'files(id, name, parents, mimeType)',

  // Fields for search results
  SEARCH_RESULTS: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, webViewLink)',
} as const

/**
 * Performance-optimized request parameters
 */
export function getOptimizedRequestParams(operation: keyof typeof FIELD_SELECTORS, baseParams: any = {}): any {
  return {
    ...baseParams,
    fields: FIELD_SELECTORS[operation],

    // Enable gzip compression
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,

    // Optimize for performance
    acknowledgeAbuse: false,

    // Respect user's pageSize choice, with Google Drive API limit of 1000
    pageSize: Math.min(baseParams.pageSize || 50, 1000),
  }
}

/**
 * Batch requests for multiple operations
 * Reduces API calls by combining multiple requests
 */
export class DriveApiBatcher {
  private requests: Array<{
    id: string
    request: any
    resolve: Function
    reject: Function
  }> = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly BATCH_DELAY = 100 // ms
  private readonly MAX_BATCH_SIZE = 100

  constructor() {
    // Constructor implementation
  }

  /**
   * Add request to batch queue
   */
  async addToBatch<T>(id: string, requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requests.push({ id, request: requestFn, resolve, reject })

      // Process batch after delay or when max size reached
      if (this.requests.length >= this.MAX_BATCH_SIZE) {
        this.processBatch()
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatch(), this.BATCH_DELAY)
      }
    })
  }

  /**
   * Process batched requests
   */
  private async processBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    if (this.requests.length === 0) return

    const currentBatch = this.requests.splice(0, this.MAX_BATCH_SIZE)

    // Execute requests in parallel with controlled concurrency
    const promises = currentBatch.map(async ({ request, resolve, reject }) => {
      try {
        const result = await request()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * Clear pending requests
   */
  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
    this.requests.forEach(({ reject }) => {
      reject(new Error('Batch cleared'))
    })
    this.requests = []
  }
}

/**
 * Request deduplication for identical requests
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()
  private readonly REQUEST_TTL = 5000 // 5 seconds

  /**
   * Deduplicate identical requests
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if identical request is already pending
    const existing = this.pendingRequests.get(key)
    if (existing) {
      return existing
    }

    // Create new request
    const promise = requestFn()
    this.pendingRequests.set(key, promise)

    // Clean up after completion or timeout
    const cleanup = () => {
      this.pendingRequests.delete(key)
    }

    promise.then(cleanup, cleanup)
    setTimeout(cleanup, this.REQUEST_TTL)

    return promise
  }

  /**
   * Generate cache key for file operations
   */
  generateKey(operation: string, params: any): string {
    const keyParts = [operation]

    // Add relevant parameters to key
    if (params.fileId) keyParts.push(`id:${params.fileId}`)
    if (params.q) keyParts.push(`q:${params.q}`)
    if (params.pageToken) keyParts.push(`token:${params.pageToken}`)
    if (params.pageSize) keyParts.push(`size:${params.pageSize}`)
    if (params.orderBy) keyParts.push(`order:${params.orderBy}`)

    return keyParts.join('|')
  }
}

/**
 * Exponential backoff with jitter for retry logic
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 0.1 * exponentialDelay
  const maxDelay = 32000 // 32 seconds max

  return Math.min(exponentialDelay + jitter, maxDelay)
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private metrics = new Map<string, { count: number; totalTime: number; errors: number }>()

  /**
   * Track request performance
   */
  async trackRequest<T>(operation: string, requestFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()
    const metric = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      errors: 0,
    }

    try {
      const result = await requestFn()
      const duration = Date.now() - startTime

      metric.count++
      metric.totalTime += duration
      this.metrics.set(operation, metric)

      // Log slow requests in development
      if (process.env.NODE_ENV === 'development' && duration > 2000) {
        console.warn(`[Performance] Slow ${operation}: ${duration}ms`)
      }

      return result
    } catch (error) {
      metric.errors++
      this.metrics.set(operation, metric)
      throw error
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): Record<string, { avgTime: number; count: number; errorRate: number }> {
    const stats: Record<string, any> = {}

    for (const [operation, metric] of this.metrics) {
      stats[operation] = {
        avgTime: metric.count > 0 ? Math.round(metric.totalTime / metric.count) : 0,
        count: metric.count,
        errorRate: metric.count > 0 ? (metric.errors / metric.count) * 100 : 0,
      }
    }

    return stats
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics.clear()
  }
}

// Global instances
export const performanceMonitor = new PerformanceMonitor()
export const requestDeduplicator = new RequestDeduplicator()
