'use client'

import {
  Trash2,
  Download,
  Share2,
  RotateCcw,
  Copy,
  Edit,
  FolderOpen,
} from 'lucide-react'
import { useState } from 'react'

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

function OperationsDialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  selectedItems,
  onRefreshAfterOp,
}: OperationsDialogProps) {
  const isMobile = useIsMobile()
  const folderCount = selectedItems.filter((item) => item.isFolder).length
  const fileCount = selectedItems.length - folderCount
  const canDeleteCount = selectedItems.filter((item) => item.canDelete).length
  const canShareCount = selectedItems.filter((item) => item.canShare).length
  const canTrashCount = selectedItems.filter((item) => item.canTrash).length
  const canUntrashCount = selectedItems.filter((item) => item.canUntrash).length
  const canDownloadCount = selectedItems.filter(
    (item) => item.canDownload
  ).length
  const canRenameCount = selectedItems.filter((item) => item.canRename).length

  // Individual dialog states
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)
  const [isTrashDialogOpen, setIsTrashDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)

  // Determine dialog open state
  const dialogOpen = open ?? isOpen ?? false
  const handleClose = onOpenChange
    ? () => onOpenChange(false)
    : onClose || (() => {})

  // Individual dialog handlers
  const handleMoveClick = () => {
    setIsMoveDialogOpen(true)
    handleClose()
  }

  const handleCopyClick = () => {
    setIsCopyDialogOpen(true)
    handleClose()
  }

  const handleDeleteClick = () => {
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

  const handlePermanentDeleteClick = () => {
    setIsDeleteDialogOpen(true)
    handleClose()
  }

  const handleRestoreClick = () => {
    setIsRestoreDialogOpen(true)
    handleClose()
  }

  const handleDownloadClick = () => {
    handleExportClick()
  }

  // Bulk operation completion handlers with actual API calls
  const handleMoveComplete = async (targetFolderId: string) => {
    try {
      const response = await fetch('/api/drive/files/bulk/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedItems.map((item) => item.id),
          targetFolderId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Move completed:', result.summary)
      }
    } catch (error) {
      console.error('Move failed:', error)
    }
    setIsMoveDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleCopyComplete = async (targetFolderId: string) => {
    try {
      const response = await fetch('/api/drive/files/bulk/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedItems
            .filter((item) => !item.isFolder)
            .map((item) => item.id),
          targetFolderId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Copy completed:', result.summary)
      }
    } catch (error) {
      console.error('Copy failed:', error)
    }
    setIsCopyDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleDeleteComplete = async () => {
    try {
      const response = await fetch('/api/drive/files/bulk/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedItems.map((item) => item.id),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Delete completed:', result.summary)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
    setIsTrashDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleShareComplete = async (shareOptions: any) => {
    try {
      const response = await fetch('/api/drive/files/bulk/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedItems.map((item) => item.id),
          ...shareOptions,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Share completed:', result.summary)
        return result.results
      }
      return []
    } catch (error) {
      console.error('Share failed:', error)
      return []
    } finally {
      setIsShareDialogOpen(false)
      onRefreshAfterOp?.()
    }
  }

  const handleRenameComplete = async (namePrefix: string, newName?: string) => {
    try {
      const response = await fetch('/api/drive/files/bulk/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedItems.map((item) => item.id),
          namePrefix,
          newName,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Rename completed:', result.summary)
      }
    } catch (error) {
      console.error('Rename failed:', error)
    }
    setIsRenameDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleExportComplete = async () => {
    try {
      for (const item of selectedItems.filter((item) => !item.isFolder)) {
        const link = document.createElement('a')
        link.href = `/api/drive/download/${item.id}`
        link.download = item.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
    setIsExportDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handlePermanentDeleteComplete = async () => {
    try {
      const response = await fetch('/api/drive/files/bulk/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedItems.map((item) => item.id),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Permanent delete completed:', result.summary)
      }
    } catch (error) {
      console.error('Permanent delete failed:', error)
    }
    setIsDeleteDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleRestoreComplete = async () => {
    try {
      const response = await fetch('/api/drive/files/bulk/untrash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedItems.map((item) => item.id),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Restore completed:', result.summary)
      }
    } catch (error) {
      console.error('Restore failed:', error)
    }
    setIsRestoreDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const renderContent = () => (
    <>
      <div className="grid gap-3">
        {/* Move Items */}
        <Button
          variant="outline"
          onClick={handleMoveClick}
          className="h-12 w-full justify-start gap-3 text-left hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium">Move Items</span>
            <span className="text-muted-foreground text-xs">
              Move items to another location
            </span>
          </div>
        </Button>

        {/* Copy Items */}
        <Button
          variant="outline"
          onClick={handleCopyClick}
          className="h-12 w-full justify-start gap-3 text-left hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
            <Copy className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium">Copy Items</span>
            <span className="text-muted-foreground text-xs">
              Create copies in another location
            </span>
          </div>
        </Button>

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
              <span className="font-medium">Share Items</span>
              <span className="text-muted-foreground text-xs">
                Generate {canShareCount} shareable links
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
                Rename {canRenameCount} items with patterns
              </span>
            </div>
          </Button>
        )}

        {fileCount > 0 && (
          <Button
            variant="outline"
            onClick={handleExportClick}
            className="h-12 w-full justify-start gap-3 text-left hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Export Files</span>
              <span className="text-muted-foreground text-xs">
                Export {fileCount} file{fileCount > 1 ? 's' : ''} in various
                formats
              </span>
            </div>
          </Button>
        )}

        {/* Separator for destructive actions */}
        {canDeleteCount > 0 ||
          canTrashCount > 0 ||
          (canUntrashCount > 0 && (
            <div className="mt-3 border-t pt-3">
              <p className="text-muted-foreground mb-3 text-xs font-medium">
                Destructive Actions
              </p>

              {/* Move to Trash */}
              {canTrashCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="mb-3 h-12 w-full justify-start gap-3 text-left hover:border-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                    <Trash2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Move to Trash</span>
                    <span className="text-muted-foreground text-xs">
                      Move {canTrashCount} items to trash (can be restored)
                    </span>
                  </div>
                </Button>
              )}

              {/* Permanent Delete */}
              {canDeleteCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePermanentDeleteClick}
                  className="mb-3 h-12 w-full justify-start gap-3 text-left hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Permanent Delete</span>
                    <span className="text-muted-foreground text-xs">
                      Delete permanently {canDeleteCount} items (cannot be
                      undone)
                    </span>
                  </div>
                </Button>
              )}

              {/* Restore from Trash */}
              {canUntrashCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleRestoreClick}
                  className="h-12 w-full justify-start gap-3 text-left hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                    <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Restore from Trash</span>
                    <span className="text-muted-foreground text-xs">
                      Restore {canUntrashCount} items to original location
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
        <BottomSheet open={dialogOpen} onOpenChange={onOpenChange || onClose}>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle className="text-lg font-semibold">
                Operations
              </BottomSheetTitle>
              <BottomSheetDescription className="text-muted-foreground text-sm">
                Choose an action for {selectedItems.length} selected item
                {selectedItems.length > 1 ? 's' : ''} ({fileCount} file
                {fileCount !== 1 ? 's' : ''}, {folderCount} folder
                {folderCount !== 1 ? 's' : ''})
              </BottomSheetDescription>
            </BottomSheetHeader>
            <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">
              {renderContent()}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={onOpenChange || onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Operations
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Choose an action for {selectedItems.length} selected item
                {selectedItems.length > 1 ? 's' : ''} ({fileCount} file
                {fileCount !== 1 ? 's' : ''}, {folderCount} folder
                {folderCount !== 1 ? 's' : ''})
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {renderContent()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Individual Items Operation Dialogs - Direct rendering tanpa Suspense */}
      <ItemsMoveDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        onConfirm={handleMoveComplete}
        selectedItems={selectedItems}
      />

      <ItemsCopyDialog
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        onConfirm={handleCopyComplete}
        selectedItems={selectedItems}
      />

      <ItemsTrashDialog
        isOpen={isTrashDialogOpen}
        onClose={() => setIsTrashDialogOpen(false)}
        onConfirm={handleDeleteComplete}
        selectedItems={selectedItems}
      />

      <ItemsShareDialog
        open={isShareDialogOpen}
        onOpenChange={() => setIsShareDialogOpen(false)}
        onConfirm={handleShareComplete}
        selectedItems={selectedItems}
      />

      <ItemsRenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        onConfirm={handleRenameComplete}
        selectedItems={selectedItems}
      />

      <ItemsExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={handleExportComplete}
        selectedItems={selectedItems}
      />

      <ItemsDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handlePermanentDeleteComplete}
        selectedItems={selectedItems}
      />

      <ItemsUntrashDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleRestoreComplete}
        selectedItems={selectedItems}
      />
    </>
  )
}

export { OperationsDialog }
export default OperationsDialog
