/**
 * Bulk Operations Library with Parallel Processing
 * Implements intelligent batching and concurrent execution for Google Drive operations
 */

export interface BulkOperationItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webContentLink?: string;
  webViewLink?: string;
  parents?: string[];
  capabilities?: {
    canDownload?: boolean;
    canCopy?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
  };
}

export interface BulkOperationResult {
  success: boolean;
  item: BulkOperationItem;
  error?: string;
  duration?: number;
}

export interface BulkOperationProgress {
  current: number;
  total: number;
  operation: string;
  completed: BulkOperationResult[];
  failed: BulkOperationResult[];
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

export type BulkOperationType = 'download' | 'delete' | 'copy' | 'move' | 'share' | 'rename' | 'export';

export interface BulkOperationConfig {
  batchSize: number;
  delayBetweenBatches: number;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
}

// Default configurations for different operation types
const OPERATION_CONFIGS: Record<BulkOperationType, BulkOperationConfig> = {
  download: {
    batchSize: 5,
    delayBetweenBatches: 200,
    maxConcurrency: 5,
    retryAttempts: 2,
    retryDelay: 1000
  },
  copy: {
    batchSize: 3,
    delayBetweenBatches: 300,
    maxConcurrency: 3,
    retryAttempts: 3,
    retryDelay: 1500
  },
  move: {
    batchSize: 3,
    delayBetweenBatches: 300,
    maxConcurrency: 3,
    retryAttempts: 3,
    retryDelay: 1500
  },
  share: {
    batchSize: 4,
    delayBetweenBatches: 250,
    maxConcurrency: 4,
    retryAttempts: 2,
    retryDelay: 1000
  },
  delete: {
    batchSize: 2,
    delayBetweenBatches: 500,
    maxConcurrency: 2,
    retryAttempts: 1,
    retryDelay: 2000
  },
  rename: {
    batchSize: 2,
    delayBetweenBatches: 400,
    maxConcurrency: 2,
    retryAttempts: 2,
    retryDelay: 1000
  },
  export: {
    batchSize: 2,
    delayBetweenBatches: 800,
    maxConcurrency: 2,
    retryAttempts: 1,
    retryDelay: 2000
  }
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute operations in parallel batches
 */
export async function executeParallelBulkOperation<T>(
  items: BulkOperationItem[],
  operation: BulkOperationType,
  operationFunction: (item: BulkOperationItem, params?: T) => Promise<any>,
  onProgress?: (progress: BulkOperationProgress) => void,
  operationParams?: T
): Promise<BulkOperationProgress> {
  const config = OPERATION_CONFIGS[operation];
  const startTime = Date.now();
  
  const progress: BulkOperationProgress = {
    current: 0,
    total: items.length,
    operation,
    completed: [],
    failed: [],
    timeElapsed: 0
  };

  // Split items into batches
  const batches: BulkOperationItem[][] = [];
  for (let i = 0; i < items.length; i += config.batchSize) {
    batches.push(items.slice(i, i + config.batchSize));
  }

  // Process each batch in parallel
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    // Execute batch operations in parallel
    const batchPromises = batch.map(async (item): Promise<BulkOperationResult> => {
      const itemStartTime = Date.now();
      let lastError: string | undefined;
      
      // Retry logic
      for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
        try {
          await operationFunction(item, operationParams);
          const duration = Date.now() - itemStartTime;
          
          return {
            success: true,
            item,
            duration
          };
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          
          // Wait before retry (except on last attempt)
          if (attempt < config.retryAttempts) {
            await sleep(config.retryDelay);
          }
        }
      }
      
      const duration = Date.now() - itemStartTime;
      return {
        success: false,
        item,
        error: lastError,
        duration
      };
    });

    // Wait for all operations in current batch to complete
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process batch results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          progress.completed.push(result.value);
        } else {
          progress.failed.push(result.value);
        }
      } else {
        // Promise rejection (shouldn't happen with our error handling, but just in case)
        progress.failed.push({
          success: false,
          item: batch[0], // fallback item
          error: result.reason?.message || 'Promise rejection'
        });
      }
      
      progress.current++;
      progress.timeElapsed = Date.now() - startTime;
      
      // Calculate estimated time remaining
      if (progress.current > 0) {
        const averageTimePerItem = progress.timeElapsed / progress.current;
        progress.estimatedTimeRemaining = averageTimePerItem * (progress.total - progress.current);
      }
      
      // Report progress
      if (onProgress) {
        onProgress({ ...progress });
      }
    });

    // Delay between batches (except for the last batch)
    if (batchIndex < batches.length - 1) {
      await sleep(config.delayBetweenBatches);
    }
  }

  return progress;
}

/**
 * Download multiple files in parallel
 */
export async function bulkDownloadFiles(
  items: BulkOperationItem[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<BulkOperationProgress> {
  // Filter only downloadable files
  const downloadableItems = items.filter(item => 
    item.capabilities?.canDownload !== false && 
    !item.mimeType.includes('folder') &&
    item.webContentLink
  );

  return executeParallelBulkOperation(
    downloadableItems,
    'download',
    async (item) => {
      const response = await fetch(`/api/drive/download/${item.id}`);
      if (!response.ok) {
        throw new Error(`Failed to download ${item.name}: ${response.statusText}`);
      }
      
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onProgress
  );
}

/**
 * Share multiple files in parallel
 */
export async function bulkShareFiles(
  items: BulkOperationItem[],
  shareSettings: {
    type: 'user' | 'group' | 'domain' | 'anyone';
    role: 'reader' | 'writer' | 'commenter';
    emailAddress?: string;
    domain?: string;
  },
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<BulkOperationProgress> {
  const shareableItems = items.filter(item => 
    item.capabilities?.canShare !== false
  );

  return executeParallelBulkOperation(
    shareableItems,
    'share',
    async (item, params) => {
      const response = await fetch(`/api/drive/files/${item.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to share ${item.name}: ${response.statusText}`);
      }
    },
    onProgress,
    shareSettings
  );
}

/**
 * Copy multiple files in parallel
 */
export async function bulkCopyFiles(
  items: BulkOperationItem[],
  targetFolderId: string,
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<BulkOperationProgress> {
  const copyableItems = items.filter(item => 
    item.capabilities?.canCopy !== false
  );

  return executeParallelBulkOperation(
    copyableItems,
    'copy',
    async (item, params) => {
      const response = await fetch(`/api/drive/files/${item.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: params })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to copy ${item.name}: ${response.statusText}`);
      }
    },
    onProgress,
    targetFolderId
  );
}

/**
 * Move multiple files in parallel
 */
export async function bulkMoveFiles(
  items: BulkOperationItem[],
  targetFolderId: string,
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<BulkOperationProgress> {
  const movableItems = items.filter(item => 
    item.capabilities?.canEdit !== false
  );

  return executeParallelBulkOperation(
    movableItems,
    'move',
    async (item, params) => {
      const response = await fetch(`/api/drive/files/${item.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: params })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to move ${item.name}: ${response.statusText}`);
      }
    },
    onProgress,
    targetFolderId
  );
}

/**
 * Delete multiple files (sequential for safety)
 */
export async function bulkDeleteFiles(
  items: BulkOperationItem[],
  permanent: boolean = false,
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<BulkOperationProgress> {
  const deletableItems = items.filter(item => 
    item.capabilities?.canDelete !== false
  );

  // Use sequential processing for delete operations for safety
  const startTime = Date.now();
  const progress: BulkOperationProgress = {
    current: 0,
    total: deletableItems.length,
    operation: 'delete',
    completed: [],
    failed: [],
    timeElapsed: 0
  };

  for (const item of deletableItems) {
    const itemStartTime = Date.now();
    
    try {
      const response = await fetch(`/api/drive/files/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permanent })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete ${item.name}: ${response.statusText}`);
      }
      
      const duration = Date.now() - itemStartTime;
      progress.completed.push({
        success: true,
        item,
        duration
      });
    } catch (error) {
      const duration = Date.now() - itemStartTime;
      progress.failed.push({
        success: false,
        item,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
    
    progress.current++;
    progress.timeElapsed = Date.now() - startTime;
    
    // Calculate estimated time remaining
    if (progress.current > 0) {
      const averageTimePerItem = progress.timeElapsed / progress.current;
      progress.estimatedTimeRemaining = averageTimePerItem * (progress.total - progress.current);
    }
    
    // Report progress
    if (onProgress) {
      onProgress({ ...progress });
    }
    
    // Delay between operations for safety
    if (progress.current < progress.total) {
      await sleep(OPERATION_CONFIGS.delete.delayBetweenBatches);
    }
  }

  return progress;
}

/**
 * Get operation preview and validation
 */
export function getOperationPreview(
  items: BulkOperationItem[],
  operation: BulkOperationType
): {
  processableItems: BulkOperationItem[];
  skippedItems: BulkOperationItem[];
  estimatedDuration: number;
  skipReasons: Record<string, BulkOperationItem[]>;
} {
  const skipReasons: Record<string, BulkOperationItem[]> = {};
  const processableItems: BulkOperationItem[] = [];
  const skippedItems: BulkOperationItem[] = [];

  items.forEach(item => {
    let canProcess = true;
    let skipReason = '';

    switch (operation) {
      case 'download':
        if (item.mimeType.includes('folder')) {
          canProcess = false;
          skipReason = 'Folders cannot be downloaded';
        } else if (!item.webContentLink) {
          canProcess = false;
          skipReason = 'No download link available';
        } else if (item.capabilities?.canDownload === false) {
          canProcess = false;
          skipReason = 'Insufficient permissions';
        }
        break;
        
      case 'share':
        if (item.capabilities?.canShare === false) {
          canProcess = false;
          skipReason = 'Cannot share this item';
        }
        break;
        
      case 'copy':
        if (item.capabilities?.canCopy === false) {
          canProcess = false;
          skipReason = 'Cannot copy this item';
        }
        break;
        
      case 'move':
      case 'delete':
        if (item.capabilities?.canEdit === false) {
          canProcess = false;
          skipReason = 'Cannot modify this item';
        }
        break;
    }

    if (canProcess) {
      processableItems.push(item);
    } else {
      skippedItems.push(item);
      if (!skipReasons[skipReason]) {
        skipReasons[skipReason] = [];
      }
      skipReasons[skipReason].push(item);
    }
  });

  // Estimate duration based on operation type and item count
  const config = OPERATION_CONFIGS[operation];
  const batches = Math.ceil(processableItems.length / config.batchSize);
  const estimatedDuration = (batches * config.delayBetweenBatches) + (processableItems.length * 500); // 500ms average per item

  return {
    processableItems,
    skippedItems,
    estimatedDuration,
    skipReasons
  };
}