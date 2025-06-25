import React, { useState, Suspense } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { 
  Download, 
  Copy, 
  Move, 
  Share, 
  Trash2,
  FileText,
  Edit3,
  X
} from 'lucide-react'
import { DriveItem } from '@/shared/types'
import { 
  BulkMoveDialog,
  BulkCopyDialog,
  BulkDeleteDialog,
  BulkShareDialog,
  BulkRenameDialog
} from './optimized-lazy-dialogs'

interface BulkOperationsDialogMobileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedItems: DriveItem[]
  onRefreshAfterBulkOp: () => void
}

export function BulkOperationsDialogMobile({
  open,
  onOpenChange,
  selectedItems,
  onRefreshAfterBulkOp
}: BulkOperationsDialogMobileProps) {
  // Individual dialog state management
  const [bulkDialogs, setBulkDialogs] = useState({
    move: false,
    copy: false,
    delete: false,
    share: false,
    rename: false,
  })

  const openBulkDialog = (type: keyof typeof bulkDialogs) => {
    setBulkDialogs(prev => ({ ...prev, [type]: true }))
    onOpenChange(false) // Close main dialog
  }

  const closeBulkDialog = (type: keyof typeof bulkDialogs) => {
    setBulkDialogs(prev => ({ ...prev, [type]: false }))
  }

  const handleBulkOperationComplete = () => {
    onRefreshAfterBulkOp()
  }

  const selectedCount = selectedItems.length

  const handleBulkDownload = () => {
    // TODO: Implement bulk download
    onOpenChange(false)
  }

  const handleBulkExport = () => {
    // TODO: Implement bulk export
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Choose an action for {selectedCount} selected items
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Button
              onClick={handleBulkDownload}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="mr-2 h-4 w-4" />
              Download {selectedCount} items
            </Button>

            <Button
              onClick={() => openBulkDialog('move')}
              variant="outline"
              className="w-full justify-start"
            >
              <Move className="mr-2 h-4 w-4" />
              Move {selectedCount} items
            </Button>

            <Button
              onClick={() => openBulkDialog('copy')}
              variant="outline"
              className="w-full justify-start"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy {selectedCount} items
            </Button>

            <Button
              onClick={() => openBulkDialog('share')}
              variant="outline"
              className="w-full justify-start"
            >
              <Share className="mr-2 h-4 w-4" />
              Share {selectedCount} items
            </Button>

            <Button
              onClick={() => openBulkDialog('rename')}
              variant="outline"
              className="w-full justify-start"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Rename {selectedCount} items
            </Button>

            <Button
              onClick={handleBulkExport}
              variant="outline"
              className="w-full justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export {selectedCount} items
            </Button>

            <Button
              onClick={() => openBulkDialog('delete')}
              variant="destructive"
              className="w-full justify-start"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedCount} items
            </Button>

            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Bulk Dialogs - Mobile */}
      {bulkDialogs.move && (
        <Suspense fallback={<div className="animate-pulse h-8 w-8 bg-gray-200 rounded" />}>
          <BulkMoveDialog
            isOpen={bulkDialogs.move}
            onClose={() => closeBulkDialog('move')}
            selectedItems={selectedItems}
            onConfirm={() => {
              closeBulkDialog('move')
              handleBulkOperationComplete()
            }}
          />
        </Suspense>
      )}

      {bulkDialogs.copy && (
        <Suspense fallback={<div className="animate-pulse h-8 w-8 bg-gray-200 rounded" />}>
          <BulkCopyDialog
            isOpen={bulkDialogs.copy}
            onClose={() => closeBulkDialog('copy')}
            selectedItems={selectedItems}
            onConfirm={() => {
              closeBulkDialog('copy')
              handleBulkOperationComplete()
            }}
          />
        </Suspense>
      )}

      {bulkDialogs.delete && (
        <Suspense fallback={<div className="animate-pulse h-8 w-8 bg-gray-200 rounded" />}>
          <BulkDeleteDialog
            isOpen={bulkDialogs.delete}
            onClose={() => closeBulkDialog('delete')}
            selectedItems={selectedItems}
            onConfirm={() => {
              closeBulkDialog('delete')
              handleBulkOperationComplete()
            }}
          />
        </Suspense>
      )}

      {bulkDialogs.share && (
        <Suspense fallback={<div className="animate-pulse h-8 w-8 bg-gray-200 rounded" />}>
          <BulkShareDialog
            open={bulkDialogs.share}
            onOpenChange={(open) => {
              if (!open) closeBulkDialog('share')
            }}
            selectedItems={selectedItems}
          />
        </Suspense>
      )}

      {bulkDialogs.rename && (
        <Suspense fallback={<div className="animate-pulse h-8 w-8 bg-gray-200 rounded" />}>
          <BulkRenameDialog
            isOpen={bulkDialogs.rename}
            onClose={() => closeBulkDialog('rename')}
            onConfirm={(renamePattern: string, renameType: string) => {
              closeBulkDialog('rename')
              handleBulkOperationComplete()
            }}
            selectedItems={selectedItems}
          />
        </Suspense>
      )}
    </>
  )
}