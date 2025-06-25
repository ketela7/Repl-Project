'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  Trash2,
  Download,
  Share,
  Move,
  Copy,
  Edit,
  FolderOpen,
  FileDown,
  FileOutput,
} from 'lucide-react'
import { cn } from '@/shared/utils'
import { Suspense, useState } from 'react'
import {
  BulkMoveDialog,
  BulkCopyDialog,
  BulkDeleteDialog,
  BulkShareDialog,
  BulkRenameDialog,
  BulkExportDialog,
} from './optimized-lazy-dialogs'

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

export function BulkOperationsDialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  selectedItems,
  onBulkDelete,
  onBulkDownload,
  onBulkShare,
  onBulkMove,
  onBulkCopy,
  onBulkRename,
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

  const handleDownloadClick = () => {
    if (onBulkDownload) {
      onBulkDownload()
    } else {
      console.log('Bulk download:', selectedItems.length, 'items')
    }
    onRefreshAfterBulkOp?.()
    handleClose()
  }

  // Completion handlers for individual dialogs
  const handleMoveComplete = (targetFolderId: string) => {
    if (onBulkMove) {
      onBulkMove()
    }
    setIsMoveDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleCopyComplete = (targetFolderId: string) => {
    if (onBulkCopy) {
      onBulkCopy()
    }
    setIsCopyDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleDeleteComplete = () => {
    if (onBulkDelete) {
      onBulkDelete()
    }
    setIsDeleteDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleShareComplete = (permissions: any) => {
    if (onBulkShare) {
      onBulkShare()
    }
    setIsShareDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleRenameComplete = (renamePattern: string, renameType: string) => {
    if (onBulkRename) {
      onBulkRename()
    }
    setIsRenameDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const handleExportComplete = (exportFormat: string) => {
    console.log('Bulk export:', selectedItems.length, 'items as', exportFormat)
    setIsExportDialogOpen(false)
    onRefreshAfterBulkOp?.()
  }

  const operations = [
    {
      icon: FileDown,
      label: 'Download',
      description: 'Download selected items',
      action: handleDownloadClick,
      variant: 'default' as const,
    },
    {
      icon: FileOutput,
      label: 'Export',
      description: 'Export in different formats',
      action: handleExportClick,
      variant: 'default' as const,
    },
    {
      icon: Share,
      label: 'Share',
      description: 'Share selected items',
      action: handleShareClick,
      variant: 'default' as const,
    },
    {
      icon: Move,
      label: 'Move',
      description: 'Move to another folder',
      action: handleMoveClick,
      variant: 'default' as const,
    },
    {
      icon: Copy,
      label: 'Copy',
      description: 'Create copies',
      action: handleCopyClick,
      variant: 'default' as const,
    },
    {
      icon: Edit,
      label: 'Rename',
      description: 'Bulk rename with patterns',
      action: handleRenameClick,
      variant: 'default' as const,
    },
    {
      icon: Trash2,
      label: 'Delete',
      description: 'Move to trash',
      action: handleDeleteClick,
      variant: 'destructive' as const,
    },
  ]

  const renderContent = () => (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Badge variant="secondary">{selectedItems.length} items selected</Badge>
        {fileCount > 0 && (
          <Badge variant="outline">
            {fileCount} file{fileCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {folderCount > 0 && (
          <Badge variant="outline">
            <FolderOpen className="mr-1 h-3 w-3" />
            {folderCount} folder{folderCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid gap-2">
        {operations.map((operation) => {
          const Icon = operation.icon
          return (
            <Button
              key={operation.label}
              variant={operation.variant}
              className={`${cn('touch-target min-h-[44px] active:scale-95')} h-auto justify-start p-3`}
              onClick={operation.action}
            >
              <Icon className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{operation.label}</div>
                <div className="text-muted-foreground text-xs">
                  {operation.description}
                </div>
              </div>
            </Button>
          )
        })}
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
              <BottomSheetTitle>Bulk Operations</BottomSheetTitle>
              <BottomSheetDescription>
                Choose an action for the selected items
              </BottomSheetDescription>
            </BottomSheetHeader>
            <div className="px-4 pb-4">{renderContent()}</div>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={onOpenChange || onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bulk Operations</DialogTitle>
              <DialogDescription>
                Choose an action for the selected items
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">{renderContent()}</div>
          </DialogContent>
        </Dialog>
      )}

      {/* Individual Bulk Operation Dialogs */}
      {isMoveDialogOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <BulkMoveDialog
            isOpen={isMoveDialogOpen}
            onClose={() => setIsMoveDialogOpen(false)}
            onConfirm={handleMoveComplete}
            selectedItems={selectedItems}
          />
        </Suspense>
      )}

      {isCopyDialogOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <BulkCopyDialog
            isOpen={isCopyDialogOpen}
            onClose={() => setIsCopyDialogOpen(false)}
            onConfirm={handleCopyComplete}
            selectedItems={selectedItems}
          />
        </Suspense>
      )}

      {isDeleteDialogOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <BulkDeleteDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeleteComplete}
            selectedItems={selectedItems}
          />
        </Suspense>
      )}

      {isShareDialogOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <BulkShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            onConfirm={handleShareComplete}
            selectedItems={selectedItems}
          />
        </Suspense>
      )}

      {isRenameDialogOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <BulkRenameDialog
            isOpen={isRenameDialogOpen}
            onClose={() => setIsRenameDialogOpen(false)}
            onConfirm={handleRenameComplete}
            selectedItems={selectedItems}
          />
        </Suspense>
      )}

      {isExportDialogOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <BulkExportDialog
            isOpen={isExportDialogOpen}
            onClose={() => setIsExportDialogOpen(false)}
            onConfirm={handleExportComplete}
            selectedItems={selectedItems}
          />
        </Suspense>
      )}
    </>
  )
}
