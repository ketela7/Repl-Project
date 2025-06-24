/**
 * Request deduplication utility to prevent multiple identical API calls
 * This helps reduce API quota usage and improves performance
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private maxAge = 5000; // 5 seconds max age for pending requests

  /**
   * Deduplicate requests based on a unique key
   * If a request with the same key is already pending, return the existing promise
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Clean up old pending requests
    this.cleanup();

    const existing = this.pendingRequests.get(key);
    
    if (existing) {
      return existing.promise;
    }

    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Generate a cache key for drive file requests
   */
  generateDriveFilesKey(params: {
    userId: string;
    pageSize?: number;
    fileType?: string;
    viewStatus?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    folderId?: string;
    pageToken?: string;
  }): string {
    // Create more specific keys for folder navigation
    const contextKey = params.folderId ? `folder:${params.folderId}` : 'root';
    const searchKey = params.search ? `search:${params.search}` : 'browse';
    const paginationKey = params.pageToken ? `page:${params.pageToken.substring(0, 10)}` : 'p1';
    
    const keyParts = [
      'drive-files',
      params.userId,
      contextKey,
      searchKey,
      params.fileType || 'all',
      params.viewStatus || 'all',
      params.sortBy || 'modified',
      params.sortOrder || 'desc',
      paginationKey,
      params.pageSize || 50
    ];
    return keyParts.join('|');
  }

  /**
   * Get current stats for monitoring
   */
  getStats(): { pendingCount: number; keys: string[] } {
    return {
      pendingCount: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys()),
    };
  }
}

export const requestDeduplicator = new RequestDeduplicator();