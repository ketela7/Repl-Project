/**
 * Enhanced Bulk Operations Manager
 * Handles bulk file operations with proper error handling, skip logic, and activity logging
 */

import { toast } from 'sonner';
import { DriveFile, DriveFolder } from './google-drive/types';
import { getFileActions } from './google-drive/utils';
import { createBulkOperation, updateBulkOperation, logActivity } from './db-utils';
// Use a simple UUID generator for client-side compatibility
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface BulkOperationItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  capabilities?: any;
  trashed?: boolean;
}

export interface BulkOperationResult {
  success: BulkOperationItem[];
  failed: Array<{ item: BulkOperationItem; error: string }>;
  skipped: Array<{ item: BulkOperationItem; reason: string }>;
  total: number;
  batchId?: string;
  canRetry?: boolean;
  retryableItems?: BulkOperationItem[];
}

export interface BulkOperationConfig {
  operation: string;
  items: BulkOperationItem[];
  userId: string;
  activeView: string;
  onProgress?: (progress: { completed: number; total: number; current?: string }) => void;
  onComplete?: (result: BulkOperationResult) => void;
}

class BulkOperationsManager {
  private activeOperations = new Map<string, boolean>();
  private operationHistory = new Map<string, BulkOperationResult>();

  /**
   * Execute bulk operation with comprehensive error handling and logging
   */
  async executeBulkOperation(config: BulkOperationConfig): Promise<BulkOperationResult> {
    const { operation, items, userId, activeView, onProgress, onComplete } = config;
    const batchId = generateUUID();
    
    // Prevent duplicate operations
    if (this.activeOperations.has(batchId)) {
      throw new Error('Operation already in progress');
    }

    this.activeOperations.set(batchId, true);

    const result: BulkOperationResult = {
      success: [],
      failed: [],
      skipped: [],
      total: items.length
    };

    try {
      // Create bulk operation record
      await createBulkOperation({
        batchId,
        userId,
        operation,
        totalItems: items.length,
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
        isCompleted: false,
      });

      // Pre-filter items and show preview
      const { processableItems, skippedItems } = this.preFilterItems(items, operation, activeView);
      
      // Add skipped items to result immediately
      result.skipped.push(...skippedItems.map(({ item, reason }) => ({ item, reason })));
      
      // Log skipped items
      for (const { item, reason } of skippedItems) {
        await logActivity({
          userId,
          operation,
          itemType: item.type,
          itemId: item.id,
          itemName: item.name,
          status: 'skipped',
          errorMessage: reason,
          batchId,
        });
      }

      if (processableItems.length === 0) {
        toast.warning(`No items can be processed for ${operation}. All items were skipped.`);
        return result;
      }

      // Show operation preview
      const preview = this.generateOperationPreview(operation, processableItems, skippedItems);
      toast.info(preview, { duration: 3000 });

      // Determine if operation can be parallelized
      const canParallelize = this.canParallelizeOperation(operation);
      const batchSize = canParallelize ? Math.min(5, Math.ceil(processableItems.length / 4)) : 1;

      const startTime = Date.now();

      if (canParallelize && processableItems.length > 3) {
        // Parallel processing for safe operations
        await this.executeParallelOperation(
          operation, 
          processableItems, 
          activeView, 
          batchSize, 
          userId, 
          batchId, 
          result, 
          onProgress,
          startTime
        );
      } else {
        // Sequential processing for complex operations
        await this.executeSequentialOperation(
          operation, 
          processableItems, 
          activeView, 
          userId, 
          batchId, 
          result, 
          onProgress,
          startTime
        );
      }

      // Update bulk operation record
      await updateBulkOperation(batchId, {
        successCount: result.success.length,
        failedCount: result.failed.length,
        skippedCount: result.skipped.length,
        isCompleted: true,
        completedAt: new Date(),
      });

      // Add retry capability to result
      result.batchId = batchId;
      result.canRetry = result.failed.length > 0;
      result.retryableItems = result.failed.map(f => f.item);

      // Store operation history for retry functionality
      this.operationHistory.set(batchId, result);

      // Show completion toast with performance metrics
      this.showCompletionToast(operation, result, startTime);
      
      onComplete?.(result);
      
      return result;

    } finally {
      this.activeOperations.delete(batchId);
    }
  }

  /**
   * Check if an item should be skipped for the given operation
   */
  private shouldSkipItem(item: BulkOperationItem, operation: string, activeView: string): { shouldSkip: boolean; reason: string } {
    // Convert item to format expected by getFileActions
    const fileItem = {
      id: item.id,
      name: item.name,
      mimeType: item.mimeType || 'application/octet-stream',
      capabilities: item.capabilities || {},
      trashed: item.trashed || false,
    };

    const actions = getFileActions(fileItem, activeView);

    switch (operation) {
      case 'bulk_download':
        if (item.type === 'folder') {
          return { shouldSkip: true, reason: 'Folders cannot be downloaded (only individual files)' };
        }
        if (!actions.canDownload) {
          return { shouldSkip: true, reason: 'Download not permitted (restricted by file owner)' };
        }
        // Skip Google Workspace files that need export
        if (item.mimeType && item.mimeType.startsWith('application/vnd.google-apps.')) {
          return { shouldSkip: true, reason: 'Google Workspace files require export (use Export feature instead)' };
        }
        break;

      case 'bulk_delete':
      case 'bulk_trash':
        if (item.trashed) {
          return { shouldSkip: true, reason: 'Item is already in trash' };
        }
        if (!actions.canTrash) {
          return { shouldSkip: true, reason: 'Delete/trash not permitted (insufficient permissions)' };
        }
        break;

      case 'bulk_permanent_delete':
        if (!actions.canPermanentDelete) {
          return { shouldSkip: true, reason: 'Permanent delete not permitted (insufficient permissions)' };
        }
        break;

      case 'bulk_restore':
        if (!item.trashed) {
          return { shouldSkip: true, reason: 'Item is not in trash (already restored)' };
        }
        if (!actions.canRestore) {
          return { shouldSkip: true, reason: 'Restore not permitted (insufficient permissions)' };
        }
        break;

      case 'bulk_copy':
        if (item.type === 'folder') {
          return { shouldSkip: true, reason: 'Folders cannot be copied (Google Drive API limitation)' };
        }
        if (!actions.canCopy) {
          return { shouldSkip: true, reason: 'Copy not permitted (insufficient permissions)' };
        }
        break;

      case 'bulk_move':
        if (!actions.canMove) {
          return { shouldSkip: true, reason: 'Move not permitted (insufficient permissions)' };
        }
        break;

      case 'bulk_rename':
        if (!actions.canRename) {
          return { shouldSkip: true, reason: 'Rename not permitted (insufficient permissions)' };
        }
        break;

      case 'bulk_share':
        if (!actions.canShare) {
          return { shouldSkip: true, reason: 'Share not permitted (insufficient permissions)' };
        }
        if (item.trashed) {
          return { shouldSkip: true, reason: 'Cannot share items in trash' };
        }
        break;

      default:
        return { shouldSkip: true, reason: `Unknown operation: ${operation}` };
    }

    return { shouldSkip: false, reason: '' };
  }

  /**
   * Execute the actual operation for a single item
   */
  private async executeOperation(operation: string, item: BulkOperationItem, activeView: string): Promise<void> {
    const baseUrl = '/api/drive/files';
    
    switch (operation) {
      case 'bulk_download':
        // For file downloads, create a download link and trigger download
        if (item.type === 'file') {
          const link = document.createElement('a');
          link.href = `/api/drive/download/${item.id}`;
          link.download = item.name;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Add a small delay to prevent browser overload
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          throw new Error('Folders cannot be downloaded');
        }
        break;

      case 'bulk_trash':
        const trashResponse = await fetch(`${baseUrl}/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'trash' }),
        });
        if (!trashResponse.ok) {
          const errorData = await trashResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to move "${item.name}" to trash`);
        }
        break;

      case 'bulk_permanent_delete':
        const deleteResponse = await fetch(`${baseUrl}/${item.id}`, {
          method: 'DELETE',
        });
        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to permanently delete "${item.name}"`);
        }
        break;

      case 'bulk_restore':
        const restoreResponse = await fetch(`${baseUrl}/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore' }),
        });
        if (!restoreResponse.ok) {
          const errorData = await restoreResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to restore "${item.name}"`);
        }
        break;

      case 'bulk_copy':
        const copyResponse = await fetch(`${baseUrl}/${item.id}/copy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Copy of ${item.name}` }),
        });
        if (!copyResponse.ok) {
          const errorData = await copyResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to copy "${item.name}"`);
        }
        break;

      case 'bulk_move':
        // This operation requires a target folder ID which should be provided
        throw new Error('Move operation requires target folder selection');

      case 'bulk_rename':
        // This operation requires a new name pattern which should be provided
        throw new Error('Rename operation requires new name pattern');

      case 'bulk_share':
        const shareResponse = await fetch(`${baseUrl}/${item.id}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'get_share_link',
            role: 'reader',
            type: 'anyone' 
          }),
        });
        if (!shareResponse.ok) {
          const errorData = await shareResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to share "${item.name}"`);
        }
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Pre-filter items and separate processable from skipped items
   */
  private preFilterItems(items: BulkOperationItem[], operation: string, activeView: string): {
    processableItems: BulkOperationItem[];
    skippedItems: Array<{ item: BulkOperationItem; reason: string }>;
  } {
    const processableItems: BulkOperationItem[] = [];
    const skippedItems: Array<{ item: BulkOperationItem; reason: string }> = [];

    for (const item of items) {
      const skipResult = this.shouldSkipItem(item, operation, activeView);
      if (skipResult.shouldSkip) {
        skippedItems.push({ item, reason: skipResult.reason });
      } else {
        processableItems.push(item);
      }
    }

    return { processableItems, skippedItems };
  }

  /**
   * Generate operation preview message
   */
  private generateOperationPreview(
    operation: string, 
    processableItems: BulkOperationItem[], 
    skippedItems: Array<{ item: BulkOperationItem; reason: string }>
  ): string {
    const operationName = operation.replace('bulk_', '').replace('_', ' ');
    let preview = `${operationName}: ${processableItems.length} items will be processed`;
    
    if (skippedItems.length > 0) {
      preview += `, ${skippedItems.length} skipped`;
    }

    // Add time estimation for large operations
    if (processableItems.length > 10) {
      const estimatedTime = this.estimateOperationTime(operation, processableItems.length);
      preview += ` (estimated: ${estimatedTime})`;
    }

    return preview;
  }

  /**
   * Estimate operation completion time
   */
  private estimateOperationTime(operation: string, itemCount: number): string {
    const baseTimePerItem = {
      'bulk_download': 500,
      'bulk_trash': 200,
      'bulk_restore': 200,
      'bulk_copy': 800,
      'bulk_permanent_delete': 300,
      'bulk_share': 400
    };

    const timeMs = (baseTimePerItem[operation as keyof typeof baseTimePerItem] || 300) * itemCount;
    
    if (timeMs < 5000) return `${Math.ceil(timeMs / 1000)}s`;
    if (timeMs < 60000) return `${Math.ceil(timeMs / 1000)}s`;
    return `${Math.ceil(timeMs / 60000)}m`;
  }

  /**
   * Check if operation can be safely parallelized
   */
  private canParallelizeOperation(operation: string): boolean {
    const parallelizableOps = ['bulk_download', 'bulk_copy', 'bulk_share'];
    return parallelizableOps.includes(operation);
  }

  /**
   * Execute operations in parallel batches
   */
  private async executeParallelOperation(
    operation: string,
    items: BulkOperationItem[],
    activeView: string,
    batchSize: number,
    userId: string,
    batchId: string,
    result: BulkOperationResult,
    onProgress?: (progress: { completed: number; total: number; current?: string }) => void,
    startTime: number = Date.now()
  ): Promise<void> {
    const batches = this.chunkArray(items, batchSize);
    let completedItems = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Process batch in parallel
      const batchPromises = batch.map(async (item) => {
        try {
          await this.executeOperation(operation, item, activeView);
          
          result.success.push(item);
          
          await logActivity({
            userId,
            operation,
            itemType: item.type,
            itemId: item.id,
            itemName: item.name,
            status: 'success',
            batchId,
          });

          return { item, success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failed.push({ item, error: errorMessage });
          
          await logActivity({
            userId,
            operation,
            itemType: item.type,
            itemId: item.id,
            itemName: item.name,
            status: 'failed',
            errorMessage,
            batchId,
          });

          return { item, success: false, error: errorMessage };
        }
      });

      // Wait for batch completion
      await Promise.all(batchPromises);
      
      completedItems += batch.length;
      
      // Update progress with performance info
      const elapsed = Date.now() - startTime;
      const estimatedTotal = (elapsed / completedItems) * items.length;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      
      onProgress?.({ 
        completed: completedItems, 
        total: items.length, 
        current: `Batch ${batchIndex + 1}/${batches.length} - ${Math.ceil(remaining / 1000)}s remaining`
      });

      // Add delay between batches to prevent rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  /**
   * Execute operations sequentially
   */
  private async executeSequentialOperation(
    operation: string,
    items: BulkOperationItem[],
    activeView: string,
    userId: string,
    batchId: string,
    result: BulkOperationResult,
    onProgress?: (progress: { completed: number; total: number; current?: string }) => void,
    startTime: number = Date.now()
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Calculate progress with time estimation
      const elapsed = Date.now() - startTime;
      const estimatedTotal = i > 0 ? (elapsed / i) * items.length : 0;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      
      onProgress?.({ 
        completed: i, 
        total: items.length, 
        current: `${item.name} - ${Math.ceil(remaining / 1000)}s remaining`
      });

      try {
        await this.executeOperation(operation, item, activeView);
        
        result.success.push(item);
        
        await logActivity({
          userId,
          operation,
          itemType: item.type,
          itemId: item.id,
          itemName: item.name,
          status: 'success',
          batchId,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.failed.push({ item, error: errorMessage });
        
        await logActivity({
          userId,
          operation,
          itemType: item.type,
          itemId: item.id,
          itemName: item.name,
          status: 'failed',
          errorMessage,
          batchId,
        });
      }

      // Add delay for rate limiting
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Show completion toast with detailed results and performance metrics
   */
  private showCompletionToast(operation: string, result: BulkOperationResult, startTime?: number): void {
    const { success, failed, skipped, total } = result;
    const operationName = operation.replace('bulk_', '').replace('_', ' ');
    
    // Calculate performance metrics
    let performanceInfo = '';
    if (startTime && success.length > 0) {
      const elapsed = Date.now() - startTime;
      const avgTime = elapsed / success.length;
      performanceInfo = ` (${(elapsed / 1000).toFixed(1)}s, avg: ${avgTime.toFixed(0)}ms/item)`;
    }
    
    if (failed.length === 0 && skipped.length === 0) {
      // All successful
      toast.success(`✅ ${operationName} completed successfully for all ${total} items${performanceInfo}`);
    } else if (success.length === 0) {
      // All failed or skipped
      if (skipped.length > 0) {
        toast.warning(`⚠️ ${operationName}: All ${total} items were skipped (unsupported operation)`);
      } else {
        toast.error(`❌ ${operationName} failed for all ${total} items`);
      }
    } else {
      // Mixed results - show detailed breakdown
      const parts = [`✅ ${success.length} successful`];
      if (failed.length > 0) parts.push(`❌ ${failed.length} failed`);
      if (skipped.length > 0) parts.push(`⚠️ ${skipped.length} skipped`);
      
      toast.info(`${operationName} completed: ${parts.join(', ')}${performanceInfo}`);
    }

    // Show detailed skip reasons for user education
    if (skipped.length > 0) {
      const skipReasons = new Map<string, string[]>();
      skipped.forEach(({ item, reason }) => {
        if (!skipReasons.has(reason)) {
          skipReasons.set(reason, []);
        }
        skipReasons.get(reason)!.push(item.name);
      });

      // Show detailed skip information
      skipReasons.forEach((items, reason) => {
        const itemList = items.length > 3 
          ? `${items.slice(0, 3).join(', ')} and ${items.length - 3} more`
          : items.join(', ');
        
        toast.info(`Skipped: ${itemList} - ${reason}`, {
          duration: 5000,
        });
      });
    }

    // Show detailed error information if there are failures
    if (failed.length > 0) {
      console.error('Bulk operation failures:', failed);
      
      // Group errors by type for better user feedback
      const errorGroups = new Map<string, string[]>();
      failed.forEach(({ item, error }) => {
        if (!errorGroups.has(error)) {
          errorGroups.set(error, []);
        }
        errorGroups.get(error)!.push(item.name);
      });

      errorGroups.forEach((items, error) => {
        const itemList = items.length > 2 
          ? `${items.slice(0, 2).join(', ')} and ${items.length - 2} more`
          : items.join(', ');
        
        toast.error(`Failed: ${itemList} - ${error}`, {
          duration: 8000,
        });
      });

      // Show retry option for failed operations
      if (result.canRetry && result.batchId) {
        toast.info(`💡 Tip: You can retry failed items from the bulk operations history`, {
          duration: 10000,
        });
      }
    }
  }

  /**
   * Get supported operations for a set of items
   */
  /**
   * Retry failed items from a previous bulk operation
   */
  async retryFailedOperation(batchId: string, config: Omit<BulkOperationConfig, 'items'>): Promise<BulkOperationResult | null> {
    const previousResult = this.operationHistory.get(batchId);
    if (!previousResult || !previousResult.retryableItems || previousResult.retryableItems.length === 0) {
      toast.error('No failed items to retry for this operation');
      return null;
    }

    toast.info(`Retrying ${previousResult.retryableItems.length} failed items...`);

    const retryConfig: BulkOperationConfig = {
      ...config,
      items: previousResult.retryableItems,
    };

    return this.executeBulkOperation(retryConfig);
  }

  /**
   * Get operation history for a specific batch
   */
  getOperationHistory(batchId: string): BulkOperationResult | undefined {
    return this.operationHistory.get(batchId);
  }

  /**
   * Clear operation history (cleanup)
   */
  clearOperationHistory(): void {
    this.operationHistory.clear();
  }

  /**
   * Preview operation before execution
   */
  previewOperation(items: BulkOperationItem[], operation: string, activeView: string): {
    willProcess: number;
    willSkip: number;
    estimatedTime: string;
    skipReasons: Array<{ reason: string; count: number; items: string[] }>;
  } {
    const { processableItems, skippedItems } = this.preFilterItems(items, operation, activeView);
    
    // Group skip reasons
    const skipGroups = new Map<string, string[]>();
    skippedItems.forEach(({ item, reason }) => {
      if (!skipGroups.has(reason)) {
        skipGroups.set(reason, []);
      }
      skipGroups.get(reason)!.push(item.name);
    });

    const skipReasons = Array.from(skipGroups.entries()).map(([reason, items]) => ({
      reason,
      count: items.length,
      items: items.slice(0, 3) // Show first 3 items
    }));

    return {
      willProcess: processableItems.length,
      willSkip: skippedItems.length,
      estimatedTime: this.estimateOperationTime(operation, processableItems.length),
      skipReasons
    };
  }

  getSupportedOperations(items: BulkOperationItem[], activeView: string): string[] {
    const supportedOps = new Set<string>();
    
    // Check each operation against all items
    const operations = [
      'bulk_download',
      'bulk_trash',
      'bulk_permanent_delete',
      'bulk_restore',
      'bulk_copy',
      'bulk_move',
      'bulk_share'
    ];

    for (const operation of operations) {
      const hasSupported = items.some(item => {
        const skipResult = this.shouldSkipItem(item, operation, activeView);
        return !skipResult.shouldSkip;
      });
      
      if (hasSupported) {
        supportedOps.add(operation);
      }
    }

    return Array.from(supportedOps);
  }
}

export const bulkOperationsManager = new BulkOperationsManager();