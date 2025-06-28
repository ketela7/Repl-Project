/**
 * Search optimization utilities for handling large file sets efficiently
 * Implements intelligent caching and incremental search
 */

interface SearchResult {
  files: any[]
  totalCount: number
  hasMore: boolean
  nextPageToken?: string
  searchQuery: string
  timestamp: number
}

interface SearchCache {
  [key: string]: SearchResult
}

class SearchOptimizer {
  private cache: SearchCache = {}
  private readonly MAX_CACHE_SIZE = 100
  private readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private pendingSearches = new Map<string, Promise<SearchResult>>()

  /**
   * Optimized search that uses incremental results
   */
  async optimizedSearch(searchQuery: string, userId: string, apiCall: () => Promise<any>, folderId?: string): Promise<SearchResult> {
    // Clean search query
    const cleanQuery = searchQuery.trim().toLowerCase()
    if (!cleanQuery) {
      return {
        files: [],
        totalCount: 0,
        hasMore: false,
        searchQuery: '',
        timestamp: Date.now(),
      }
    }

    // Check for incremental search optimization
    const incrementalResult = this.checkIncrementalSearch(cleanQuery, userId, folderId)
    if (incrementalResult) {
      return incrementalResult
    }

    // Generate cache key
    const cacheKey = this.generateSearchKey(cleanQuery, userId, folderId)

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    // Check if search is already pending
    const pending = this.pendingSearches.get(cacheKey)
    if (pending) {
      return pending
    }

    // Create new search promise
    const searchPromise = this.executeSearch(cleanQuery, userId, apiCall)
    this.pendingSearches.set(cacheKey, searchPromise)

    try {
      const result = await searchPromise
      this.cacheResult(cacheKey, result)
      return result
    } finally {
      this.pendingSearches.delete(cacheKey)
    }
  }

  /**
   * Check if we can use incremental search (extending previous results)
   */
  private checkIncrementalSearch(query: string, _userId: string, folderId?: string): SearchResult | null {
    // Find cached results that this query extends (same folder context)
    const folderSuffix = folderId ? `:folder:${folderId}` : ''

    for (const [cachedKey, result] of Object.entries(this.cache)) {
      if (!this.isCacheValid(result)) continue

      // Only match within same folder context
      if (!cachedKey.endsWith(folderSuffix)) continue

      const cachedQuery = result.searchQuery.toLowerCase()

      // If current query extends a cached query, filter the cached results
      if (query.startsWith(cachedQuery) && cachedQuery.length >= 2) {
        const filteredFiles = result.files.filter((file) => file.name?.toLowerCase().includes(query) || file.mimeType?.toLowerCase().includes(query))

        return {
          files: filteredFiles,
          totalCount: filteredFiles.length,
          hasMore: false,
          searchQuery: query,
          timestamp: Date.now(),
        }
      }
    }

    return null
  }

  /**
   * Execute the actual search with performance optimizations
   */
  private async executeSearch(query: string, _userId: string, apiCall: () => Promise<any>): Promise<SearchResult> {
    const result = await apiCall()

    return {
      files: result.files || [],
      totalCount: result.files?.length || 0,
      hasMore: !!result.nextPageToken,
      nextPageToken: result.nextPageToken,
      searchQuery: query,
      timestamp: Date.now(),
    }
  }

  /**
   * Cache search result with automatic cleanup
   */
  private cacheResult(key: string, result: SearchResult): void {
    // Clean up old entries if cache is full
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      this.cleanupCache()
    }

    this.cache[key] = result
  }

  /**
   * Get result from cache if valid
   */
  private getFromCache(key: string): SearchResult | null {
    const result = this.cache[key]
    if (!result || !this.isCacheValid(result)) {
      if (result) delete this.cache[key]
      return null
    }
    return result
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(result: SearchResult): boolean {
    return Date.now() - result.timestamp < this.CACHE_TTL
  }

  /**
   * Generate cache key for search
   */
  private generateSearchKey(query: string, userId: string, folderId?: string): string {
    const folderPart = folderId ? `:folder:${folderId}` : ''
    return `search:${userId}:${query}${folderPart}`
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    const expiredKeys = Object.keys(this.cache).filter((key) => {
      const result = this.cache[key]
      return now - result.timestamp > this.CACHE_TTL
    })

    expiredKeys.forEach((key) => delete this.cache[key])

    // If still too many entries, remove oldest ones
    const entries = Object.entries(this.cache)
    if (entries.length > this.MAX_CACHE_SIZE) {
      entries
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, entries.length - this.MAX_CACHE_SIZE)
        .forEach(([key]) => delete this.cache[key])
    }
  }

  /**
   * Preload common search patterns
   */
  async preloadCommonSearches(userId: string, apiCall: (query: string) => Promise<any>): Promise<void> {
    const commonQueries = ['doc', 'pdf', 'img', 'video', 'presentation']

    const preloadPromises = commonQueries.map(async (query) => {
      try {
        await this.optimizedSearch(query, userId, () => apiCall(query))
      } catch {
        // Silent fallback for preload failures
      }
    })

    await Promise.allSettled(preloadPromises)
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; hitRate: number; entries: string[] } {
    return {
      size: Object.keys(this.cache).length,
      hitRate: 0, // Would need hit/miss tracking for accurate rate
      entries: Object.keys(this.cache),
    }
  }

  /**
   * Clear all cached search results
   */
  clearCache(): void {
    this.cache = {}
    this.pendingSearches.clear()
  }
}

export const searchOptimizer = new SearchOptimizer()
