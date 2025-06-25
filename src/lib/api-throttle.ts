/**
 * API throttling mechanism to prevent rate limiting
 * Implements request queuing and rate limiting for Google Drive API
 */

interface ThrottleQueue {
  promise: Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  requestFn: () => Promise<any>
  timestamp: number
}

class APIThrottle {
  private queue: ThrottleQueue[] = []
  private processing = false
  private readonly maxRequestsPerSecond = 25 // Increased for better performance
  private readonly requestInterval = 1000 / this.maxRequestsPerSecond // 40ms between requests
  private lastRequestTime = 0

  /**
   * Throttle API request to prevent rate limiting
   */
  async throttleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueItem: ThrottleQueue = {
        promise: Promise.resolve(),
        resolve,
        reject,
        requestFn,
        timestamp: Date.now(),
      }

      this.queue.push(queueItem)
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const queueItem = this.queue.shift()!

      // Calculate delay needed to respect rate limit
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      const delay = Math.max(0, this.requestInterval - timeSinceLastRequest)

      if (delay > 0) {
        await this.sleep(delay)
      }

      try {
        this.lastRequestTime = Date.now()
        const result = await queueItem.requestFn()
        queueItem.resolve(result)
      } catch (error) {
        queueItem.reject(error)
      }
    }

    this.processing = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current queue status for monitoring
   */
  getQueueStatus(): {
    queueLength: number
    processing: boolean
    lastRequestTime: number
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      lastRequestTime: this.lastRequestTime,
    }
  }

  /**
   * Clear the queue (emergency use)
   */
  clearQueue(): void {
    this.queue.forEach((item) => {
      item.reject(new Error('Queue cleared'))
    })
    this.queue = []
    this.processing = false
  }
}

export const apiThrottle = new APIThrottle()

/**
 * Convenience wrapper for Google Drive API calls
 */
export async function throttledDriveRequest<T>(
  requestFn: () => Promise<T>
): Promise<T> {
  return apiThrottle.throttleRequest(requestFn)
}
