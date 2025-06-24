'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { useIsMobile } from '@/hooks/use-mobile'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PermanentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string | null
  itemName: string | null
  itemType: 'file' | 'folder'
  onDeleted: () => void
}

export function PermanentDeleteDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  itemType,
  onDeleted,
}: PermanentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isMobile = useIsMobile()

  const handlePermanentDelete = async () => {
    if (!itemId || !itemName) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/drive/files/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()

        if (errorData.needsReauth) {
          toast.error(
            'Google Drive access expired. Please reconnect your account.'
          )
          window.location.reload()
          return
        }

        // Handle specific permission errors
        if (response.status === 403) {
          toast.error(
            `You don't have permission to permanently delete "${itemName}". This may be a shared file or folder with restricted access.`
          )
          onOpenChange(false)
          return
        }

        if (response.status === 404) {
          toast.error(
            `"${itemName}" was not found. It may have already been deleted.`
          )
          onDeleted() // Refresh the list
          onOpenChange(false)
          return
        }

        throw new Error(errorData.error || 'Failed to permanently delete item')
      }

      toast.success(`${itemName} permanently deleted`)
      onDeleted()
      onOpenChange(false)
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
      }
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to permanently delete item'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const renderContent = () => (
    <>
      <p>
        Are you sure you want to <strong>permanently delete</strong> "{itemName}
        "?
      </p>
      <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-md border p-3 text-sm">
        <p className="mb-1 font-medium">
          ⚠️ Warning: This action cannot be undone
        </p>
        <p>
          This will permanently remove the {itemType} from Google Drive.
          {itemType === 'folder' &&
            ' All contents within this folder will also be permanently deleted.'}
        </p>
      </div>
      <p className="text-muted-foreground text-sm">
        If you're not sure, consider moving it to trash instead, where it can be
        restored later.
      </p>
    </>
  )

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete {itemType === 'folder' ? 'Folder' : 'File'}
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlePermanentDelete}
              disabled={isDeleting}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              {isDeleting ? (
                <>
                  <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Forever
                </>
              )}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete {itemType === 'folder' ? 'Folder' : 'File'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">{renderContent()}</div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handlePermanentDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Forever
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
