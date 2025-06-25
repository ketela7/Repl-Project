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

export const BulkOperationsDialogMobile = lazy(() => 
  import('./bulk-operations-dialog-mobile').then(mod => ({ default: mod.BulkOperationsDialogMobile }))
)

export const BulkOperationsDialogDekstop = lazy(() => 
  import('./bulk-operations-dialog-dekstop').then(mod => ({ default: mod.BulkOperationsDialogDekstop }))
)

