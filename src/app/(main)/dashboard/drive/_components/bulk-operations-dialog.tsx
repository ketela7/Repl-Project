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
} from 'lucide-react'
import { cn } from '@/shared/utils'

interface BulkOperationsDialogProps {
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  selectedItems: Array<{
    id: string
    name: string
    type: 'file' | 'folder'
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

  // Determine dialog open state
  const dialogOpen = open ?? isOpen ?? false
  const handleClose = onOpenChange ? () => onOpenChange(false) : onClose || (() => {})

  // Default handlers for operations
  const handleBulkDelete = onBulkDelete || (() => console.log('Bulk delete'))
  const handleBulkDownload = onBulkDownload || (() => console.log('Bulk download'))
  const handleBulkShare = onBulkShare || (() => console.log('Bulk share'))
  const handleBulkMove = onBulkMove || (() => console.log('Bulk move'))
  const handleBulkCopy = onBulkCopy || (() => console.log('Bulk copy'))
  const handleBulkRename = onBulkRename || (() => console.log('Bulk rename'))

  const operations = [
    {
      icon: Download,
      label: 'Download',
      description: 'Download selected items',
      action: handleBulkDownload,
      variant: 'default' as const,
    },
    {
      icon: Share,
      label: 'Share',
      description: 'Share selected items',
      action: handleBulkShare,
      variant: 'default' as const,
    },
    {
      icon: Move,
      label: 'Move',
      description: 'Move to another folder',
      action: handleBulkMove,
      variant: 'default' as const,
    },
    {
      icon: Copy,
      label: 'Copy',
      description: 'Create copies',
      action: handleBulkCopy,
      variant: 'default' as const,
    },
    {
      icon: Edit,
      label: 'Rename',
      description: 'Bulk rename with patterns',
      action: handleBulkRename,
      variant: 'default' as const,
    },
    {
      icon: Trash2,
      label: 'Delete',
      description: 'Move to trash',
      action: handleBulkDelete,
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
              onClick={() => {
                operation.action()
                onRefreshAfterBulkOp?.()
                handleClose()
              }}
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

  if (isMobile) {
    return (
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
    )
  }

  return (
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
  )
}
