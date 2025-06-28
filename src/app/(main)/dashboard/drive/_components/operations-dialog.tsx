'use client'

import { Trash2, Download, Share2, RotateCcw, Copy, Edit, FolderOpen, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import React from 'react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetDescription } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { ItemsMoveDialog, ItemsCopyDialog, ItemsTrashDialog, ItemsShareDialog, ItemsRenameDialog, ItemsExportDialog, ItemsDeleteDialog, ItemsUntrashDialog } from '@/components/lazy-imports'
import { loadingToast } from '@/lib/toast'

import ItemsDownloadDialog from './items-download-dialog'

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
    setIsDownloadDialogOpen(true)
    handleClose()
  }

  // Bulk operation completion handlers with actual API calls and user feedback
  const handleMoveComplete = async (targetFolderId: string) => {
    const loadingId = 'move-operation'
    const itemCount = selectedItems.length

    try {
      loadingToast.start(`Moving ${itemCount} item${itemCount > 1 ? 's' : ''}...`, loadingId)

      const response = await fetch('/api/drive/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
          targetFolderId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const { success = 0, failed = 0, total = itemCount } = result

        if (failed === 0) {
          loadingToast.success(`Successfully moved ${success} item${success > 1 ? 's' : ''}`, loadingId)
        } else if (success > 0) {
          toast.warning('Move partially completed', {
            id: loadingId,
            icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
            description: `${success} moved, ${failed} failed`,
            duration: 4000,
          })
        } else {
          loadingToast.error('Failed to move items', loadingId)
        }
      } else {
        loadingToast.error(result.error || 'Failed to move items', loadingId)
      }
    } catch (error) {
      console.error('Move failed:', error)
      loadingToast.error('Network error occurred while moving items', loadingId)
    }
    setIsMoveDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleCopyComplete = async (targetFolderId: string) => {
    const loadingId = 'copy-operation'
    const copyableItems = selectedItems.filter((item) => !item.isFolder)
    const itemCount = copyableItems.length

    try {
      loadingToast.start(`Copying ${itemCount} item${itemCount > 1 ? 's' : ''}...`, loadingId)

      const response = await fetch('/api/drive/files/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: copyableItems,
          targetFolderId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const { success = 0, failed = 0, total = itemCount } = result

        if (failed === 0) {
          loadingToast.success(`Successfully copied ${success} item${success > 1 ? 's' : ''}`, loadingId)
        } else if (success > 0) {
          toast.warning('Copy partially completed', {
            id: loadingId,
            icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
            description: `${success} copied, ${failed} failed`,
            duration: 4000,
          })
        } else {
          loadingToast.error('Failed to copy items', loadingId)
        }
      } else {
        loadingToast.error(result.error || 'Failed to copy items', loadingId)
      }
    } catch (error) {
      console.error('Copy failed:', error)
      loadingToast.error('Network error occurred while copying items', loadingId)
    }
    setIsCopyDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleDeleteComplete = async () => {
    const loadingId = 'trash-operation'
    const itemCount = selectedItems.length

    try {
      loadingToast.start(`Moving ${itemCount} item${itemCount > 1 ? 's' : ''} to trash...`, loadingId)

      const response = await fetch('/api/drive/files/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const { success = 0, failed = 0, total = itemCount } = result

        if (failed === 0) {
          loadingToast.success(`Successfully moved ${success} item${success > 1 ? 's' : ''} to trash`, loadingId)
        } else if (success > 0) {
          toast.warning('Trash operation partially completed', {
            id: loadingId,
            icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
            description: `${success} moved to trash, ${failed} failed`,
            duration: 4000,
          })
        } else {
          loadingToast.error('Failed to move items to trash', loadingId)
        }
      } else {
        loadingToast.error(result.error || 'Failed to move items to trash', loadingId)
      }
    } catch (error) {
      console.error('Delete failed:', error)
      loadingToast.error('Network error occurred while moving items to trash', loadingId)
    }
    setIsTrashDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleShareComplete = async (shareOptions: any) => {
    const loadingId = 'share-operation'
    const itemCount = selectedItems.length

    try {
      loadingToast.start(`Sharing ${itemCount} item${itemCount > 1 ? 's' : ''}...`, loadingId)

      const response = await fetch('/api/drive/files/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
          ...shareOptions,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const { success = 0, failed = 0, total = itemCount, results = [] } = result

        if (failed === 0) {
          loadingToast.success(`Successfully shared ${success} item${success > 1 ? 's' : ''}`, loadingId)
        } else if (success > 0) {
          toast.warning('Share operation partially completed', {
            id: loadingId,
            icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
            description: `${success} shared, ${failed} failed`,
            duration: 4000,
          })
        } else {
          loadingToast.error('Failed to share items', loadingId)
        }

        return results
      } else {
        loadingToast.error(result.error || 'Failed to share items', loadingId)
        return []
      }
    } catch (error) {
      console.error('Share failed:', error)
      loadingToast.error('Network error occurred while sharing items', loadingId)
      return []
    } finally {
      setIsShareDialogOpen(false)
      onRefreshAfterOp?.()
    }
  }

  const handleRenameComplete = async (namePrefix: string, newName?: string) => {
    const loadingId = 'rename-operation'
    const itemCount = selectedItems.length

    try {
      loadingToast.start(`Renaming ${itemCount} item${itemCount > 1 ? 's' : ''}...`, loadingId)

      const response = await fetch('/api/drive/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
          namePrefix,
          newName,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const { success = 0, failed = 0, total = itemCount } = result

        if (failed === 0) {
          loadingToast.success(`Successfully renamed ${success} item${success > 1 ? 's' : ''}`, loadingId)
        } else if (success > 0) {
          toast.warning('Rename operation partially completed', {
            id: loadingId,
            icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
            description: `${success} renamed, ${failed} failed`,
            duration: 4000,
          })
        } else {
          loadingToast.error('Failed to rename items', loadingId)
        }
      } else {
        loadingToast.error(result.error || 'Failed to rename items', loadingId)
      }
    } catch (error) {
      console.error('Rename failed:', error)
      loadingToast.error('Network error occurred while renaming items', loadingId)
    }
    setIsRenameDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleExportComplete = async () => {
    const loadingId = 'export-operation'
    const exportableItems = selectedItems.filter((item) => !item.isFolder)
    const itemCount = exportableItems.length

    try {
      loadingToast.start(`Exporting ${itemCount} item${itemCount > 1 ? 's' : ''}...`, loadingId)

      let successCount = 0
      let failedCount = 0

      for (const item of exportableItems) {
        try {
          const link = document.createElement('a')
          link.href = `/api/drive/download/${item.id}`
          link.download = item.name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          successCount++
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Failed to export ${item.name}:`, error)
          failedCount++
        }
      }

      if (failedCount === 0) {
        loadingToast.success(`Successfully exported ${successCount} item${successCount > 1 ? 's' : ''}`, loadingId)
      } else if (successCount > 0) {
        toast.warning('Export partially completed', {
          id: loadingId,
          icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
          description: `${successCount} exported, ${failedCount} failed`,
          duration: 4000,
        })
      } else {
        loadingToast.error('Failed to export items', loadingId)
      }
    } catch (error) {
      console.error('Export failed:', error)
      loadingToast.error('An error occurred while exporting items', loadingId)
    }
    setIsExportDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handlePermanentDeleteComplete = async () => {
    const loadingId = 'delete-operation'
    const itemCount = selectedItems.length

    try {
      loadingToast.start(`Permanently deleting ${itemCount} item${itemCount > 1 ? 's' : ''}...`, loadingId)

      const response = await fetch('/api/drive/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const { success = 0, failed = 0, total = itemCount } = result

        if (failed === 0) {
          loadingToast.success(`Successfully deleted ${success} item${success > 1 ? 's' : ''} permanently`, loadingId)
        } else if (success > 0) {
          toast.warning('Delete operation partially completed', {
            id: loadingId,
            icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
            description: `${success} deleted, ${failed} failed`,
            duration: 4000,
          })
        } else {
          loadingToast.error('Failed to delete items permanently', loadingId)
        }
      } else {
        loadingToast.error(result.error || 'Failed to delete items permanently', loadingId)
      }
    } catch (error) {
      console.error('Permanent delete failed:', error)
      loadingToast.error('Network error occurred while deleting items', loadingId)
    }
    setIsDeleteDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleRestoreComplete = async () => {
    const loadingId = 'restore-operation'
    const itemCount = selectedItems.length

    try {
      loadingToast.start(`Restoring ${itemCount} item${itemCount > 1 ? 's' : ''}...`, loadingId)

      const response = await fetch('/api/drive/files/untrash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const { success = 0, failed = 0, total = itemCount } = result

        if (failed === 0) {
          loadingToast.success(`Successfully restored ${success} item${success > 1 ? 's' : ''}`, loadingId)
        } else if (success > 0) {
          toast.warning('Restore operation partially completed', {
            id: loadingId,
            icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
            description: `${success} restored, ${failed} failed`,
            duration: 4000,
          })
        } else {
          loadingToast.error('Failed to restore items', loadingId)
        }
      } else {
        loadingToast.error(result.error || 'Failed to restore items', loadingId)
      }
    } catch (error) {
      console.error('Restore failed:', error)
      loadingToast.error('Network error occurred while restoring items', loadingId)
    }
    setIsRestoreDialogOpen(false)
    onRefreshAfterOp?.()
  }

  const handleDownloadComplete = async (downloadMode: string, progressCallback?: (progress: any) => void) => {
    const loadingId = 'download-operation'
    const downloadableFiles = selectedItems.filter((item) => !item.isFolder)
    const itemCount = downloadableFiles.length

    try {
      loadingToast.start(`Downloading ${itemCount} item${itemCount > 1 ? 's' : ''}...`, loadingId)

      if (downloadMode === 'oneByOne') {
        // For one by one downloads with progress tracking
        for (let i = 0; i < downloadableFiles.length; i++) {
          const item = downloadableFiles[i]

          // Update progress through callback if available
          if (progressCallback) {
            progressCallback({
              current: i + 1,
              total: downloadableFiles.length,
              type: 'download',
              currentOperation: `Downloading ${item.name}`,
            })
          }

          const fileResponse = await fetch('/api/drive/files/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId: item.id,
              downloadMode: 'oneByOne',
            }),
          })

          if (fileResponse.ok) {
            // Check if response is file content (streaming) or JSON (fallback)
            const contentType = fileResponse.headers.get('content-type')

            if (contentType?.includes('application/json')) {
              // Fallback: use returned download URL
              const result = await fileResponse.json()
              if (result.downloadUrl) {
                window.open(result.downloadUrl, '_blank')
              }
            } else {
              // Direct file download from our server
              const blob = await fileResponse.blob()
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = item.name
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              window.URL.revokeObjectURL(url)
            }
          }

          // Small delay between downloads to prevent browser blocking
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } else if (downloadMode === 'batch') {
        // For batch downloads, download files simultaneously
        const downloadPromises = downloadableFiles.map(async (item, index) => {
          if (progressCallback) {
            progressCallback({
              current: index + 1,
              total: downloadableFiles.length,
              type: 'download',
              currentOperation: `Batch downloading ${item.name}`,
            })
          }

          const response = await fetch(`/api/drive/files/${item.id}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ downloadMode: 'batch' }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.downloadUrl) {
              window.open(result.downloadUrl, '_blank')
            }
          }
        })

        await Promise.all(downloadPromises)
      } else if (downloadMode === 'exportLinks') {
        // For CSV export, use unified endpoint - fileId='bulk' triggers bulk processing
        const response = await fetch('/api/drive/files/bulk/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: selectedItems,
            downloadMode: 'exportLinks',
          }),
        })

        if (response.ok) {
          const contentType = response.headers.get('content-type')

          if (contentType?.includes('text/csv')) {
            // Direct CSV download
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `download-links-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          } else {
            // Fallback: if response is JSON, generate CSV manually
            const result = await response.json()
            if (result.success && result.success.length > 0) {
              const csvContent = generateCSV(result.success)
              const blob = new Blob([csvContent], { type: 'text/csv' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `download-links-${new Date().toISOString().split('T')[0]}.csv`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              window.URL.revokeObjectURL(url)
            }
          }
        }
      }

      // Success feedback
      loadingToast.success(`Successfully initiated download for ${itemCount} item${itemCount > 1 ? 's' : ''}`, loadingId)
    } catch (error) {
      console.error('Download failed:', error)
      loadingToast.error('An error occurred while downloading items', loadingId)
    }
    setIsDownloadDialogOpen(false)
    onRefreshAfterOp?.()
  }

  // Helper function to generate CSV content
  const generateCSV = (successfulDownloads: Array<{ id: string; name: string; downloadUrl?: string }>) => {
    const headers = 'File Name,Download Link\n'
    const rows = successfulDownloads
      .filter((item) => item.downloadUrl)
      .map((item) => `"${item.name}","${item.downloadUrl}"`)
      .join('\n')

    return headers + rows
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
          <Button variant="outline" onClick={handleRestoreClick} className="h-12 w-full justify-start gap-3 text-left hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Restore from Trash</span>
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
                <Button variant="outline" onClick={handleDeleteClick} className="mb-3 h-12 w-full justify-start gap-3 text-left hover:border-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-950/30">
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
                <Button variant="outline" onClick={handlePermanentDeleteClick} className="mb-3 h-12 w-full justify-start gap-3 text-left hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Permanent Delete</span>
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
      <ItemsMoveDialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen} onConfirm={handleMoveComplete} selectedItems={selectedItems} />

      <ItemsCopyDialog isOpen={isCopyDialogOpen} onClose={() => setIsCopyDialogOpen(false)} onConfirm={handleCopyComplete} selectedItems={selectedItems} />

      <ItemsTrashDialog isOpen={isTrashDialogOpen} onClose={() => setIsTrashDialogOpen(false)} onConfirm={handleDeleteComplete} selectedItems={selectedItems} />

      <ItemsShareDialog open={isShareDialogOpen} onOpenChange={() => setIsShareDialogOpen(false)} onConfirm={handleShareComplete} selectedItems={selectedItems} />

      <ItemsRenameDialog isOpen={isRenameDialogOpen} onClose={() => setIsRenameDialogOpen(false)} onConfirm={handleRenameComplete} selectedItems={selectedItems} />

      <ItemsExportDialog isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} onConfirm={handleExportComplete} selectedItems={selectedItems} />

      <ItemsDownloadDialog isOpen={isDownloadDialogOpen} onClose={() => setIsDownloadDialogOpen(false)} onConfirm={handleDownloadComplete} selectedItems={selectedItems} />

      <ItemsDeleteDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={handlePermanentDeleteComplete} selectedItems={selectedItems} />

      <ItemsUntrashDialog isOpen={isRestoreDialogOpen} onClose={() => setIsRestoreDialogOpen(false)} onConfirm={handleRestoreComplete} selectedItems={selectedItems} />
    </>
  )
}

export { OperationsDialog }
export default OperationsDialog
