/**
 * Intelligent prefetching system for Google Drive
 * Predicts and preloads content user is likely to access
 */

import { driveCache } from './cache';
import { requestQueue } from './request-queue';

interface PrefetchEntry {
  folderId: string;
  priority: number;
  lastAccessed: number;
  accessCount: number;
}

class PrefetchManager {
  private accessHistory = new Map<string, PrefetchEntry>();
  private prefetchQueue = new Set<string>();
  private maxPrefetchConcurrency = 2;
  private activePrefetches = new Set<string>();

  // Track folder access patterns
  trackFolderAccess(folderId: string) {
    const entry = this.accessHistory.get(folderId);
    const now = Date.now();

    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = now;
      entry.priority = this.calculatePriority(entry);
    } else {
      this.accessHistory.set(folderId, {
        folderId,
        priority: 1,
        lastAccessed: now,
        accessCount: 1
      });
    }

    // Trigger prefetching for related folders
    this.schedulePrefetch(folderId);
  }

  private calculatePriority(entry: PrefetchEntry): number {
    const recency = Math.max(0, 1 - (Date.now() - entry.lastAccessed) / (24 * 60 * 60 * 1000)); // 24h decay
    const frequency = Math.min(1, entry.accessCount / 10); // Cap at 10 accesses
    return recency * 0.7 + frequency * 0.3;
  }

  private async schedulePrefetch(currentFolderId: string) {
    // Get folders to prefetch based on access patterns
    const candidateFolders = this.getPrefetchCandidates(currentFolderId);
    
    for (const folderId of candidateFolders) {
      if (this.shouldPrefetch(folderId)) {
        this.prefetchQueue.add(folderId);
      }
    }

    this.processPrefetchQueue();
  }

  private getPrefetchCandidates(currentFolderId: string): string[] {
    // Get most frequently accessed folders
    const topFolders = Array.from(this.accessHistory.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map(entry => entry.folderId);

    // Always include root folder if not current
    const candidates = new Set(topFolders);
    if (currentFolderId !== 'root') {
      candidates.add('root');
    }

    // Remove current folder from candidates
    candidates.delete(currentFolderId);

    return Array.from(candidates);
  }

  private shouldPrefetch(folderId: string): boolean {
    // Check if already cached
    const cacheKey = driveCache.generateDriveKey({
      parentId: folderId,
      userId: 'current' // Will be replaced in actual implementation
    });

    if (driveCache.has(cacheKey)) {
      return false; // Already cached
    }

    // Check if already in prefetch queue or being processed
    return !this.prefetchQueue.has(folderId) && !this.activePrefetches.has(folderId);
  }

  private async processPrefetchQueue() {
    if (this.activePrefetches.size >= this.maxPrefetchConcurrency) {
      return;
    }

    const foldersToProcess = Array.from(this.prefetchQueue)
      .slice(0, this.maxPrefetchConcurrency - this.activePrefetches.size);

    for (const folderId of foldersToProcess) {
      this.prefetchQueue.delete(folderId);
      this.prefetchFolder(folderId);
    }
  }

  private async prefetchFolder(folderId: string) {
    if (this.activePrefetches.has(folderId)) return;

    this.activePrefetches.add(folderId);

    try {
      const requestId = `prefetch-${folderId}`;
      
      await requestQueue.enqueue(
        requestId,
        () => this.fetchFolderData(folderId),
        'low' // Prefetch has lowest priority
      );

      console.log(`Prefetched folder: ${folderId}`);
    } catch (error) {
      console.warn(`Prefetch failed for folder ${folderId}:`, error);
    } finally {
      this.activePrefetches.delete(folderId);
      
      // Continue processing queue
      setTimeout(() => this.processPrefetchQueue(), 100);
    }
  }

  private async fetchFolderData(folderId: string) {
    const params = new URLSearchParams();
    if (folderId && folderId !== 'root') {
      params.append('parentId', folderId);
    }
    params.append('pageSize', '30');

    const response = await fetch(`/api/drive/files?${params}`);
    if (!response.ok) {
      throw new Error(`Prefetch failed: ${response.status}`);
    }

    return response.json();
  }

  // Prefetch thumbnails for visible files
  async prefetchThumbnails(files: Array<{ id: string; thumbnailLink?: string }>) {
    const thumbnailUrls = files
      .filter(file => file.thumbnailLink)
      .map(file => file.thumbnailLink!)
      .slice(0, 10); // Limit to first 10 visible files

    // Prefetch thumbnails in background
    thumbnailUrls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }

  // Get prefetch statistics
  getStats() {
    return {
      accessHistorySize: this.accessHistory.size,
      prefetchQueueSize: this.prefetchQueue.size,
      activePrefetches: this.activePrefetches.size,
      topFolders: Array.from(this.accessHistory.values())
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5)
        .map(entry => ({ folderId: entry.folderId, priority: entry.priority }))
    };
  }

  clear() {
    this.accessHistory.clear();
    this.prefetchQueue.clear();
    this.activePrefetches.clear();
  }
}

export const prefetchManager = new PrefetchManager();