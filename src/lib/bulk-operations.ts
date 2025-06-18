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
   * Show completion toast with detailed results
   */
  private showCompletionToast(operation: string, result: BulkOperationResult): void {
    const { success, failed, skipped, total } = result;
    const operationName = operation.replace('bulk_', '').replace('_', ' ');
    
    if (failed.length === 0 && skipped.length === 0) {
      // All successful
      toast.success(`✅ ${operationName} completed successfully for all ${total} items`);
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
      
      toast.info(`${operationName} completed: ${parts.join(', ')}`);
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