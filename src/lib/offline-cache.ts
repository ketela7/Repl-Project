/**
 * Offline cache strategy for Google Drive data
 * Provides persistent storage and offline access capabilities
 */

interface OfflineData {
  files: any[];
  folders: any[];
  lastSync: number;
  userId: string;
  version: number;
}

interface CacheMetadata {
  key: string;
  size: number;
  lastAccessed: number;
  priority: 'high' | 'medium' | 'low';
}

class OfflineCache {
  private readonly STORAGE_KEY = 'gdrive_offline_cache';
  private readonly METADATA_KEY = 'gdrive_cache_metadata';
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CACHE_VERSION = 1;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store data for offline access
   */
  async storeOfflineData(
    userId: string,
    files: any[],
    folders: any[] = [],
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    try {
      const data: OfflineData = {
        files: this.sanitizeForStorage(files),
        folders: this.sanitizeForStorage(folders),
        lastSync: Date.now(),
        userId,
        version: this.CACHE_VERSION
      };

      const key = this.generateStorageKey(userId);
      const serializedData = JSON.stringify(data);
      
      // Check storage size limits
      await this.ensureStorageSpace(serializedData.length);
      
      // Store in localStorage with compression
      localStorage.setItem(key, serializedData);
      
      // Update metadata
      await this.updateCacheMetadata(key, serializedData.length, priority);
      
      console.log(`[OfflineCache] Stored ${files.length} files for offline access`);
    } catch (error) {
      console.error('[OfflineCache] Failed to store offline data:', error);
    }
  }

  /**
   * Retrieve offline data
   */
  async getOfflineData(userId: string): Promise<OfflineData | null> {
    try {
      const key = this.generateStorageKey(userId);
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      const data: OfflineData = JSON.parse(stored);
      
      // Check version compatibility
      if (data.version !== this.CACHE_VERSION) {
        console.log('[OfflineCache] Cache version mismatch, clearing outdated data');
        localStorage.removeItem(key);
        return null;
      }
      
      // Check if data is still fresh
      const age = Date.now() - data.lastSync;
      if (age > this.DEFAULT_TTL) {
        console.log('[OfflineCache] Cache expired, returning null');
        return null;
      }
      
      // Update access time
      await this.updateLastAccessed(key);
      
      console.log(`[OfflineCache] Retrieved ${data.files.length} files from offline cache`);
      return data;
    } catch (error) {
      console.error('[OfflineCache] Failed to retrieve offline data:', error);
      return null;
    }
  }

  /**
   * Check if offline data is available
   */
  isOfflineDataAvailable(userId: string): boolean {
    const key = this.generateStorageKey(userId);
    const stored = localStorage.getItem(key);
    
    if (!stored) return false;
    
    try {
      const data: OfflineData = JSON.parse(stored);
      const age = Date.now() - data.lastSync;
      return age <= this.DEFAULT_TTL && data.version === this.CACHE_VERSION;
    } catch {
      return false;
    }
  }

  /**
   * Search through offline data
   */
  async searchOfflineData(userId: string, query: string): Promise<any[]> {
    const data = await this.getOfflineData(userId);
    if (!data) return [];
    
    const searchTerm = query.toLowerCase();
    return data.files.filter(file => 
      file.name?.toLowerCase().includes(searchTerm) ||
      file.mimeType?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number; lastSync?: number } {
    let totalSize = 0;
    let entries = 0;
    let lastSync: number | undefined;
    
    try {
      const metadata = this.getCacheMetadata();
      for (const meta of metadata) {
        totalSize += meta.size;
        entries++;
        
        const key = meta.key;
        const stored = localStorage.getItem(key);
        if (stored) {
          const data: OfflineData = JSON.parse(stored);
          if (!lastSync || data.lastSync > lastSync) {
            lastSync = data.lastSync;
          }
        }
      }
    } catch (error) {
      console.error('[OfflineCache] Failed to get cache stats:', error);
    }
    
    return { 
      size: totalSize, 
      entries, 
      ...(lastSync && { lastSync })
    };
  }

  /**
   * Clear all offline cache
   */
  clearCache(): void {
    try {
      const metadata = this.getCacheMetadata();
      for (const meta of metadata) {
        localStorage.removeItem(meta.key);
      }
      localStorage.removeItem(this.METADATA_KEY);
      console.log('[OfflineCache] Cleared all offline cache');
    } catch (error) {
      console.error('[OfflineCache] Failed to clear cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    try {
      const metadata = this.getCacheMetadata();
      let clearedCount = 0;
      
      for (const meta of metadata) {
        const stored = localStorage.getItem(meta.key);
        if (stored) {
          const data: OfflineData = JSON.parse(stored);
          const age = Date.now() - data.lastSync;
          
          if (age > this.DEFAULT_TTL || data.version !== this.CACHE_VERSION) {
            localStorage.removeItem(meta.key);
            clearedCount++;
          }
        }
      }
      
      if (clearedCount > 0) {
        this.rebuildMetadata();
        console.log(`[OfflineCache] Cleared ${clearedCount} expired cache entries`);
      }
    } catch (error) {
      console.error('[OfflineCache] Failed to clear expired cache:', error);
    }
  }

  // Private helper methods

  private generateStorageKey(userId: string): string {
    return `${this.STORAGE_KEY}_${userId}`;
  }

  private sanitizeForStorage(data: any[]): any[] {
    return data.map(item => ({
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      size: item.size,
      modifiedTime: item.modifiedTime,
      createdTime: item.createdTime,
      owners: item.owners,
      parents: item.parents,
      starred: item.starred,
      trashed: item.trashed,
      shared: item.shared
    }));
  }

  private async ensureStorageSpace(requiredSize: number): Promise<void> {
    const currentStats = this.getCacheStats();
    
    if (currentStats.size + requiredSize > this.MAX_STORAGE_SIZE) {
      console.log('[OfflineCache] Storage limit reached, clearing least accessed entries');
      await this.clearLeastAccessedEntries(requiredSize);
    }
  }

  private async clearLeastAccessedEntries(requiredSpace: number): Promise<void> {
    const metadata = this.getCacheMetadata()
      .sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    let clearedSpace = 0;
    
    for (const meta of metadata) {
      if (clearedSpace >= requiredSpace) break;
      
      localStorage.removeItem(meta.key);
      clearedSpace += meta.size;
    }
    
    this.rebuildMetadata();
  }

  private getCacheMetadata(): CacheMetadata[] {
    try {
      const stored = localStorage.getItem(this.METADATA_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private async updateCacheMetadata(
    key: string,
    size: number,
    priority: 'high' | 'medium' | 'low'
  ): Promise<void> {
    const metadata = this.getCacheMetadata();
    const existingIndex = metadata.findIndex(m => m.key === key);
    
    const newMeta: CacheMetadata = {
      key,
      size,
      lastAccessed: Date.now(),
      priority
    };
    
    if (existingIndex >= 0) {
      metadata[existingIndex] = newMeta;
    } else {
      metadata.push(newMeta);
    }
    
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
  }

  private async updateLastAccessed(key: string): Promise<void> {
    const metadata = this.getCacheMetadata();
    const meta = metadata.find(m => m.key === key);
    
    if (meta) {
      meta.lastAccessed = Date.now();
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    }
  }

  private rebuildMetadata(): void {
    const validMetadata: CacheMetadata[] = [];
    const metadata = this.getCacheMetadata();
    
    for (const meta of metadata) {
      if (localStorage.getItem(meta.key)) {
        validMetadata.push(meta);
      }
    }
    
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(validMetadata));
  }
}

export const offlineCache = new OfflineCache();

// React hook for offline functionality
import { useState, useEffect } from 'react';

export function useOfflineData(userId: string) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [cacheStats, setCacheStats] = useState(offlineCache.getCacheStats());

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data if available
    if (userId) {
      offlineCache.getOfflineData(userId).then(setOfflineData);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  const storeForOffline = async (files: any[], folders: any[] = []) => {
    await offlineCache.storeOfflineData(userId, files, folders, 'high');
    setCacheStats(offlineCache.getCacheStats());
  };

  const searchOffline = async (query: string) => {
    return await offlineCache.searchOfflineData(userId, query);
  };

  const clearOfflineCache = () => {
    offlineCache.clearCache();
    setOfflineData(null);
    setCacheStats(offlineCache.getCacheStats());
  };

  return {
    isOffline,
    offlineData,
    cacheStats,
    storeForOffline,
    searchOffline,
    clearOfflineCache,
    hasOfflineData: offlineCache.isOfflineDataAvailable(userId)
  };
}