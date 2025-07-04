'use client'

import { Trash2, Download, Share2, RotateCcw, Copy, Edit, FolderOpen } from 'lucide-react'
import { useState, Suspense } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  ItemsMoveDialog,
  ItemsCopyDialog,
  ItemsTrashDialog,
  ItemsShareDialog,
  ItemsRenameDialog,
  ItemsExportDialog,
  ItemsDeleteDialog,
  ItemsUntrashDialog,
  ItemsDownloadDialog,
} from '@/components/lazy-imports'

interface OperationsDialogProps {
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  selectedItems: any[]
}

function OperationsDialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  selectedItems,
}: OperationsDialogProps) {
  const isMobile = useIsMobile()
  const folderCount = selectedItems.filter(item => item.isFolder).length
  const fileCount = selectedItems.length - folderCount
  const canDeleteCount = selectedItems.filter(item => item.canDelete).length
  const canShareCount = selectedItems.filter(item => item.canShare).length
  const canTrashCount = selectedItems.filter(item => item.canTrash).length
  const canUntrashCount = selectedItems.filter(item => item.canUntrash).length
  const canDownloadCount = selectedItems.filter(item => item.canDownload).length
  const canRenameCount = selectedItems.filter(item => item.canRename).length
  const canExportCount = selectedItems.filter(item => item.canExport).length
  const canMoveCount = selectedItems.filter(item => item.canMove).length
  const canCopyCount = selectedItems.filter(item => item.canCopy).length

  // Individual dialog states
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)
  const [isTrashDialogOpen, setIsTrashDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUntrashDialogOpen, setIsUntrashDialogOpen] = useState(false)

  // Determine dialog open state
  const dialogOpen = open ?? isOpen ?? false
  const handleClose = onOpenChange ? () => onOpenChange(false) : onClose || (() => {})

  // Individual dialog handlers - Fixed timing issue
  const handleMoveClick = () => {
    console.log('Move button clicked, closing main dialog and opening move dialog')
    handleClose()
    // Use setTimeout to ensure main dialog closes before individual dialog opens
    setTimeout(() => {
      console.log('Setting move dialog open to true')
      setIsMoveDialogOpen(true)
    }, 100)
  }

  const handleCopyClick = () => {
    console.log('Copy button clicked, closing main dialog and opening copy dialog')
    handleClose()
    setTimeout(() => {
      console.log('Setting copy dialog open to true')
      setIsCopyDialogOpen(true)
    }, 100)
  }

  const handleTrashClick = () => {
    console.log('Trash button clicked, closing main dialog and opening trash dialog')
    handleClose()
    setTimeout(() => {
      console.log('Setting trash dialog open to true')
      setIsTrashDialogOpen(true)
    }, 100)
  }

  const handleShareClick = () => {
    handleClose()
    setTimeout(() => {
      setIsShareDialogOpen(true)
    }, 100)
  }

  const handleRenameClick = () => {
    handleClose()
    setTimeout(() => {
      setIsRenameDialogOpen(true)
    }, 100)
  }

  const handleExportClick = () => {
    handleClose()
    setTimeout(() => {
      setIsExportDialogOpen(true)
    }, 100)
  }

  const handleDeleteClick = () => {
    handleClose()
    setTimeout(() => {
      setIsDeleteDialogOpen(true)
    }, 100)
  }

  const handleUntrashClick = () => {
    handleClose()
    setTimeout(() => {
      setIsUntrashDialogOpen(true)
    }, 100)
  }

  const handleDownloadClick = () => {
    handleClose()
    setTimeout(() => {
      setIsDownloadDialogOpen(true)
    }, 100)
  }

  // Standardized close handlers
  const handleMoveClose = () => {
    setIsMoveDialogOpen(false)
  }

  const handleCopyClose = () => {
    setIsCopyDialogOpen(false)
  }

  const handleTrashClose = () => {
    setIsTrashDialogOpen(false)
  }

  const handleShareClose = () => {
    setIsShareDialogOpen(false)
  }

  const handleRenameClose = () => {
    setIsRenameDialogOpen(false)
  }

  const handleExportClose = () => {
    setIsExportDialogOpen(false)
  }

  const handleDeleteClose = () => {
    setIsDeleteDialogOpen(false)
  }

  const handleUntrashClose = () => {
    setIsUntrashDialogOpen(false)
  }

  const handleDownloadClose = () => {
    setIsDownloadDialogOpen(false)
  }

  // Standardized completion handlers - no automatic refresh since dialogs handle their own refresh
  const handleMoveComplete = () => {
    setIsMoveDialogOpen(false)
  }

  const handleCopyComplete = () => {
    setIsCopyDialogOpen(false)
  }

  const handleTrashComplete = () => {
    setIsTrashDialogOpen(false)
  }

  const handleRenameComplete = () => {
    setIsRenameDialogOpen(false)
  }

  const handleExportComplete = () => {
    setIsExportDialogOpen(false)
  }

  const handleDeleteComplete = () => {
    setIsDeleteDialogOpen(false)
  }

  const handleUntrashComplete = () => {
    setIsUntrashDialogOpen(false)
  }

  const handleDownloadComplete = () => {
    setIsDownloadDialogOpen(false)
  }

  const renderContent = () => (
    <>
      <div className="grid gap-3">
        {/* Move Items */}
        {canMoveCount > 0 && (
          <Button
            variant="outline"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Move button clicked - direct handler')
              handleMoveClick()
            }}
            className="h-12 w-full justify-start gap-3 text-left hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Move</span>
              <span className="text-muted-foreground text-xs">
                Move {canMoveCount} item{canMoveCount > 1 ? 's' : ''} to another location
              </span>
            </div>
          </Button>
        )}

        {/* Copy Items */}
        {canCopyCount > 0 && (
          <Button
            variant="outline"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Copy button clicked - direct handler')
              handleCopyClick()
            }}
            className="h-12 w-full justify-start gap-3 text-left hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
              <Copy className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Copy</span>
              <span className="text-muted-foreground text-xs">
                Create {canCopyCount} cop{canCopyCount > 1 ? 'ies' : 'y'} in another location
              </span>
            </div>
          </Button>
        )}

        {/* Share Items */}
        {canShareCount > 0 && (
          <Button
            variant="outline"
            onClick={handleShareClick}
            className="h-12 w-full justify-start gap-3 text-left hover:border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <Share2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Share</span>
              <span className="text-muted-foreground text-xs">
                Generate {canShareCount} shareable link{canShareCount > 1 ? 's' : ''}
              </span>
            </div>
          </Button>
        )}

        {/* Rename */}
        {canRenameCount > 0 && (
          <Button
            variant="outline"
            onClick={handleRenameClick}
            className="h-12 w-full justify-start gap-3 text-left hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
              <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Rename</span>
              <span className="text-muted-foreground text-xs">
                Rename {canRenameCount} item{canRenameCount > 1 ? 's' : ''} with patterns
              </span>
            </div>
          </Button>
        )}

        {/* Download Files */}
        {canDownloadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleDownloadClick}
            className="h-12 w-full justify-start gap-3 text-left hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Download</span>
              <span className="text-muted-foreground text-xs">
                Download {canDownloadCount} file{canDownloadCount > 1 ? 's' : ''} directly
              </span>
            </div>
          </Button>
        )}

        {/* Export Files */}
        {canExportCount > 0 && (
          <Button
            variant="outline"
            onClick={handleExportClick}
            className="h-12 w-full justify-start gap-3 text-left hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Export</span>
              <span className="text-muted-foreground text-xs">
                Export {canExportCount} file{canExportCount > 1 ? 's' : ''} in various formats
              </span>
            </div>
          </Button>
        )}

        {/* Untrash Items */}
        {canUntrashCount > 0 && (
          <Button
            variant="outline"
            onClick={handleUntrashClick}
            className="h-12 w-full justify-start gap-3 text-left hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Untrash</span>
              <span className="text-muted-foreground text-xs">
                Untrash {canUntrashCount} items to original location
              </span>
            </div>
          </Button>
        )}

        {/* Separator for destructive actions */}
        {canDeleteCount > 0 ||
          (canTrashCount > 0 && (
            <div className="mt-3 border-t pt-3">
              <p className="text-muted-foreground mb-3 text-xs font-medium">Destructive Actions</p>

              {/* Move to Trash */}
              {canTrashCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleTrashClick}
                  className="mb-3 h-12 w-full justify-start gap-3 text-left hover:border-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                    <Trash2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Move to Trash</span>
                    <span className="text-muted-foreground text-xs">
                      Move {canTrashCount} items to trash (can be untrashed)
                    </span>
                  </div>
                </Button>
              )}

              {/* Delete Permanently */}
              {canDeleteCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="mb-3 h-12 w-full justify-start gap-3 text-left hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Delete</span>
                    <span className="text-muted-foreground text-xs">
                      Delete {canDeleteCount} items permanently (cannot be undone)
                    </span>
                  </div>
                </Button>
              )}
            </div>
          ))}
      </div>
    </>
  )

  return (
    <>
      {/* Main Operations Dialog */}
      {isMobile ? (
        <BottomSheet
          open={dialogOpen}
          {...((onOpenChange || onClose) && { onOpenChange: onOpenChange || onClose })}
        >
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle className="text-lg font-semibold">Operations</BottomSheetTitle>
              <BottomSheetDescription className="text-muted-foreground text-sm">
                Choose an action for {selectedItems.length} selected item
                {selectedItems.length > 1 ? 's' : ''} ({fileCount} file
                {fileCount !== 1 ? 's' : ''}, {folderCount} folder
                {folderCount !== 1 ? 's' : ''})
              </BottomSheetDescription>
            </BottomSheetHeader>
            <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">{renderContent()}</div>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog
          open={dialogOpen}
          {...((onOpenChange || onClose) && { onOpenChange: onOpenChange || onClose })}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Operations</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Choose an action for {selectedItems.length} selected item
                {selectedItems.length > 1 ? 's' : ''} ({fileCount} file
                {fileCount !== 1 ? 's' : ''}, {folderCount} folder
                {folderCount !== 1 ? 's' : ''})
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto py-2">{renderContent()}</div>
          </DialogContent>
        </Dialog>
      )}

      {/* Individual Items Operation Dialogs - With Suspense for Lazy Loading */}
      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsMoveDialog
          isOpen={isMoveDialogOpen}
          onClose={handleMoveClose}
          onConfirm={handleMoveComplete}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsCopyDialog
          isOpen={isCopyDialogOpen}
          onClose={handleCopyClose}
          onConfirm={handleCopyComplete}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsTrashDialog
          isOpen={isTrashDialogOpen}
          onClose={handleTrashClose}
          _onConfirm={handleTrashComplete}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsShareDialog
          isOpen={isShareDialogOpen}
          onClose={handleShareClose}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsRenameDialog
          isOpen={isRenameDialogOpen}
          onClose={handleRenameClose}
          onConfirm={handleRenameComplete}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsExportDialog
          isOpen={isExportDialogOpen}
          onClose={handleExportClose}
          onConfirm={handleExportComplete}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsDownloadDialog
          isOpen={isDownloadDialogOpen}
          onClose={handleDownloadClose}
          onConfirm={handleDownloadComplete}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteComplete}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsUntrashDialog
          isOpen={isUntrashDialogOpen}
          onClose={handleUntrashClose}
          _onConfirm={handleUntrashComplete}
          selectedItems={selectedItems}
        />
      </Suspense>
    </>
  )
}

export { OperationsDialog }
export default OperationsDialog
