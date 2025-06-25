/**
 * Optimized lazy loading for bulk operations dialogs
 * Reduces compilation time and improves loading performance
 */
import { lazy } from 'react'

// Optimized bulk dialog exports with direct lazy loading
export const BulkMoveDialog = lazy(() => 
  import('./bulk-move-dialog').then(mod => ({ default: mod.BulkMoveDialog }))
)

export const BulkCopyDialog = lazy(() => 
  import('./bulk-copy-dialog').then(mod => ({ default: mod.BulkCopyDialog }))
)

export const BulkDeleteDialog = lazy(() => 
  import('./bulk-delete-dialog').then(mod => ({ default: mod.BulkDeleteDialog }))
)

export const BulkShareDialog = lazy(() => 
  import('./bulk-share-dialog').then(mod => ({ default: mod.BulkShareDialog }))
)

export const BulkRenameDialog = lazy(() => 
  import('./bulk-rename-dialog').then(mod => ({ default: mod.BulkRenameDialog }))
)

export const BulkExportDialog = lazy(() => 
  import('./bulk-export-dialog').then(mod => ({ default: mod.BulkExportDialog }))
)

export const BulkPermanentDeleteDialog = lazy(() => 
  import('./bulk-permanent-delete-dialog').then(mod => ({ default: mod.BulkPermanentDeleteDialog }))
)

export const BulkRestoreDialog = lazy(() => 
  import('./bulk-restore-dialog').then(mod => ({ default: mod.BulkRestoreDialog }))
)

export const BulkOperationsDialog = lazy(() => 
  import('./bulk-operations-dialog').then(mod => ({ default: mod.BulkOperationsDialog }))
)

