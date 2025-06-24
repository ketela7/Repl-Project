'use client'

import { Suspense } from 'react'
import { lazy } from 'react'

// Lazy load all dialog components to reduce initial bundle size
const FileUploadDialog = lazy(() => import('./file-upload-dialog').then(m => ({ default: m.FileUploadDialog })))
const CreateFolderDialog = lazy(() => import('./create-folder-dialog').then(m => ({ default: m.CreateFolderDialog })))
const FileRenameDialog = lazy(() => import('./file-rename-dialog').then(m => ({ default: m.FileRenameDialog })))
const FileMoveDialog = lazy(() => import('./file-move-dialog').then(m => ({ default: m.FileMoveDialog })))
const FileCopyDialog = lazy(() => import('./file-copy-dialog').then(m => ({ default: m.FileCopyDialog })))
const PermanentDeleteDialog = lazy(() => import('./permanent-delete-dialog').then(m => ({ default: m.PermanentDeleteDialog })))
const FileDetailsDialog = lazy(() => import('./file-details-dialog').then(m => ({ default: m.FileDetailsDialog })))
const FilePreviewDialog = lazy(() => import('./file-preview-dialog').then(m => ({ default: m.FilePreviewDialog })))
const BulkDeleteDialog = lazy(() => import('./bulk-delete-dialog').then(m => ({ default: m.BulkDeleteDialog })))
const BulkMoveDialog = lazy(() => import('./bulk-move-dialog').then(m => ({ default: m.BulkMoveDialog })))
const BulkCopyDialog = lazy(() => import('./bulk-copy-dialog').then(m => ({ default: m.BulkCopyDialog })))
const FileShareDialog = lazy(() => import('./file-share-dialog').then(m => ({ default: m.FileShareDialog })))
const BulkShareDialog = lazy(() => import('./bulk-share-dialog').then(m => ({ default: m.BulkShareDialog })))

interface DriveDialogsProps {
  dialogs: Record<string, boolean>
  onClose: (dialog: string) => void
  selectedItems: any[]
  currentFolder: any
  onFileRenamed?: (oldName: string, newName: string) => void
  onFileCopied?: (fileName: string, targetFolderId: string) => void
  onFileMoved?: (fileId: string, targetFolderId: string) => void
  onFileUploaded?: () => void
  onFolderCreated?: () => void
  onItemDeleted?: () => void
  fileToPreview?: any
  fileToRename?: any
  fileToMove?: any
  fileToCopy?: any
  fileToDelete?: any
  fileToShare?: any
  fileToShowDetails?: any
}

export function DriveDialogs({
  dialogs,
  onClose,
  selectedItems,
  currentFolder,
  onFileRenamed,
  onFileCopied,
  onFileMoved,
  onFileUploaded,
  onFolderCreated,
  onItemDeleted,
  fileToPreview,
  fileToRename,
  fileToMove,
  fileToCopy,
  fileToDelete,
  fileToShare,
  fileToShowDetails
}: DriveDialogsProps) {
  return (
    <Suspense fallback={null}>
      {/* Upload Dialog */}
      {dialogs.upload && (
        <FileUploadDialog
          open={dialogs.upload}
          onOpenChange={() => onClose('upload')}
          currentFolderId={currentFolder?.id}
          onFileUploaded={onFileUploaded}
        />
      )}

      {/* Create Folder Dialog */}
      {dialogs.createFolder && (
        <CreateFolderDialog
          open={dialogs.createFolder}
          onOpenChange={() => onClose('createFolder')}
          parentFolderId={currentFolder?.id}
          onFolderCreated={onFolderCreated}
        />
      )}

      {/* File Rename Dialog */}
      {dialogs.rename && fileToRename && (
        <FileRenameDialog
          open={dialogs.rename}
          onOpenChange={() => onClose('rename')}
          fileId={fileToRename.id}
          fileName={fileToRename.name}
          onFileRenamed={onFileRenamed}
        />
      )}

      {/* File Move Dialog */}
      {dialogs.move && fileToMove && (
        <FileMoveDialog
          open={dialogs.move}
          onOpenChange={() => onClose('move')}
          fileId={fileToMove.id}
          fileName={fileToMove.name}
          onFileMoved={onFileMoved}
        />
      )}

      {/* File Copy Dialog */}
      {dialogs.copy && fileToCopy && (
        <FileCopyDialog
          open={dialogs.copy}
          onOpenChange={() => onClose('copy')}
          fileId={fileToCopy.id}
          fileName={fileToCopy.name}
          onCopy={onFileCopied}
        />
      )}

      {/* File Share Dialog */}
      {dialogs.share && fileToShare && (
        <FileShareDialog
          open={dialogs.share}
          onOpenChange={() => onClose('share')}
          fileId={fileToShare.id}
          fileName={fileToShare.name}
        />
      )}

      {/* File Details Dialog */}
      {dialogs.details && fileToShowDetails && (
        <FileDetailsDialog
          open={dialogs.details}
          onOpenChange={() => onClose('details')}
          fileId={fileToShowDetails.id}
        />
      )}

      {/* File Preview Dialog */}
      {dialogs.preview && fileToPreview && (
        <FilePreviewDialog
          open={dialogs.preview}
          onOpenChange={() => onClose('preview')}
          fileId={fileToPreview.id}
          fileName={fileToPreview.name}
          mimeType={fileToPreview.mimeType}
        />
      )}

      {/* Permanent Delete Dialog */}
      {dialogs.permanentDelete && fileToDelete && (
        <PermanentDeleteDialog
          open={dialogs.permanentDelete}
          onOpenChange={() => onClose('permanentDelete')}
          item={fileToDelete}
          onItemDeleted={onItemDeleted}
        />
      )}

      {/* Bulk Operations */}
      {dialogs.bulkDelete && selectedItems.length > 0 && (
        <BulkDeleteDialog
          open={dialogs.bulkDelete}
          onOpenChange={() => onClose('bulkDelete')}
          selectedItems={selectedItems}
          onItemsDeleted={onItemDeleted}
        />
      )}

      {dialogs.bulkMove && selectedItems.length > 0 && (
        <BulkMoveDialog
          open={dialogs.bulkMove}
          onOpenChange={() => onClose('bulkMove')}
          selectedItems={selectedItems}
          onItemsMoved={onItemDeleted}
        />
      )}

      {dialogs.bulkCopy && selectedItems.length > 0 && (
        <BulkCopyDialog
          open={dialogs.bulkCopy}
          onOpenChange={() => onClose('bulkCopy')}
          selectedItems={selectedItems}
          onItemsCopied={onItemDeleted}
        />
      )}

      {dialogs.bulkShare && selectedItems.length > 0 && (
        <BulkShareDialog
          open={dialogs.bulkShare}
          onOpenChange={() => onClose('bulkShare')}
          selectedItems={selectedItems}
        />
      )}
    </Suspense>
  )
}