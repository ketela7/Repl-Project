'use client'

import { RotateCcw } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'

interface BulkRestoreDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
  }>
}

function BulkUntrashDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: BulkRestoreDialogProps) {
  const fileCount = selectedItems.filter((item) => !item.isFolder).length
  const folderCount = selectedItems.filter((item) => item.isFolder).length
  const isMobile = useIsMobile()

  const renderContent = () => (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <RotateCcw className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Restore from Trash</h3>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to restore {selectedItems.length} item
            {selectedItems.length > 1 ? 's' : ''} from trash?
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
          Items to be restored:
        </h4>
        <div className="bg-muted/50 max-h-48 overflow-y-auto rounded-lg border p-4">
          <div className="space-y-2">
            {selectedItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="bg-background/50 flex items-center gap-3 rounded-md p-2"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="flex-1 truncate text-sm">{item.name}</span>
                <Badge variant="outline" className="text-xs">
                  {item.isFolder ? 'folder' : 'file'}
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

      {/* Info */}
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
        <div className="text-sm text-emerald-800 dark:text-emerald-200">
          If the original parent folder was also deleted, items will be restored
          to the root of your Drive.
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Restore from Trash</div>
                <div className="text-muted-foreground text-sm font-normal">
                  Bulk restore operation
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            <Button
              onClick={onConfirm}
              className={`${cn('touch-target min-h-[44px] active:scale-95')} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800`}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore Items
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
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Restore from Trash</div>
              <div className="text-muted-foreground text-sm font-normal">
                Bulk restore operation
              </div>
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 px-1">{renderContent()}</div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 sm:w-auto dark:bg-green-700 dark:hover:bg-green-800"
          >
            Restore Items
          </AlertDialogAction>
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { BulkUntrashDialog }
export default BulkUntrashDialog
