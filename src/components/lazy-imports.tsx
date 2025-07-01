/**
 * Lazy imports for heavy components to reduce initial bundle size
 */
import { lazy } from 'react'

// Lazy load heavy dashboard components
export const DriveManager = lazy(() => import('@/app/(main)/dashboard/drive/_components/drive-manager'))

// Remaining dialog components are handled by bulk operations

// Operations dialogs - now in optimized lazy module
export const OperationsDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/operations-dialog'))

export const ItemsMoveDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-move-dialog'))

export const ItemsCopyDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-copy-dialog'))

export const ItemsDeleteDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-delete-dialog'))

export const ItemsTrashDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-trash-dialog'))

export const ItemsShareDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-share-dialog'))

export const ItemsRenameDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-rename-dialog'))

export const ItemsExportDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-export-dialog'))

export const ItemsDownloadDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-download-dialog'))

export const ItemsUntrashDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/items-untrash-dialog'))

export const DriveToolbar = lazy(() => import('@/app/(main)/dashboard/drive/_components/drive-toolbar'))

// Additional heavy components that need lazy loading
export const CreateFolderDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/create-folder-dialog'))

export const DriveConnectionCard = lazy(() => import('@/app/(main)/dashboard/drive/_components/drive-connection-card'))

export const DriveDataView = lazy(() => import('@/app/(main)/dashboard/drive/_components/drive-data-view'))

export const DriveSkeleton = lazy(() => import('@/app/(main)/dashboard/drive/_components/drive-skeleton'))

export const FileBreadcrumb = lazy(() => import('@/app/(main)/dashboard/drive/_components/file-breadcrumb'))

export const FileDetailsDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/file-details-dialog'))

export const FilePreviewDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/file-preview-dialog'))

export const FileUploadDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/file-upload-dialog'))

export const FiltersDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/filters-dialog'))

export const RegexHelpDialog = lazy(() => import('@/app/(main)/dashboard/drive/_components/regex-help-dialog'))
