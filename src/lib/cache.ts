/**
 * Simple in-memory cache for Google Drive API responses
 * This helps reduce API calls and improve loading performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 20000 // Increased cache size for better performance

  set<T>(key: string, data: T, ttlMinutes: number = 60): void {
    // Clean up old entries if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    // Support both minutes (>= 1) and milliseconds (< 1) for testing
    const ttl = ttlMinutes >= 1 ? ttlMinutes * 60 * 1000 : ttlMinutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.cache.delete(key))

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      const toRemove = entries.slice(0, entries.length - this.maxSize + 10)
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  // Generate cache key for Drive API requests
  generateDriveKey(params: {
    parentId?: string
    userId: string
    pageToken?: string
    query?: string
    pageSize?: number
  }): string {
    const { parentId = 'root', userId, pageToken = 'p1', query = '', pageSize = 50 } = params

    // Create a more comprehensive cache key with all filter parameters including pageSize
    const keyParts = ['drive', userId, parentId, pageToken, query, pageSize.toString()]

    // Join with ':' and remove empty parts to avoid unnecessary cache misses
    return keyParts.map(part => part || 'empty').join(':')
  }

  // Generate cache key for file details
  generateFileDetailsKey(fileId: string, userId: string): string {
    return `details:${userId}:${fileId}`
  }

  // Generate cache key for folder structure
  generateFolderStructureKey(userId: string): string {
    return `folder-structure:${userId}`
  }

  // Generate cache key for search results
  generateSearchKey(query: string, userId: string): string {
    return `search:${userId}:${encodeURIComponent(query)}`
  }

  // Get cache statistics for debugging
  getStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }

  setMaxSize(newMaxSize: number): void {
    this.maxSize = newMaxSize
    if (this.cache.size > this.maxSize) {
      this.cleanup()
    }
  }

  // Clear all cache entries for a specific user
  clearUserCache(userId: string): void {
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Clear cache entries for specific folder/context
  clearFolderCache(userId: string, folderId: string = 'root'): void {
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (key.includes(userId) && key.includes(folderId)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Clear cache entries that match specific filter patterns
  clearFilterCache(userId: string, filterType: string): void {
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (key.includes(userId) && key.includes(filterType)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Smart cache invalidation - clear only related entries
  invalidateRelatedCache(
    userId: string,
    context: {
      folderId?: string
      viewStatus?: string
      fileType?: string
    },
  ): void {
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (!key.includes(userId)) continue

      let shouldDelete = false

      if (context.folderId && key.includes(context.folderId)) {
        shouldDelete = true
      }

      if (context.viewStatus && key.includes(context.viewStatus)) {
        shouldDelete = true
      }

      if (context.fileType && key.includes(context.fileType)) {
        shouldDelete = true
      }

      if (shouldDelete) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Export singleton instance
export const driveCache = new MemoryCache()

// Add setMaxSize method to the exported instance
if (!driveCache.setMaxSize) {
  ;(driveCache as any).setMaxSize = function (newMaxSize: number) {
    ;(this as any).maxSize = newMaxSize
    if ((this as any).cache.size > (this as any).maxSize) {
      ;(this as any).cleanup()
    }
  }
}
