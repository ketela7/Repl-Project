'use client'

import { Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { cn } from '@/shared/utils'

interface FileDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fileName: string
  fileType: 'file' | 'folder'
}

export function FileDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  fileType,
}: FileDeleteDialogProps) {
  const isMobile = useIsMobile()

  const renderContent = () => (
    <>
      <div className="text-base">
        Are you sure you want to move this {fileType} to trash?
      </div>

      <div className="bg-muted mt-4 rounded-md p-3">
        <div className="flex items-center gap-2">
          <Trash2 className="text-destructive h-4 w-4" />
          <span className="truncate text-sm font-medium">{fileName}</span>
        </div>
      </div>

      <div className="text-muted-foreground mt-3 text-sm">
        This {fileType} will be moved to your Google Drive trash and can be
        restored later.
      </div>
    </>
  )

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={onClose}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>
              Delete {fileType === 'file' ? 'File' : 'Folder'}
            </BottomSheetTitle>
            <BottomSheetDescription>{renderContent()}</BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetFooter className="flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Move to Trash
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {fileType === 'file' ? 'File' : 'Folder'}
          </AlertDialogTitle>
          <AlertDialogDescription>{renderContent()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Move to Trash
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
