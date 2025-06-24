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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Copy, AlertTriangle } from 'lucide-react'
import { FileCopyDialog } from './file-copy-dialog'
import { cn } from '@/shared/utils'

interface BulkCopyDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (targetFolderId: string) => void
  selectedItems: Array<{
    id: string
    name: string
    type: 'file' | 'folder'
  }>
}

export function BulkCopyDialog({
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
    <>
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
            {folders.length} folder{folders.length > 1 ? 's' : ''} (cannot copy)
          </Badge>
        )}
      </div>

      {folders.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            Folders cannot be copied through the Google Drive API. Only files
            will be copied.
          </div>
        </div>
      )}

      {files.length > 0 && (
        <>
          {files.length <= 5 ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Files to be copied:</div>
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
              Click "Choose Destination" to select where you want to copy these
              files.
            </div>
          </div>
        </>
      )}
    </>
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
              <Button
                variant="outline"
                onClick={onClose}
                className={cn('touch-target min-h-[44px] active:scale-95')}
              >
                Cancel
              </Button>
              {files.length > 0 && (
                <Button
                  onClick={() => setIsCopyDialogOpen(true)}
                  className={cn('touch-target min-h-[44px] active:scale-95')}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Choose Destination
                </Button>
              )}
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>

        <FileCopyDialog
          isOpen={isCopyDialogOpen}
          onClose={() => setIsCopyDialogOpen(false)}
          fileName={`${files.length} files`}
          currentParentId={null}
          onCopy={async (newName: string, parentId: string) => {
            handleCopyConfirm(parentId)
          }}
        />
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
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {files.length > 0 && (
              <Button
                onClick={() => setIsCopyDialogOpen(true)}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 sm:w-auto dark:bg-purple-700 dark:hover:bg-purple-800"
              >
                Choose Destination
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileCopyDialog
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        onCopy={async (newName: string, parentId: string) => {
          handleCopyConfirm(parentId)
        }}
        fileName={`${files.length} files`}
        currentParentId={null}
      />
    </>
  )
}
