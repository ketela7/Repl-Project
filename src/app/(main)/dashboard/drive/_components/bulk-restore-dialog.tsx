'use client'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { RotateCcw, Info } from 'lucide-react'
import { cn } from '@/shared/utils'

interface BulkRestoreDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    type: 'file' | 'folder'
    mimeType?: string
  }>
}

export function BulkRestoreDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: BulkRestoreDialogProps) {
  const fileCount = selectedItems.filter((item) => item.type === 'file').length
  const folderCount = selectedItems.filter(
    (item) => item.type === 'folder'
  ).length
  const isMobile = useIsMobile()

  const renderContent = () => (
    <>
      <div className="text-base">
        Are you sure you want to restore{' '}
        <span className="font-semibold">{selectedItems.length}</span> item
        {selectedItems.length > 1 ? 's' : ''} from trash?
      </div>

      <div className="flex flex-wrap gap-2">
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

      {selectedItems.length <= 5 ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold">Items to be restored:</div>
          <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
            <ul className="space-y-1 text-sm">
              {selectedItems.map((item) => (
                <li key={item.id} className="flex items-center gap-2 truncate">
                  <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                  <span className="truncate">{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-semibold">Preview (first 3 items):</div>
          <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
            <ul className="space-y-1 text-sm">
              {selectedItems.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center gap-2 truncate">
                  <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                  <span className="truncate">{item.name}</span>
                </li>
              ))}
              <li className="text-muted-foreground/70 flex items-center gap-2 italic">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                and {selectedItems.length - 3} more items...
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
        <div className="text-sm text-green-800 dark:text-green-200">
          These items will be restored to their original locations in Google
          Drive.
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
        <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="text-sm text-blue-800 dark:text-blue-200">
          If the original parent folder was also deleted, items will be restored
          to the root of your Drive.
        </div>
      </div>
    </>
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
              variant="outline"
              onClick={onClose}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className={`${cn('touch-target min-h-[44px] active:scale-95')} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800`}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore Items
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
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 sm:w-auto dark:bg-green-700 dark:hover:bg-green-800"
          >
            Restore Items
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
