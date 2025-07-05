'use client'

import { useState, Suspense } from 'react'
import {
  Settings,
  FolderOpen,
  Copy,
  Share2,
  Edit,
  Download,
  FileText,
  RotateCcw,
  Trash2,
  Grid3X3,
} from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/use-mobile'

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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ItemsMoveDialog from './items-move-dialog'
import ItemsCopyDialog from './items-copy-dialog'
import ItemsTrashDialog from './items-trash-dialog'
import ItemsShareDialog from './items-share-dialog'
import ItemsRenameDialog from './items-rename-dialog'
import ItemsExportDialog from './items-export-dialog'
import ItemsDeleteDialog from './items-delete-dialog'
import ItemsUntrashDialog from './items-untrash-dialog'
import ItemsDownloadDialog from './items-download-dialog'

interface OperationsDialogProps {
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  selectedItems: any[]
  onConfirm?: () => void
}

interface Operation {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  count: number
  canPerform: boolean
  isDestructive?: boolean
}

function OperationsDialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  selectedItems,
  onConfirm,
}: OperationsDialogProps) {
  const isMobile = useIsMobile()

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

  // Dialog state
  const dialogOpen = open ?? isOpen ?? false
  const handleClose = onOpenChange ? () => onOpenChange(false) : onClose || (() => {})

  // Debug logging to understand selectedItems issue
  console.log('Operations Dialog selectedItems:', selectedItems, 'length:', selectedItems.length)

  // Calculate counts and permissions
  const folderCount = selectedItems.filter(item => item.isFolder).length
  const fileCount = selectedItems.length - folderCount

  const operations: Operation[] = [
    {
      id: 'move',
      name: 'Move',
      description: `Move ${selectedItems.filter(item => item.canMove).length} items to another location`,
      icon: FolderOpen,
      color: 'blue',
      count: selectedItems.filter(item => item.canMove).length,
      canPerform: selectedItems.filter(item => item.canMove).length > 0,
    },
    {
      id: 'copy',
      name: 'Copy',
      description: `Create copies of ${selectedItems.filter(item => item.canCopy).length} items`,
      icon: Copy,
      color: 'green',
      count: selectedItems.filter(item => item.canCopy).length,
      canPerform: selectedItems.filter(item => item.canCopy).length > 0,
    },
    {
      id: 'share',
      name: 'Share',
      description: `Generate shareable links for ${selectedItems.filter(item => item.canShare).length} items`,
      icon: Share2,
      color: 'purple',
      count: selectedItems.filter(item => item.canShare).length,
      canPerform: selectedItems.filter(item => item.canShare).length > 0,
    },
    {
      id: 'rename',
      name: 'Rename',
      description: `Rename ${selectedItems.filter(item => item.canRename).length} items with patterns`,
      icon: Edit,
      color: 'orange',
      count: selectedItems.filter(item => item.canRename).length,
      canPerform: selectedItems.filter(item => item.canRename).length > 0,
    },
    {
      id: 'download',
      name: 'Download',
      description: `Download ${selectedItems.filter(item => item.canDownload).length} files directly`,
      icon: Download,
      color: 'emerald',
      count: selectedItems.filter(item => item.canDownload).length,
      canPerform: selectedItems.filter(item => item.canDownload).length > 0,
    },
    {
      id: 'export',
      name: 'Export',
      description: `Export ${selectedItems.filter(item => item.canExport).length} files in various formats`,
      icon: FileText,
      color: 'indigo',
      count: selectedItems.filter(item => item.canExport).length,
      canPerform: selectedItems.filter(item => item.canExport).length > 0,
    },
    {
      id: 'untrash',
      name: 'Untrash',
      description: `Restore ${selectedItems.filter(item => item.canUntrash).length} items from trash`,
      icon: RotateCcw,
      color: 'teal',
      count: selectedItems.filter(item => item.canUntrash).length,
      canPerform: selectedItems.filter(item => item.canUntrash).length > 0,
    },
    {
      id: 'trash',
      name: 'Move to Trash',
      description: `Move ${selectedItems.filter(item => item.canTrash).length} items to trash (recoverable)`,
      icon: Trash2,
      color: 'yellow',
      count: selectedItems.filter(item => item.canTrash).length,
      canPerform: selectedItems.filter(item => item.canTrash).length > 0,
      isDestructive: true,
    },
    {
      id: 'delete',
      name: 'Delete Permanently',
      description: `Delete ${selectedItems.filter(item => item.canDelete).length} items permanently (cannot be undone)`,
      icon: Trash2,
      color: 'red',
      count: selectedItems.filter(item => item.canDelete).length,
      canPerform: selectedItems.filter(item => item.canDelete).length > 0,
      isDestructive: true,
    },
  ]

  // Get available operations
  const availableOperations = operations.filter(op => op.canPerform)
  const regularOperations = availableOperations.filter(op => !op.isDestructive)
  const destructiveOperations = availableOperations.filter(op => op.isDestructive)

  // Operation handlers
  const handleOperationClick = (operationId: string) => {
    handleClose()

    // Add slight delay to prevent dialog conflicts
    setTimeout(() => {
      switch (operationId) {
        case 'move':
          setIsMoveDialogOpen(true)
          break
        case 'copy':
          setIsCopyDialogOpen(true)
          break
        case 'share':
          setIsShareDialogOpen(true)
          break
        case 'rename':
          setIsRenameDialogOpen(true)
          break
        case 'download':
          setIsDownloadDialogOpen(true)
          break
        case 'export':
          setIsExportDialogOpen(true)
          break
        case 'untrash':
          setIsUntrashDialogOpen(true)
          break
        case 'trash':
          setIsTrashDialogOpen(true)
          break
        case 'delete':
          setIsDeleteDialogOpen(true)
          break
        default:
          break
      }
    }, 100)
  }

  // Color variants for operations
  const getColorClasses = (color: string, isDestructive = false) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50',
      green:
        'border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50',
      purple:
        'border-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50',
      orange:
        'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50',
      emerald:
        'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50',
      indigo:
        'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50',
      teal: 'border-teal-200 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50',
      yellow:
        'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:hover:bg-yellow-950/50',
      red: 'border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50',
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const getIconClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      purple: 'text-purple-600 dark:text-purple-400',
      orange: 'text-orange-600 dark:text-orange-400',
      emerald: 'text-emerald-600 dark:text-emerald-400',
      indigo: 'text-indigo-600 dark:text-indigo-400',
      teal: 'text-teal-600 dark:text-teal-400',
      yellow: 'text-yellow-600 dark:text-yellow-400',
      red: 'text-red-600 dark:text-red-400',
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const renderOperationButton = (operation: Operation) => {
    const IconComponent = operation.icon

    return (
      <button
        key={operation.id}
        onClick={() => handleOperationClick(operation.id)}
        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:scale-[1.02] ${getColorClasses(operation.color, operation.isDestructive)}`}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${operation.color === 'red' ? 'bg-red-100 dark:bg-red-900/50' : operation.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/50' : `bg-${operation.color}-100 dark:bg-${operation.color}-900/50`}`}
        >
          <IconComponent className={`h-5 w-5 ${getIconClasses(operation.color)}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{operation.name}</span>
            {operation.count > 0 && (
              <Badge
                variant={operation.isDestructive ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {operation.count}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{operation.description}</p>
        </div>
      </button>
    )
  }

  const renderContent = () => (
    <div className="space-y-4">
      {/* Selection Summary */}
      <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3">
        <Grid3X3 className="text-muted-foreground h-5 w-5" />
        <span className="text-sm font-medium">
          {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
        </span>
        <Badge variant="outline" className="text-xs">
          {fileCount} file{fileCount !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {folderCount} folder{folderCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Regular Operations */}
      {regularOperations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-medium">Operations</h3>
          <div className="space-y-2">{regularOperations.map(renderOperationButton)}</div>
        </div>
      )}

      {/* Destructive Operations */}
      {destructiveOperations.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-destructive text-sm font-medium">Destructive Actions</h3>
            <div className="space-y-2">{destructiveOperations.map(renderOperationButton)}</div>
          </div>
        </>
      )}

      {/* No Operations Available */}
      {availableOperations.length === 0 && (
        <div className="py-8 text-center">
          <Settings className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">No Operations Available</h3>
          <p className="text-muted-foreground text-sm">
            The selected items don't support any operations at this time.
          </p>
        </div>
      )}
    </div>
  )

  const getTitle = () => {
    return availableOperations.length > 0
      ? `${availableOperations.length} Operation${availableOperations.length > 1 ? 's' : ''} Available`
      : 'No Operations Available'
  }

  const getDescription = () => {
    return `Choose an action for your selected items`
  }

  if (isMobile) {
    return (
      <>
        <BottomSheet open={dialogOpen} onOpenChange={handleClose}>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {getTitle()}
              </BottomSheetTitle>
              <BottomSheetDescription>{getDescription()}</BottomSheetDescription>
            </BottomSheetHeader>
            <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">{renderContent()}</div>
          </BottomSheetContent>
        </BottomSheet>

        {/* Operation Dialogs */}
        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsMoveDialog
            isOpen={isMoveDialogOpen}
            onClose={() => setIsMoveDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>

        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsCopyDialog
            isOpen={isCopyDialogOpen}
            onClose={() => setIsCopyDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>

        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>

        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsRenameDialog
            isOpen={isRenameDialogOpen}
            onClose={() => setIsRenameDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>

        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsDownloadDialog
            isOpen={isDownloadDialogOpen}
            onClose={() => setIsDownloadDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>

        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsExportDialog
            isOpen={isExportDialogOpen}
            onClose={() => setIsExportDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>

        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsUntrashDialog
            isOpen={isUntrashDialogOpen}
            onClose={() => setIsUntrashDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>

        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsTrashDialog
            isOpen={isTrashDialogOpen}
            onClose={() => setIsTrashDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>

        <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
          <ItemsDeleteDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            selectedItems={selectedItems}
            onConfirm={onConfirm}
          />
        </Suspense>
      </>
    )
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {getTitle()}
            </DialogTitle>
            <DialogDescription>{getDescription()}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">{renderContent()}</div>
        </DialogContent>
      </Dialog>

      {/* Operation Dialogs */}
      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsMoveDialog
          isOpen={isMoveDialogOpen}
          onClose={() => setIsMoveDialogOpen(false)}
          selectedItems={selectedItems}
          onConfirm={onConfirm}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsCopyDialog
          isOpen={isCopyDialogOpen}
          onClose={() => setIsCopyDialogOpen(false)}
          selectedItems={selectedItems}
          onConfirm={onConfirm}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          selectedItems={selectedItems}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsRenameDialog
          isOpen={isRenameDialogOpen}
          onClose={() => setIsRenameDialogOpen(false)}
          selectedItems={selectedItems}
          onConfirm={onConfirm}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsDownloadDialog
          isOpen={isDownloadDialogOpen}
          onClose={() => setIsDownloadDialogOpen(false)}
          selectedItems={selectedItems}
          onConfirm={onConfirm}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsExportDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          selectedItems={selectedItems}
          onConfirm={onConfirm}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsUntrashDialog
          isOpen={isUntrashDialogOpen}
          onClose={() => setIsUntrashDialogOpen(false)}
          selectedItems={selectedItems}
          onConfirm={onConfirm}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsTrashDialog
          isOpen={isTrashDialogOpen}
          onClose={() => setIsTrashDialogOpen(false)}
          selectedItems={selectedItems}
          onConfirm={onConfirm}
        />
      </Suspense>

      <Suspense fallback={<div className="sr-only">Loading dialog...</div>}>
        <ItemsDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          selectedItems={selectedItems}
          onConfirm={onConfirm}
        />
      </Suspense>
    </>
  )
}

export default OperationsDialog
export { OperationsDialog }
