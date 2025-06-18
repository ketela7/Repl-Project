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

      // Show initial toast
      toast.info(`Starting ${operation} operation for ${items.length} items...`);

      // Process each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Update progress
        onProgress?.({ completed: i, total: items.length, current: item.name });

        try {
          // Check if operation is supported for this item
          const skipResult = this.shouldSkipItem(item, operation, activeView);
          if (skipResult.shouldSkip) {
            result.skipped.push({ item, reason: skipResult.reason });
            
            // Log skipped activity
            await logActivity({
              userId,
              operation,
              itemType: item.type,
              itemId: item.id,
              itemName: item.name,
              status: 'skipped',
              errorMessage: skipResult.reason,
              batchId,
            });
            
            continue;
          }

          // Execute the operation
          await this.executeOperation(operation, item, activeView);
          
          result.success.push(item);
          
          // Log successful activity
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
          
          // Log failed activity
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
      }

      // Update bulk operation record
      await updateBulkOperation(batchId, {
        successCount: result.success.length,
        failedCount: result.failed.length,
        skippedCount: result.skipped.length,
        isCompleted: true,
        completedAt: new Date(),
      });

      // Show completion toast
      this.showCompletionToast(operation, result);
      
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
          return { shouldSkip: true, reason: 'Folders cannot be downloaded individually' };
        }
        if (!actions.canDownload) {
          return { shouldSkip: true, reason: 'Download not permitted for this file' };
        }
        break;

      case 'bulk_delete':
      case 'bulk_trash':
        if (!actions.canTrash) {
          return { shouldSkip: true, reason: 'Delete/trash not permitted for this item' };
        }
        break;

      case 'bulk_permanent_delete':
        if (!actions.canPermanentDelete) {
          return { shouldSkip: true, reason: 'Permanent delete not permitted for this item' };
        }
        break;

      case 'bulk_restore':
        if (!actions.canRestore) {
          return { shouldSkip: true, reason: 'Restore not permitted for this item' };
        }
        break;

      case 'bulk_copy':
        if (!actions.canCopy) {
          return { shouldSkip: true, reason: 'Copy not permitted for this item' };
        }
        break;

      case 'bulk_move':
        if (!actions.canMove) {
          return { shouldSkip: true, reason: 'Move not permitted for this item' };
        }
        break;

      case 'bulk_rename':
        if (!actions.canRename) {
          return { shouldSkip: true, reason: 'Rename not permitted for this item' };
        }
        break;

      case 'bulk_share':
        if (!actions.canShare) {
          return { shouldSkip: true, reason: 'Share not permitted for this item' };
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
        // For downloads, we'll trigger the download via the existing endpoint
        const downloadResponse = await fetch(`${baseUrl}/${item.id}/download`, {
          method: 'GET',
        });
        if (!downloadResponse.ok) {
          throw new Error(`Download failed: ${downloadResponse.statusText}`);
        }
        break;

      case 'bulk_trash':
        const trashResponse = await fetch(`${baseUrl}/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trashed: true }),
        });
        if (!trashResponse.ok) {
          throw new Error(`Trash failed: ${trashResponse.statusText}`);
        }
        break;

      case 'bulk_permanent_delete':
        const deleteResponse = await fetch(`${baseUrl}/${item.id}`, {
          method: 'DELETE',
        });
        if (!deleteResponse.ok) {
          throw new Error(`Permanent delete failed: ${deleteResponse.statusText}`);
        }
        break;

      case 'bulk_restore':
        const restoreResponse = await fetch(`${baseUrl}/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trashed: false }),
        });
        if (!restoreResponse.ok) {
          throw new Error(`Restore failed: ${restoreResponse.statusText}`);
        }
        break;

      case 'bulk_copy':
        const copyResponse = await fetch(`${baseUrl}/${item.id}/copy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Copy of ${item.name}` }),
        });
        if (!copyResponse.ok) {
          throw new Error(`Copy failed: ${copyResponse.statusText}`);
        }
        break;

      // For operations like move, rename, share - we'll need additional parameters
      // These would typically require user input, so we'll throw for now
      case 'bulk_move':
      case 'bulk_rename':
      case 'bulk_share':
        throw new Error(`${operation} requires additional parameters`);

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Show completion toast with detailed results
   */
  private showCompletionToast(operation: string, result: BulkOperationResult): void {
    const { success, failed, skipped, total } = result;
    
    if (failed.length === 0 && skipped.length === 0) {
      // All successful
      toast.success(`${operation} completed successfully for all ${total} items`);
    } else if (success.length === 0) {
      // All failed or skipped
      toast.error(`${operation} failed for all items`);
    } else {
      // Mixed results
      let message = `${operation} completed: ${success.length} successful`;
      if (failed.length > 0) message += `, ${failed.length} failed`;
      if (skipped.length > 0) message += `, ${skipped.length} skipped`;
      
      toast.info(message);
    }

    // Show detailed error information if there are failures
    if (failed.length > 0) {
      console.error('Bulk operation failures:', failed);
    }
    
    // Show skip information
    if (skipped.length > 0) {
      console.info('Bulk operation skipped items:', skipped);
    }
  }

  /**
   * Get supported operations for a set of items
   */
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