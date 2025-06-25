'use client'

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
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  Trash2,
  Download,
  Share,
  Share2,
  RotateCcw,
  Folder,
  File,
  FileText,
  FilePlus,
  Move,
  Copy,
  Edit,
  FolderOpen,
  FileDown,
  FileOutput,
} from 'lucide-react'
import { cn } from '@/shared/utils'
import { useState } from 'react'
import { BulkMoveDialog } from './bulk-move-dialog'
import { BulkCopyDialog } from './bulk-copy-dialog'
import { BulkDeleteDialog } from './bulk-delete-dialog'
import { BulkShareDialog } from './bulk-share-dialog'
import { BulkRenameDialog } from './bulk-rename-dialog'
import { BulkExportDialog } from './bulk-export-dialog'
import { BulkPermanentDeleteDialog } from './bulk-permanent-delete-dialog'
import { BulkRestoreDialog } from './bulk-restore-dialog'

interface BulkOperationsDialogProps {
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  selectedItems: Array<{
    id: string
    name: string
    type: 'file' | 'folder'
    mimeType?: string
  }>
  onBulkDelete?: () => void
  onBulkDownload?: () => void
  onBulkShare?: () => void
  onBulkMove?: () => void
  onBulkCopy?: () => void
  onBulkRename?: () => void
  onRefreshAfterBulkOp?: () => void
}

function BulkOperationsDialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  selectedItems,
  onRefreshAfterBulkOp,
}: BulkOperationsDialogProps) {
  const isMobile = useIsMobile()
  const fileCount = selectedItems.filter((item) => item.type === 'file').length
  const folderCount = selectedItems.filter(
    (item) => item.type === 'folder'
  ).length

  // Individual dialog states
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)

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

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
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
    setIsPermanentDeleteDialogOpen(true)
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
      const response = await fetch('/api/drive/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'move',
          fileIds: selectedItems.map(item => item.id),
          options: { targetFolderId }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Move completed:', result.summary)
      }
    } catch (error) {
      console.error('Move failed:', error)
    }
    setIsMoveDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleCopyComplete = async (targetFolderId: string) => {
    try {
      const response = await fetch('/api/drive/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'copy',
          fileIds: selectedItems.filter(item => item.type === 'file').map(item => item.id),
          options: { targetFolderId }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Copy completed:', result.summary)
      }
    } catch (error) {
      console.error('Copy failed:', error)
    }
    setIsCopyDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleDeleteComplete = async () => {
    try {
      const response = await fetch('/api/drive/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'delete',
          fileIds: selectedItems.map(item => item.id),
          options: {}
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Delete completed:', result.summary)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
    setIsDeleteDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleShareComplete = async (shareOptions: any) => {
    try {
      const response = await fetch('/api/drive/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'share',
          fileIds: selectedItems.map(item => item.id),
          options: shareOptions
        })
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
      onRefreshAfterBulkOp?.()
    }
  }

  const handleRenameComplete = async (pattern: string, type: string) => {
    try {
      const response = await fetch('/api/drive/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'rename',
          fileIds: selectedItems.map(item => item.id),
          options: { 
            pattern, 
            type,
            originalNames: selectedItems.map(item => item.name)
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Rename completed:', result.summary)
      }
    } catch (error) {
      console.error('Rename failed:', error)
    }
    setIsRenameDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleExportComplete = async () => {
    try {
      for (const item of selectedItems.filter(item => item.type === 'file')) {
        const link = document.createElement('a')
        link.href = `/api/drive/download/${item.id}`
        link.download = item.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
    setIsExportDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handlePermanentDeleteComplete = async () => {
    try {
      const response = await fetch('/api/drive/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'permanently_delete',
          fileIds: selectedItems.map(item => item.id),
          options: {}
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Permanent delete completed:', result.summary)
      }
    } catch (error) {
      console.error('Permanent delete failed:', error)
    }
    setIsPermanentDeleteDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleRestoreComplete = async () => {
    try {
      const response = await fetch('/api/drive/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'restore',
          fileIds: selectedItems.map(item => item.id),
          options: {}
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Restore completed:', result.summary)
      }
    } catch (error) {
      console.error('Restore failed:', error)
    }
    setIsRestoreDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const renderContent = () => (
    <>
      <div className="grid gap-3">
        {/* Move Items */}
        <Button
          variant="outline"
          onClick={handleMoveClick}
          className="w-full justify-start gap-3 h-12 text-left hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/30"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium">Move Items</span>
            <span className="text-xs text-muted-foreground">
              Move {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} to another location
            </span>
          </div>
        </Button>

        {/* Copy Items */}
        <Button
          variant="outline"
          onClick={handleCopyClick}
          className="w-full justify-start gap-3 h-12 text-left hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/30"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
            <Copy className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium">Copy Items</span>
            <span className="text-xs text-muted-foreground">
              Create copies in another location
            </span>
          </div>
        </Button>

        {/* Share Items */}
        <Button
          variant="outline"
          onClick={handleShareClick}
          className="w-full justify-start gap-3 h-12 text-left hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/30"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
            <Share2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium">Share Items</span>
            <span className="text-xs text-muted-foreground">
              Generate shareable links for selected items
            </span>
          </div>
        </Button>

        {/* Bulk Rename */}
        <Button
          variant="outline"
          onClick={handleRenameClick}
          className="w-full justify-start gap-3 h-12 text-left hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950/30"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
            <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium">Bulk Rename</span>
            <span className="text-xs text-muted-foreground">
              Rename multiple items with patterns
            </span>
          </div>
        </Button>

        {fileCount > 0 && (
          <Button
            variant="outline"
            onClick={handleExportClick}
            className="w-full justify-start gap-3 h-12 text-left hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Export Files</span>
              <span className="text-xs text-muted-foreground">
                Download {fileCount} file{fileCount > 1 ? 's' : ''} in various formats
              </span>
            </div>
          </Button>
        )}

        {/* Separator for destructive actions */}
        <div className="border-t pt-3 mt-3">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Destructive Actions</p>
          
          {/* Move to Trash */}
          <Button
            variant="outline"
            onClick={handleDeleteClick}
            className="w-full justify-start gap-3 h-12 text-left hover:bg-yellow-50 hover:border-yellow-200 dark:hover:bg-yellow-950/30 mb-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
              <Trash2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Move to Trash</span>
              <span className="text-xs text-muted-foreground">
                Move items to trash (can be restored)
              </span>
            </div>
          </Button>

          {/* Permanent Delete */}
          <Button
            variant="outline"
            onClick={handlePermanentDeleteClick}
            className="w-full justify-start gap-3 h-12 text-left hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/30 mb-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Permanent Delete</span>
              <span className="text-xs text-muted-foreground">
                Delete permanently (cannot be undone)
              </span>
            </div>
          </Button>

          {/* Restore from Trash */}
          <Button
            variant="outline"
            onClick={handleRestoreClick}
            className="w-full justify-start gap-3 h-12 text-left hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950/30"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Restore from Trash</span>
              <span className="text-xs text-muted-foreground">
                Restore deleted items to original location
              </span>
            </div>
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Main Bulk Operations Dialog */}
      {isMobile ? (
        <BottomSheet open={dialogOpen} onOpenChange={onOpenChange || onClose}>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle className="text-lg font-semibold">Bulk Operations</BottomSheetTitle>
              <BottomSheetDescription className="text-sm text-muted-foreground">
                Choose an action for {selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''} ({fileCount} file{fileCount !== 1 ? 's' : ''}, {folderCount} folder{folderCount !== 1 ? 's' : ''})
              </BottomSheetDescription>
            </BottomSheetHeader>
            <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">{renderContent()}</div>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={onOpenChange || onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Bulk Operations</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose an action for {selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''} ({fileCount} file{fileCount !== 1 ? 's' : ''}, {folderCount} folder{folderCount !== 1 ? 's' : ''})
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 max-h-[70vh] overflow-y-auto">{renderContent()}</div>
          </DialogContent>
        </Dialog>
      )}

      {/* Individual Bulk Operation Dialogs - Direct rendering tanpa Suspense */}
      <BulkMoveDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        onConfirm={handleMoveComplete}
        selectedItems={selectedItems}
      />

      <BulkCopyDialog
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        onConfirm={handleCopyComplete}
        selectedItems={selectedItems}
      />

      <BulkDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteComplete}
        selectedItems={selectedItems}
      />

      <BulkShareDialog
        open={isShareDialogOpen}
        onOpenChange={() => setIsShareDialogOpen(false)}
        onShare={handleShareComplete}
        selectedItems={selectedItems}
      />

      <BulkRenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        onConfirm={handleRenameComplete}
        selectedItems={selectedItems}
      />

      <BulkExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={handleExportComplete}
        selectedItems={selectedItems}
      />

      <BulkPermanentDeleteDialog
        isOpen={isPermanentDeleteDialogOpen}
        onClose={() => setIsPermanentDeleteDialogOpen(false)}
        onConfirm={handlePermanentDeleteComplete}
        selectedItems={selectedItems}
      />

      <BulkRestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleRestoreComplete}
        selectedItems={selectedItems}
      />
    </>
  )
}

export { BulkOperationsDialog }
export default BulkOperationsDialog