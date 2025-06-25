/**
 * Optimized lazy loading for bulk operations dialogs
 * Reduces compilation time and improves loading performance
 */
import { lazy, ComponentType } from 'react'

// Create optimized lazy loader with error boundaries
const createLazyDialog = (
  importFn: () => Promise<any>,
  componentName: string
) => {
  return lazy(async () => {
    try {
      const module = await importFn()
      return { default: module[componentName] }
    } catch (error) {
      console.warn(`Failed to load ${componentName}:`, error)
      // Return null component as fallback
      const NullComponent = () => null
      return { default: NullComponent }
    }
  })
}

// Optimized bulk dialog exports
export const BulkMoveDialog = createLazyDialog(
  () => import('./bulk-move-dialog'),
  'BulkMoveDialog'
)

export const BulkCopyDialog = createLazyDialog(
  () => import('./bulk-copy-dialog'),
  'BulkCopyDialog'
)

export const BulkDeleteDialog = createLazyDialog(
  () => import('./bulk-delete-dialog'),
  'BulkDeleteDialog'
)

export const BulkShareDialog = createLazyDialog(
  () => import('./bulk-share-dialog'),
  'BulkShareDialog'
)

export const BulkRenameDialog = createLazyDialog(
  () => import('./bulk-rename-dialog'),
  'BulkRenameDialog'
)

export const BulkOperationsDialogMobile = createLazyDialog(
  () => import('./bulk-operations-dialog-mobile'),
  'BulkOperationsDialogMobile'
)

export const BulkOperationsDialogDekstop = createLazyDialog(
  () => import('./bulk-operations-dialog-dekstop'),
  'BulkOperationsDialogDekstop'
)

export const BulkOperationsDialog = createLazyDialog(
  () => import('./bulk-operations-dialog'),
  'BulkOperationsDialog'
)