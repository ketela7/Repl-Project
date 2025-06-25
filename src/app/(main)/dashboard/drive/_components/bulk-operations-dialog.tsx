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
  console.log('BulkOperationsDialog rendered with:', { isOpen, open, selectedItemsCount: selectedItems.length })
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
  
  // Debug dialog states
  console.log('Dialog states:', {
    isMoveDialogOpen,
    isCopyDialogOpen, 
    isDeleteDialogOpen,
    isShareDialogOpen,
    selectedItems: selectedItems.length
  })

  // Individual dialog handlers dengan debugging
  const handleMoveClick = () => {
    console.log('MOVE BUTTON CLICKED!')
    alert('Move button clicked - check console')
    setIsMoveDialogOpen(true)
    handleClose()
  }

  const handleCopyClick = () => {
    console.log('COPY BUTTON CLICKED!')
    alert('Copy button clicked - check console')
    setIsCopyDialogOpen(true)
    handleClose()
  }

  const handleDeleteClick = () => {
    console.log('DELETE BUTTON CLICKED!')
    alert('Delete button clicked - check console')
    setIsDeleteDialogOpen(true)
    handleClose()
  }

  const handleShareClick = () => {
    console.log('Opening share dialog...')
    setIsShareDialogOpen(true)
    handleClose()
  }

  const handleRenameClick = () => {
    console.log('Opening rename dialog...')
    setIsRenameDialogOpen(true)
    handleClose()
  }

  const handleExportClick = () => {
    console.log('Opening export dialog...')
    setIsExportDialogOpen(true)
    handleClose()
  }

  const handlePermanentDeleteClick = () => {
    console.log('Opening permanent delete dialog...')
    setIsPermanentDeleteDialogOpen(true)
    handleClose()
  }

  const handleRestoreClick = () => {
    console.log('Opening restore dialog...')
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
      <div className="mb-4">
        <div className="mb-2 text-sm text-muted-foreground">
          Selected {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}
        </div>
        <div className="flex flex-wrap gap-2">
          {fileCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {fileCount} file{fileCount > 1 ? 's' : ''}
            </Badge>
          )}
          {folderCount > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {folderCount} folder{folderCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Move button clicked!')
            handleMoveClick()
          }}
          className="flex items-center gap-2"
        >
          <Move className="h-4 w-4" />
          Move
        </Button>
        
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Copy button clicked!')
            handleCopyClick()
          }}
          className="flex items-center gap-2"
          disabled={fileCount === 0}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>

        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Delete button clicked!')
            handleDeleteClick()
          }}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>

        <Button
          variant="outline"
          onClick={handleShareClick}
          className="flex items-center gap-2"
        >
          <Share className="h-4 w-4" />
          Share
        </Button>

        <Button
          variant="outline"
          onClick={handleRenameClick}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Rename
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadClick}
          className="flex items-center gap-2"
          disabled={fileCount === 0}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>

        <Button
          variant="outline"
          onClick={handlePermanentDeleteClick}
          className="flex items-center gap-2 text-red-600"
        >
          <FileOutput className="h-4 w-4" />
          Permanent Delete
        </Button>

        <Button
          variant="outline"
          onClick={handleRestoreClick}
          className="flex items-center gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Restore
        </Button>
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

      {/* Individual Bulk Operation Dialogs - Direct rendering tanpa Suspense */}
      <BulkMoveDialog
        open={isMoveDialogOpen}
        onOpenChange={(open) => {
          console.log('Move dialog state changed:', open)
          setIsMoveDialogOpen(open)
        }}
        onConfirm={handleMoveComplete}
        selectedItems={selectedItems}
      />

      <BulkCopyDialog
        isOpen={isCopyDialogOpen}
        onClose={() => {
          console.log('Copy dialog closed')
          setIsCopyDialogOpen(false)
        }}
        onConfirm={handleCopyComplete}
        selectedItems={selectedItems}
      />

      <BulkDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          console.log('Delete dialog closed')
          setIsDeleteDialogOpen(false)
        }}
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