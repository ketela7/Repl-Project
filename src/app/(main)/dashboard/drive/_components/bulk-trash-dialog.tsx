
'use client'

import { Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface BulkTrashDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    type: 'file' | 'folder'
  }>
}

function BulkTrashDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: BulkTrashDialogProps) {
  const fileCount = selectedItems.filter((item) => item.type === 'file').length
  const folderCount = selectedItems.filter(
    (item) => item.type === 'folder'
  ).length
  const isMobile = useIsMobile()

  const renderContent = () => (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <Trash2 className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Move to Trash</h3>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to move {selectedItems.length} item
            {selectedItems.length > 1 ? 's' : ''} to trash?
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-2">
        {fileCount > 0 && (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
          >
            {fileCount} file{fileCount > 1 ? 's' : ''}
          </Badge>
        )}
        {folderCount > 0 && (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
          >
            {folderCount} folder{folderCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Items Preview */}
      <div className="space-y-3">
        <h4 className="text-center text-sm font-medium">
          Items to be moved to trash:
        </h4>
        <div className="bg-muted/50 max-h-48 overflow-y-auto rounded-lg border p-4">
          <div className="space-y-2">
            {selectedItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="bg-background/50 flex items-center gap-3 rounded-md p-2"
              >
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="flex-1 truncate text-sm">{item.name}</span>
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
              </div>
            ))}
            {selectedItems.length > 5 && (
              <div className="text-muted-foreground py-2 text-center text-sm">
                ... and {selectedItems.length - 5} more items
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
        <div className="text-sm text-amber-800 dark:text-amber-200">
          These items will be moved to your Google Drive trash and can be
          restored later.
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={onClose}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Move to Trash</div>
                <div className="text-muted-foreground text-sm font-normal">
                  Bulk Move to Trash Operation
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>

            <Button
              onClick={onConfirm}
              className={`${cn('touch-target min-h-[44px] active:scale-95')} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800`}
            >
              Move to Trash
            </Button>
                        <Button
              variant="outline"
              onClick={onClose}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Cancel
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Move to Trash</div>
              <div className="text-muted-foreground text-sm font-normal">
                Bulk Move to Trash Operation
              </div>
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 px-1">{renderContent()}</div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 sm:w-auto dark:bg-red-700 dark:hover:bg-red-800"
          >
            Move to Trash
          </AlertDialogAction>
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { BulkTrashDialog }
export default BulkTrashDialog
