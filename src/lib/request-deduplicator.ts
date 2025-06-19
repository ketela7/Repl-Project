/**
 * Request deduplication system to prevent infinite API calls
 */
class RequestDeduplicator {
  private activeRequests = new Map<string, Promise<any>>();
  private requestTimestamps = new Map<string, number>();
  private readonly TTL = 5000; // 5 seconds TTL for requests

  /**
   * Execute a request with deduplication
   */
  async execute<T>(
    key: string, 
    requestFn: () => Promise<T>,
    ttl: number = this.TTL
  ): Promise<T> {
    // Check if request is already in progress
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key) as Promise<T>;
    }

    // Check if we have a recent result (within TTL) - but still allow the request
    const timestamp = this.requestTimestamps.get(key);
    if (timestamp && Date.now() - timestamp < ttl) {
      // For very recent requests, skip deduplication to prevent blocking valid requests
      console.log(`Skipping deduplication for recent request: ${key}`);
    }

    // Create and store the request
    const requestPromise = requestFn()
      .then((result) => {
        this.requestTimestamps.set(key, Date.now());
        return result;
      })
      .finally(() => {
        this.activeRequests.delete(key);
      });

    this.activeRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Check if a request is currently active
   */
  isActive(key: string): boolean {
    return this.activeRequests.has(key);
  }

  /**
   * Cancel a specific request
   */
  cancel(key: string): void {
    this.activeRequests.delete(key);
    this.requestTimestamps.delete(key);
  }

  /**
   * Clear all requests (cleanup)
   */
  clear(): void {
    this.activeRequests.clear();
    this.requestTimestamps.clear();
  }

  /**
   * Clean up old timestamps
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.requestTimestamps.entries()) {
      if (now - timestamp > this.TTL * 2) {
        this.requestTimestamps.delete(key);
      }
    }
  }
}

export const requestDeduplicator = new RequestDeduplicator();