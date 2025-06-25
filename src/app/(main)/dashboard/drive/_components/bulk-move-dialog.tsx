'use client'

import { useState } from 'react'
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
import { Move } from 'lucide-react'
import { FileMoveDialog } from './file-move-dialog'
import { cn } from '@/shared/utils'

interface BulkMoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (targetFolderId: string) => void
  selectedItems: Array<{
    id: string
    name: string
    type: 'file' | 'folder'
    mimeType?: string
  }>
}

export function BulkMoveDialog({
  open,
  onOpenChange,
  onConfirm,
  selectedItems,
}: BulkMoveDialogProps) {
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter((item) => item.type === 'file').length
  const folderCount = selectedItems.filter(
    (item) => item.type === 'folder'
  ).length

  const handleMoveConfirm = (targetFolderId: string) => {
    onConfirm(targetFolderId)
    setIsMoveDialogOpen(false)
  }

  const renderContent = () => (
    <>
      <div className="text-base">
        You are about to move{' '}
        <span className="font-semibold">{selectedItems.length}</span> item
        {selectedItems.length > 1 ? 's' : ''} to a new location.
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
          <div className="text-sm font-semibold">Items to be moved:</div>
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
    </>
  )

  if (isMobile) {
    return (
      <>
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent className="max-h-[90vh]">
            <BottomSheetHeader className="pb-4">
              <BottomSheetTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Move className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Move Items</div>
                  <div className="text-muted-foreground text-sm font-normal">
                    Bulk move operation
                  </div>
                </div>
              </BottomSheetTitle>
            </BottomSheetHeader>

            <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

            <BottomSheetFooter className={cn('grid gap-4')}>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className={cn('touch-target min-h-[44px] active:scale-95')}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setIsMoveDialogOpen(true)}
                className={cn('touch-target min-h-[44px] active:scale-95')}
              >
                <Move className="mr-2 h-4 w-4" />
                Choose Destination
              </Button>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>

        <FileMoveDialog
          isOpen={isMoveDialogOpen}
          onClose={() => setIsMoveDialogOpen(false)}
          fileName={`${selectedItems.length} items`}
          currentParentId={null}
          onMove={async (newParentId: string) => {
            handleMoveConfirm(newParentId)
          }}
        />
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Move className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Move Items</div>
                <div className="text-muted-foreground text-sm font-normal">
                  Bulk move operation
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-2">
              <div className="text-base">
                You are about to move{' '}
                <span className="font-semibold">{selectedItems.length}</span>{' '}
                item{selectedItems.length > 1 ? 's' : ''} to a new location.
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
                  <div className="text-sm font-semibold">
                    Items to be moved:
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                    <ul className="space-y-1 text-sm">
                      {selectedItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 truncate"
                        >
                          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                          <span className="truncate">{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">
                    Preview (first 3 items):
                  </div>
                  <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                    <ul className="space-y-1 text-sm">
                      {selectedItems.slice(0, 3).map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 truncate"
                        >
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

              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  Click "Choose Destination" to select where you want to move
                  these items.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsMoveDialogOpen(true)}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 sm:w-auto dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Choose Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileMoveDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        onMove={async (newParentId: string) => {
          handleMoveConfirm(newParentId)
        }}
        fileName={`${selectedItems.length} items`}
        currentParentId={null}
      />
    </>
  )
}