/**
 * Optimized lazy imports for reduced bundle size and better caching
 * Groups related functionality for efficient code splitting
 */
import { lazy } from 'react'

// Core drive management (highest priority - load first)
export const DriveManager = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/drive-manager'),
)
export const DriveDataView = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/drive-data-view'),
)
export const DriveToolbar = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/drive-toolbar'),
)

// Drive UI components (medium priority - load when browsing)
export const DriveConnectionCard = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/drive-connection-card'),
)
export const BreadcrumbSkeleton = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/drive-skeleton').then(mod => ({
    default: mod.BreadcrumbSkeleton
  })),
)
export const FileBreadcrumb = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/file-breadcrumb'),
)

// File operations group (load together for related workflows)
export const ItemsMoveDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-move-dialog'),
)
export const ItemsCopyDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-copy-dialog'),
)
export const ItemsRenameDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-rename-dialog'),
)

// Bulk operations group (load together for management workflows)
export const ItemsDeleteDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-delete-dialog'),
)
export const ItemsTrashDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-trash-dialog'),
)
export const ItemsUntrashDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-untrash-dialog'),
)

// Sharing & export group (load together for collaboration workflows)
export const ItemsShareDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-share-dialog'),
)
export const ItemsExportDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-export-dialog'),
)
export const ItemsDownloadDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/items-download-dialog'),
)

// Advanced operations (lower priority - load when needed)
export const OperationsDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/operations-dialog'),
)
export const CreateFolderDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/create-folder-dialog'),
)

// File interaction dialogs (load on demand)
export const FileDetailsDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/file-details-dialog'),
)
export const FilePreviewDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/file-preview-dialog'),
)
export const FileUploadDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/file-upload-dialog'),
)

// Utility dialogs (load when accessed)
export const FiltersDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/filters-dialog'),
)
export const RegexHelpDialog = lazy(
  () => import('@/app/(main)/dashboard/drive/_components/regex-help-dialog'),
)
