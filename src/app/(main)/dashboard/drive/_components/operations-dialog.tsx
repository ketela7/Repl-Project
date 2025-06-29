'use client'

import { Trash2, Download, Share2, RotateCcw, Copy, Edit, FolderOpen } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetDescription } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { successToast, errorToast } from '@/lib/toast'
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
  onDelete?: () => void
  onDownload?: () => void
  onShare?: () => void
  onMove?: () => void
  onCopy?: () => void
  onRename?: () => void
  onRefreshAfterOp?: () => void
}

function OperationsDialog({ isOpen, open, onClose, onOpenChange, selectedItems, onRefreshAfterOp }: OperationsDialogProps) {
  const isMobile = useIsMobile()
  const folderCount = selectedItems.filter((item) => item.isFolder).length
  const fileCount = selectedItems.length - folderCount
  const canDeleteCount = selectedItems.filter((item) => item.canDelete).length
  const canShareCount = selectedItems.filter((item) => item.canShare).length
  const canTrashCount = selectedItems.filter((item) => item.canTrash).length
  const canUntrashCount = selectedItems.filter((item) => item.canUntrash).length
  const canDownloadCount = selectedItems.filter((item) => item.canDownload).length
  const canRenameCount = selectedItems.filter((item) => item.canRename).length
  const canExportCount = selectedItems.filter((item) => item.canExport).length
  const canMoveCount = selectedItems.filter((item) => item.canMove).length
  const canCopyCount = selectedItems.filter((item) => item.canCopy).length

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

  // Individual dialog handlers
  const handleMoveClick = () => {
    setIsMoveDialogOpen(true)
    handleClose()
  }

  const handleCopyClick = () => {
    setIsCopyDialogOpen(true)
    handleClose()
  }

  const handleTrashClick = () => {
    setIsTrashDialogOpen(true)
    handleClose()
  }

  const handleShareClick = () => {
    setIsShareDialogOpen(true)
    handleClose()
  }

  const handleRenameClick = () => {
    setIsRenameDialogOpen(true)
    handleClose()
  }

  const handleExportClick = () => {
    setIsExportDialogOpen(true)
    handleClose()
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
    handleClose()
  }

  const handleUntrashClick = () => {
    setIsUntrashDialogOpen(true)
    handleClose()
  }

  const handleDownloadClick = () => {
    setIsDownloadDialogOpen(true)
    handleClose()
  }

  // Bulk operation completion handlers with actual API calls
  const handleMoveComplete = async () => {
    setIsMoveDialogOpen(false)
    setTimeout(() => {
      console.log('Refreshing after move operation')
      onRefreshAfterOp?.()
    }, 500)
  }

  const handleCopyComplete = async () => {
    // Copy operation is now handled inside the Copy dialog
    // This function just needs to close the dialog and refresh
    setIsCopyDialogOpen(false)
    setTimeout(() => {
      console.log('Refreshing after copy operation')
      onRefreshAfterOp?.()
    }, 500)
  }

  const handleTrashComplete = async () => {
    try {
      const response = await fetch('/api/drive/files/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
        }),
      })

      if (response.ok) {
        const result = await response.json()
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsTrashDialogOpen(false)
      setTimeout(() => {
        console.log('Refreshing after trash operation')
        onRefreshAfterOp?.()
      }, 500)
    }
  }

  const handleShareComplete = async () => {
    // Share operation is now handled inside the Share dialog
    // This function just needs to close the dialog and refresh
    setIsShareDialogOpen(false)
    setTimeout(() => {
      console.log('Refreshing after share operation')
      onRefreshAfterOp?.()
    }, 500)
  }

  const handleRenameComplete = async () => {
    setIsRenameDialogOpen(false)
    setTimeout(() => {
      console.log('Refreshing after rename operation')
      onRefreshAfterOp?.()
    }, 500)
  }

  const handleExportComplete = async () => {
    // Export operation is now handled inside the Export dialog
    // This function just needs to close the dialog and refresh
    setIsExportDialogOpen(false)
    setTimeout(() => {
      console.log('Refreshing after export operation')
      onRefreshAfterOp?.()
    }, 500)
  }

  const handleDeleteComplete = async () => {
    try {
      const response = await fetch('/api/drive/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
        }),
      })

      if (response.ok) {
        const result = await response.json()
      }
    } catch (error) {
      console.error('delete failed:', error)
    } finally {
      setIsDeleteDialogOpen(false)
      setTimeout(() => {
        console.log('Refreshing after delete operation')
        onRefreshAfterOp?.()
      }, 500)
    }
  }

  const handleUntrashComplete = async () => {
    try {
      const response = await fetch('/api/drive/files/untrash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
        }),
      })

      if (response.ok) {
        const result = await response.json()
      }
    } catch (error) {
      console.error('Restore failed:', error)
    } finally {
      setIsUntrashDialogOpen(false)
      setTimeout(() => {
        console.log('Refreshing after untrash operation')
        onRefreshAfterOp?.()
      }, 500)
    }
  }

  const handleDownloadComplete = async () => {
    setIsDownloadDialogOpen(false)
    setTimeout(() => {
      console.log('Refreshing after download operation')
      onRefreshAfterOp?.()
    }, 500)
  }

  const renderContent = () => (
    <>
      <div className="grid gap-3">
        {/* Move Items */}
        {canMoveCount > 0 && (
          <Button variant="outline" onClick={handleMoveClick} className="h-12 w-full justify-start gap-3 text-left hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Move Items</span>
              <span className="text-muted-foreground text-xs">Move items to another location</span>
            </div>
          </Button>
        )}

        {/* Copy Items */}
        {canCopyCount > 0 && (
          <Button variant="outline" onClick={handleCopyClick} className="h-12 w-full justify-start gap-3 text-left hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
              <Copy className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Copy Items</span>
              <span className="text-muted-foreground text-xs">Create copies in another location</span>
            </div>
          </Button>
        )}

        {/* Share Items */}
        {canShareCount > 0 && (
          <Button variant="outline" onClick={handleShareClick} className="h-12 w-full justify-start gap-3 text-left hover:border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <Share2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Share Items</span>
              <span className="text-muted-foreground text-xs">Generate {canShareCount} shareable links</span>
            </div>
          </Button>
        )}

        {/* Rename */}
        {canRenameCount > 0 && (
          <Button variant="outline" onClick={handleRenameClick} className="h-12 w-full justify-start gap-3 text-left hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
              <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Rename</span>
              <span className="text-muted-foreground text-xs">Rename {canRenameCount} items with patterns</span>
            </div>
          </Button>
        )}

        {/* Download Files */}
        {canDownloadCount > 0 && (
          <Button variant="outline" onClick={handleDownloadClick} className="h-12 w-full justify-start gap-3 text-left hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Download Files</span>
              <span className="text-muted-foreground text-xs">
                Download {fileCount} file{fileCount > 1 ? 's' : ''} directly
              </span>
            </div>
          </Button>
        )}

        {/* Export Files */}
        {canExportCount > 0 && (
          <Button variant="outline" onClick={handleExportClick} className="h-12 w-full justify-start gap-3 text-left hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Export Files</span>
              <span className="text-muted-foreground text-xs">
                Export {fileCount} file{fileCount > 1 ? 's' : ''} in various formats
              </span>
            </div>
          </Button>
        )}

        {/* Restore from Trash */}
        {canUntrashCount > 0 && (
          <Button variant="outline" onClick={handleUntrashClick} className="h-12 w-full justify-start gap-3 text-left hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Untrash</span>
              <span className="text-muted-foreground text-xs">Restore {canUntrashCount} items to original location</span>
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
                <Button variant="outline" onClick={handleTrashClick} className="mb-3 h-12 w-full justify-start gap-3 text-left hover:border-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-950/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                    <Trash2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Move to Trash</span>
                    <span className="text-muted-foreground text-xs">Move {canTrashCount} items to trash (can be restored)</span>
                  </div>
                </Button>
              )}

              {/* Permanent Delete */}
              {canDeleteCount > 0 && (
                <Button variant="outline" onClick={handleDeleteClick} className="mb-3 h-12 w-full justify-start gap-3 text-left hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Delete</span>
                    <span className="text-muted-foreground text-xs">Delete permanently {canDeleteCount} items (cannot be undone)</span>
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
        <BottomSheet open={dialogOpen} onOpenChange={onOpenChange || onClose}>
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
        <Dialog open={dialogOpen} onOpenChange={onOpenChange || onClose}>
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

      {/* Individual Items Operation Dialogs - Direct rendering tanpa Suspense */}
      <ItemsMoveDialog isOpen={isMoveDialogOpen} onClose={() => setIsMoveDialogOpen(false)} onConfirm={handleMoveComplete} selectedItems={selectedItems} />

      <ItemsCopyDialog isOpen={isCopyDialogOpen} onClose={() => setIsCopyDialogOpen(false)} onConfirm={handleCopyComplete} selectedItems={selectedItems} />

      <ItemsTrashDialog isOpen={isTrashDialogOpen} onClose={() => setIsTrashDialogOpen(false)} onConfirm={handleDeleteComplete} selectedItems={selectedItems} />

      <ItemsShareDialog isOpen={isShareDialogOpen} onClose={() => setIsShareDialogOpen(false)} onConfirm={handleShareComplete} selectedItems={selectedItems} />

      <ItemsRenameDialog isOpen={isRenameDialogOpen} onClose={() => setIsRenameDialogOpen(false)} onConfirm={handleRenameComplete} selectedItems={selectedItems} />

      <ItemsExportDialog isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} onConfirm={handleExportComplete} selectedItems={selectedItems} />

      <ItemsDownloadDialog isOpen={isDownloadDialogOpen} onClose={handleDownloadComplete} onConfirm={handleDownloadComplete} selectedItems={selectedItems} />

      <ItemsDeleteDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={handleDeleteComplete} selectedItems={selectedItems} />

      <ItemsUntrashDialog isOpen={isUntrashDialogOpen} onClose={() => setIsUntrashDialogOpen(false)} onConfirm={handleUntrashComplete} selectedItems={selectedItems} />
    </>
  )
}

export { OperationsDialog }
export default OperationsDialog
