import React, { useState, Suspense } from 'react'
import { 
  DropdownMenuItem
} from '@/shared/components/ui/dropdown-menu'
import { 
  Download, 
  Copy, 
  Move, 
  Share, 
  Trash2,
  FileText,
  Edit3
} from 'lucide-react'
import { DriveItem } from '@/shared/types'
import { 
  BulkMoveDialog,
  BulkCopyDialog,
  BulkDeleteDialog,
  BulkShareDialog,
  BulkRenameDialog
} from './optimized-lazy-dialogs'

interface BulkOperationsDialogDekstopProps {
  selectedItems: DriveItem[]
  onRefreshAfterBulkOp: () => void
}

export function BulkOperationsDialogDekstop({
  selectedItems,
  onRefreshAfterBulkOp
}: BulkOperationsDialogDekstopProps) {
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
  }

  const handleBulkExport = () => {
    // TODO: Implement bulk export
  }

  return (
    <>
      <DropdownMenuItem onClick={handleBulkDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download ({selectedCount})
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => openBulkDialog('move')}>
        <Move className="mr-2 h-4 w-4" />
        Move ({selectedCount})
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => openBulkDialog('copy')}>
        <Copy className="mr-2 h-4 w-4" />
        Copy ({selectedCount})
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => openBulkDialog('share')}>
        <Share className="mr-2 h-4 w-4" />
        Share ({selectedCount})
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => openBulkDialog('rename')}>
        <Edit3 className="mr-2 h-4 w-4" />
        Rename ({selectedCount})
      </DropdownMenuItem>

      <DropdownMenuItem onClick={handleBulkExport}>
        <FileText className="mr-2 h-4 w-4" />
        Export ({selectedCount})
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => openBulkDialog('delete')} className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete ({selectedCount})
      </DropdownMenuItem>

      {/* Individual Bulk Dialogs - Desktop */}
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