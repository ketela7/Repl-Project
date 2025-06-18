/**
 * Client-side storage manager for offline-first architecture
 * Uses IndexedDB for persistent caching on free tier platforms
 */

interface StoredData {
  id: string;
  data: any;
  timestamp: number;
  ttl: number;
  version: number;
}

interface FolderCache {
  folderId: string;
  files: any[];
  folders: any[];
  lastUpdated: number;
  etag?: string;
}

class ClientStorageManager {
  private dbName = 'DriveManagerDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'folderId' });
          folderStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('parentId', 'parentId', { unique: false });
          fileStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('thumbnails')) {
          db.createObjectStore('thumbnails', { keyPath: 'fileId' });
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Cache folder contents
  async cacheFolderData(folderId: string, files: any[], folders: any[], etag?: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['folders', 'files'], 'readwrite');
    const folderStore = transaction.objectStore('folders');
    const fileStore = transaction.objectStore('files');
    
    const folderData: FolderCache = {
      folderId,
      files,
      folders,
      lastUpdated: Date.now(),
      etag
    };
    
    // Store folder metadata
    await this.promisifyRequest(folderStore.put(folderData));
    
    // Store individual files with parent reference
    for (const file of [...files, ...folders]) {
      const fileData = {
        ...file,
        parentId: folderId,
        lastUpdated: Date.now()
      };
      await this.promisifyRequest(fileStore.put(fileData));
    }
  }

  // Get cached folder data
  async getCachedFolderData(folderId: string, maxAge: number = 15 * 60 * 1000): Promise<FolderCache | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['folders'], 'readonly');
    const store = transaction.objectStore('folders');
    
    try {
      const result = await this.promisifyRequest(store.get(folderId));
      
      if (!result) return null;
      
      // Check if cache is still valid
      if (Date.now() - result.lastUpdated > maxAge) {
        return null;
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to get cached folder data:', error);
      return null;
    }
  }

  // Cache file thumbnail
  async cacheThumbnail(fileId: string, thumbnailData: Blob): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['thumbnails'], 'readwrite');
    const store = transaction.objectStore('thumbnails');
    
    const data = {
      fileId,
      thumbnail: thumbnailData,
      timestamp: Date.now()
    };
    
    await this.promisifyRequest(store.put(data));
  }

  // Get cached thumbnail
  async getCachedThumbnail(fileId: string): Promise<Blob | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['thumbnails'], 'readonly');
    const store = transaction.objectStore('thumbnails');
    
    try {
      const result = await this.promisifyRequest(store.get(fileId));
      return result?.thumbnail || null;
    } catch (error) {
      return null;
    }
  }

  // Store user preferences and metadata
  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    
    await this.promisifyRequest(store.put({ key, value, timestamp: Date.now() }));
  }

  // Get metadata
  async getMetadata(key: string): Promise<any> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    
    try {
      const result = await this.promisifyRequest(store.get(key));
      return result?.value || null;
    } catch (error) {
      return null;
    }
  }

  // Search cached files
  async searchCachedFiles(query: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    
    try {
      const allFiles = await this.promisifyRequest(store.getAll());
      
      const searchTerm = query.toLowerCase();
      return allFiles.filter(file => 
        file.name?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.warn('Search in cache failed:', error);
      return [];
    }
  }

  // Cleanup old cache entries
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoff = Date.now() - maxAge;
    const transaction = this.db!.transaction(['folders', 'files', 'thumbnails'], 'readwrite');
    
    // Clean old folders
    const folderStore = transaction.objectStore('folders');
    const folderIndex = folderStore.index('lastUpdated');
    const folderRange = IDBKeyRange.upperBound(cutoff);
    
    await this.promisifyRequest(folderIndex.openCursor(folderRange)).then(cursor => {
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    });
    
    // Clean old files
    const fileStore = transaction.objectStore('files');
    const fileIndex = fileStore.index('lastUpdated');
    const fileRange = IDBKeyRange.upperBound(cutoff);
    
    await this.promisifyRequest(fileIndex.openCursor(fileRange)).then(cursor => {
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    });
  }

  // Get storage usage statistics
  async getStorageStats(): Promise<{ folders: number; files: number; thumbnails: number; totalSize: number }> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['folders', 'files', 'thumbnails'], 'readonly');
    
    const [folders, files, thumbnails] = await Promise.all([
      this.promisifyRequest(transaction.objectStore('folders').count()),
      this.promisifyRequest(transaction.objectStore('files').count()),
      this.promisifyRequest(transaction.objectStore('thumbnails').count())
    ]);
    
    // Estimate total size (rough calculation)
    const totalSize = folders * 2 + files * 1 + thumbnails * 50; // KB
    
    return { folders, files, thumbnails, totalSize };
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const clientStorage = new ClientStorageManager();