'use client'

import { useState } from 'react'
import { RotateCcw, Loader2 } from 'lucide-react'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { cn, successToast, errorToast } from '@/lib/utils'

interface ItemsUntrashDialogProps {
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

function ItemsUntrashDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsUntrashDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const fileCount = selectedItems.filter((item) => !item.isFolder).length
  const folderCount = selectedItems.filter((item) => item.isFolder).length
  const isMobile = useIsMobile()

  const handleUntrash = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/drive/files/untrash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({ id: item.id })),
        }),
      })

      const result = await response.json()

      if (result.success) {
        successToast(`${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} restored from trash`)
        onConfirm()
        onClose()
      } else {
        throw new Error(result.error || 'Failed to restore items from trash')
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to restore items from trash')
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => (
    <div className="flex max-h-[60vh] flex-col space-y-4">
      {/* Header Info - Compact */}
      <div className="flex-shrink-0 space-y-2 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <RotateCcw className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Restore from Trash</h3>
          <p className="text-muted-foreground text-xs">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </p>
        </div>
      </div>

      {/* Stats - Compact */}
      <div className="flex flex-shrink-0 justify-center gap-1">
        {fileCount > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            {fileCount} file{fileCount > 1 ? 's' : ''}
          </Badge>
        )}
        {folderCount > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-100">
            {folderCount} folder{folderCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Items Preview - Scrollable */}
      <div className="min-h-0 flex-1 space-y-2">
        <h4 className="text-center text-xs font-medium">Items to restore:</h4>
        <div className="bg-muted/50 flex-1 overflow-y-auto rounded-lg border">
          <div className="space-y-1 p-2">
            {selectedItems.slice(0, 20).map((item) => (
              <div key={item.id} className="bg-background/50 flex min-w-0 items-center gap-2 rounded-md p-2">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                <span className="flex-1 truncate font-mono text-xs" title={item.name}>
                  {item.name}
                </span>
                <Badge variant="outline" className="flex-shrink-0 px-1 py-0 text-[10px]">
                  {item.isFolder ? 'folder' : 'file'}
                </Badge>
              </div>
            ))}
            {selectedItems.length > 20 && <div className="text-muted-foreground py-1 text-center text-xs">... and {selectedItems.length - 20} more items</div>}
          </div>
        </div>
      </div>

      {/* Info - Compact */}
      <div className="flex flex-shrink-0 items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
        <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="text-xs text-emerald-800 dark:text-emerald-200">Restored to original or root location</div>
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
                <div className="text-muted-foreground text-sm font-normal">Bulk restore operation</div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            <Button
              onClick={handleUntrash}
              disabled={isLoading}
              className={`${cn('touch-target min-h-[44px] active:scale-95')} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800`}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              {isLoading ? 'Restoring...' : 'Restore Items'}
            </Button>
            <Button variant="outline" onClick={onClose} className={cn('touch-target min-h-[44px] active:scale-95')}>
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
              <div className="text-muted-foreground text-sm font-normal">Bulk restore operation</div>
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 px-1">{renderContent()}</div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogAction
            onClick={handleUntrash}
            disabled={isLoading}
            className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 sm:w-auto dark:bg-green-700 dark:hover:bg-green-800"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            {isLoading ? 'Restoring...' : 'Restore Items'}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ItemsUntrashDialog }
export default ItemsUntrashDialog
