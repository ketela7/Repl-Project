/**
 * Lazy imports for heavy components to reduce initial bundle size
 */
import { lazy } from 'react'

// Lazy load heavy dashboard components
export const DriveManager = lazy(() =>
  import('@/app/(main)/dashboard/drive/_components/drive-manager').then(
    (mod) => ({ default: mod.DriveManager })
  )
)

export const DataTable = lazy(() =>
  import('@/components/data-table/data-table').then((mod) => ({
    default: mod.DataTable,
  }))
)

// Remaining dialog components are handled by bulk operations

// Operations dialogs - now in optimized lazy module
export const OperationsDialog = lazy(() =>
  import('@/app/(main)/dashboard/drive/_components/operations-dialog').then(
    (mod) => ({ default: mod.OperationsDialog })
  )
)

export const ItemsMoveDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-move-dialog')
)

export const ItemsCopyDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-copy-dialog')
)

export const ItemsDeleteDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-delete-dialog')
)

export const ItemsTrashDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-trash-dialog')
)

export const ItemsShareDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-share-dialog')
)

export const ItemsRenameDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-rename-dialog')
)

export const ItemsExportDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-export-dialog')
)

export const ItemsUntrashDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-untrash-dialog')
)

export const DriveToolbar = lazy(() =>
  import('@/app/(main)/dashboard/drive/_components/drive-toolbar').then(
    (mod) => ({ default: mod.DriveToolbar })
  )
)

// Lazy load chart components (heavy recharts dependency)
export const ChartComponents = lazy(() =>
  import('recharts').then((mod) => ({
    default: () => null as any, // Placeholder for chart components
  }))
)
