/**
 * Server-side session caching to reduce redundant NextAuth API calls
 * Implements intelligent caching with memory-based storage
 */

import type { Session } from 'next-auth';

interface SessionCacheEntry {
  session: Session | null;
  timestamp: number;
  ttl: number;
}

class SessionCacheManager {
  private cache = new Map<string, SessionCacheEntry>();
  private readonly DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes cache
  private readonly MAX_ENTRIES = 100;
  
  /**
   * Generate cache key from request headers
   */
  private generateCacheKey(headers: Headers): string {
    const authorization = headers.get('authorization') || '';
    const cookie = headers.get('cookie') || '';
    
    // Create a simple hash from auth headers
    const authString = `${authorization}${cookie}`;
    
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < authString.length; i++) {
      const char = authString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `session_${Math.abs(hash)}`;
  }
  
  /**
   * Get cached session if valid
   */
  getCachedSession(headers: Headers): Session | null | undefined {
    const key = this.generateCacheKey(headers);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined; // No cache entry
    }
    
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      // Cache expired
      this.cache.delete(key);
      return undefined;
    }
    
    console.log(`[SessionCache] Cache hit for key: ${key.substring(0, 20)}...`);
    return entry.session;
  }
  
  /**
   * Store session in cache
   */
  setCachedSession(headers: Headers, session: Session | null): void {
    const key = this.generateCacheKey(headers);
    
    // Prevent cache overflow
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      session,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL
    });
    
    console.log(`[SessionCache] Cached session for key: ${key.substring(0, 20)}...`);
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    // If still too many entries, remove oldest
    if (this.cache.size >= this.MAX_ENTRIES) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.MAX_ENTRIES / 2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
    
    console.log(`[SessionCache] Cleanup completed. Cache size: ${this.cache.size}`);
  }
  
  /**
   * Clear all cached sessions
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[SessionCache] Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_ENTRIES
    };
  }
}

export const sessionCache = new SessionCacheManager();

/**
 * Middleware function to check session cache before making NextAuth calls
 */
export async function getCachedSession(headers: Headers, getSession: () => Promise<Session | null>): Promise<Session | null> {
  // Check cache first
  const cached = sessionCache.getCachedSession(headers);
  
  if (cached !== undefined) {
    return cached;
  }
  
  // Cache miss - fetch session and cache it
  console.log('[SessionCache] Cache miss - fetching fresh session');
  const session = await getSession();
  
  // Cache the result
  sessionCache.setCachedSession(headers, session);
  
  return session;
}