'use client'

import { useState } from 'react'
import { Copy, AlertTriangle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'

// FileCopyDialog removed - functionality integrated into bulk operations

interface BulkCopyDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (targetFolderId: string) => void
  selectedItems: Array<{
    id: string
    name: string
    type?: 'file' | 'folder'
  }>
}

function BulkCopyDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: BulkCopyDialogProps) {
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)
  const isMobile = useIsMobile()

  const files = selectedItems.filter((item) => item.type === 'file')
  const folders = selectedItems.filter((item) => item.type === 'folder')

  const handleCopyConfirm = (targetFolderId: string) => {
    onConfirm(targetFolderId)
    setIsCopyDialogOpen(false)
  }

  const renderContent = () => (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Copy className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Copy Items</h3>
          <p className="text-muted-foreground text-sm">
            You are about to copy {files.length} file
            {files.length > 1 ? 's' : ''} to a new location
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-2">
        {files.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          >
            {files.length} file{files.length > 1 ? 's' : ''}
          </Badge>
        )}
        {folders.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
          >
            {folders.length} folder{folders.length > 1 ? 's' : ''} (cannot copy)
          </Badge>
        )}
      </div>

      {/* Folder Warning */}
      {folders.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Folders cannot be copied through the Google
            Drive API. Only files will be copied.
          </div>
        </div>
      )}

      {/* Files Preview */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-center text-sm font-medium">
            Files to be copied:
          </h4>
          <div className="bg-muted/50 max-h-48 overflow-y-auto rounded-lg border p-4">
            <div className="space-y-2">
              {files.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="bg-background/50 flex items-center gap-3 rounded-md p-2"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="flex-1 truncate text-sm">{item.name}</span>
                  <Badge variant="outline" className="text-xs">
                    file
                  </Badge>
                </div>
              ))}
              {files.length > 5 && (
                <div className="text-muted-foreground py-2 text-center text-sm">
                  ... and {files.length - 5} more files
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
        <div className="text-sm text-green-800 dark:text-green-200">
          Click "Choose Destination" to select where you want to copy these
          files.
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <BottomSheet open={isOpen} onOpenChange={onClose}>
          <BottomSheetContent className="max-h-[90vh]">
            <BottomSheetHeader className="pb-4">
              <BottomSheetTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <Copy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Copy Items</div>
                  <div className="text-muted-foreground text-sm font-normal">
                    Bulk copy operation
                  </div>
                </div>
              </BottomSheetTitle>
            </BottomSheetHeader>

            <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

            <BottomSheetFooter className={cn('grid gap-4')}>
              {files.length > 0 && (
                <Button
                  onClick={() => setIsCopyDialogOpen(true)}
                  className={cn('touch-target min-h-[44px] active:scale-95')}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Choose Destination
                </Button>
              )}
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

        {/* FileCopyDialog removed - functionality integrated into bulk operations */}
      </>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Copy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Copy Items</div>
                <div className="text-muted-foreground text-sm font-normal">
                  Bulk copy operation
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-2">
              <div className="text-base">
                You are about to copy{' '}
                <span className="font-semibold">{files.length}</span> file
                {files.length > 1 ? 's' : ''} to a new location.
              </div>

              <div className="flex flex-wrap gap-2">
                {files.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                  >
                    {files.length} file{files.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {folders.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  >
                    {folders.length} folder{folders.length > 1 ? 's' : ''}{' '}
                    (cannot copy)
                  </Badge>
                )}
              </div>

              {folders.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    Folders cannot be copied through the Google Drive API. Only
                    files will be copied.
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <>
                  {files.length <= 5 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">
                        Files to be copied:
                      </div>
                      <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                        <ul className="space-y-1 text-sm">
                          {files.map((item) => (
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
                        Preview (first 3 files):
                      </div>
                      <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                        <ul className="space-y-1 text-sm">
                          {files.slice(0, 3).map((item) => (
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
                            and {files.length - 3} more files...
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-purple-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-200">
                      Click "Choose Destination" to select where you want to
                      copy these files.
                    </div>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {files.length > 0 && (
              <Button
                onClick={() => setIsCopyDialogOpen(true)}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 sm:w-auto dark:bg-purple-700 dark:hover:bg-purple-800"
              >
                Choose Destination
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FileCopyDialog removed - functionality integrated into bulk operations */}
    </>
  )
}

export { BulkCopyDialog }
export default BulkCopyDialog
