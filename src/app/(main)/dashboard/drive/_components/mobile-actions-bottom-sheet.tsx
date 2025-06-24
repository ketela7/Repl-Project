'use client'


import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import {
  Download,
  Trash2,
  Move,
  Copy,
  Edit2,
  Share2,
  RotateCcw,
  Trash,
  FileText,
  X,
  AlertTriangle,
} from 'lucide-react'
import { BulkOperationItem } from '@/lib/google-drive/types'

interface MobileActionsBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  selectedItems: BulkOperationItem[]
  isInTrash?: boolean
  onBulkDownload: () => void
  onBulkDelete: () => void
  onBulkMove: () => void
  onBulkCopy: () => void
  onBulkRename: () => void
  onBulkExport: () => void
  onBulkShare: () => void
  onBulkRestore?: () => void
  onBulkPermanentDelete?: () => void
  onDeselectAll: () => void
}

export function MobileActionsBottomSheet({
  open,
  onOpenChange,
  selectedCount,
  selectedItems,
  isInTrash = false,
  onBulkDownload,
  onBulkDelete,
  onBulkMove,
  onBulkCopy,
  onBulkRename,
  onBulkExport,
  onBulkShare,
  onBulkRestore,
  onBulkPermanentDelete,
  onDeselectAll,
}: MobileActionsBottomSheetProps) {
  const handleAction = (action: () => void) => {
    action()
    onOpenChange(false)
  }

  const hasFiles = selectedItems.some((item) => item.type === 'file')
  const hasOnlyFiles = selectedItems.every((item) => item.type === 'file')

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="max-h-[90vh] overflow-y-auto">
        <BottomSheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <BottomSheetTitle>
                {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
              </BottomSheetTitle>
              <BottomSheetDescription>
                Choose an action to perform on selected items
              </BottomSheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </BottomSheetHeader>

        <div className="px-4 pb-4">
          <div className="space-y-2">
            {hasFiles && (
              <Button
                variant="outline"
                className="h-12 w-full justify-start text-left"
                onClick={() => handleAction(onBulkDownload)}
              >
                <Download className="mr-3 h-4 w-4" />
                <div>
                  <div className="font-medium">Download</div>
                  <div className="text-muted-foreground text-xs">
                    {hasOnlyFiles
                      ? 'Download selected files'
                      : 'Download files only'}
                  </div>
                </div>
              </Button>
            )}

            <Button
              variant="outline"
              className="h-12 w-full justify-start text-left"
              onClick={() => handleAction(onBulkExport)}
            >
              <FileText className="mr-3 h-4 w-4" />
              <div>
                <div className="font-medium">Export</div>
                <div className="text-muted-foreground text-xs">
                  Export as different formats
                </div>
              </div>
            </Button>

            {hasFiles && !isInTrash && (
              <Button
                variant="outline"
                className="h-12 w-full justify-start text-left"
                onClick={() => handleAction(onBulkShare)}
              >
                <Share2 className="mr-3 h-4 w-4" />
                <div>
                  <div className="font-medium">Share</div>
                  <div className="text-muted-foreground text-xs">
                    Share selected items
                  </div>
                </div>
              </Button>
            )}

            <Separator />

            {!isInTrash && (
              <>
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start text-left"
                  onClick={() => handleAction(onBulkMove)}
                >
                  <Move className="mr-3 h-4 w-4" />
                  <div>
                    <div className="font-medium">Move to folder</div>
                    <div className="text-muted-foreground text-xs">
                      Move to another location
                    </div>
                  </div>
                </Button>

                {hasFiles && (
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-start text-left"
                    onClick={() => handleAction(onBulkCopy)}
                  >
                    <Copy className="mr-3 h-4 w-4" />
                    <div>
                      <div className="font-medium">Make a copy</div>
                      <div className="text-muted-foreground text-xs">
                        Copy files to current folder
                      </div>
                    </div>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="h-12 w-full justify-start text-left"
                  onClick={() => handleAction(onBulkRename)}
                >
                  <Edit2 className="mr-3 h-4 w-4" />
                  <div>
                    <div className="font-medium">Rename</div>
                    <div className="text-muted-foreground text-xs">
                      Rename selected items
                    </div>
                  </div>
                </Button>

                <Separator />

                <Button
                  variant="outline"
                  className="h-12 w-full justify-start border-orange-200 text-left text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                  onClick={() => handleAction(onBulkDelete)}
                >
                  <Trash className="mr-3 h-4 w-4" />
                  <div>
                    <div className="font-medium">Move to trash</div>
                    <div className="text-muted-foreground text-xs">
                      Items can be restored later
                    </div>
                  </div>
                </Button>
              </>
            )}

            {/* Permanently Delete - Show for items in trash or owned items */}
            {onBulkPermanentDelete && (
              <Button
                variant="outline"
                className="h-12 w-full justify-start border-red-200 text-left text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleAction(onBulkPermanentDelete)}
              >
                <AlertTriangle className="mr-3 h-4 w-4" />
                <div>
                  <div className="font-medium">Permanently Delete</div>
                  <div className="text-muted-foreground text-xs">
                    Cannot be undone
                  </div>
                </div>
              </Button>
            )}

            {isInTrash && (
              <>
                {onBulkRestore && (
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-start border-green-200 text-left text-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={() => handleAction(onBulkRestore)}
                  >
                    <RotateCcw className="mr-3 h-4 w-4" />
                    <div>
                      <div className="font-medium">Restore</div>
                      <div className="text-muted-foreground text-xs">
                        Restore to original location
                      </div>
                    </div>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="h-12 w-full justify-start border-red-200 text-left text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() =>
                    handleAction(
                      onBulkPermanentDelete ||
                        (() => {
                          if (process.env.NODE_ENV === 'development') {
                          }
                        })
                    )
                  }
                >
                  <Trash2 className="mr-3 h-4 w-4" />
                  <div>
                    <div className="font-medium">Delete forever</div>
                    <div className="text-muted-foreground text-xs">
                      Permanently delete items
                    </div>
                  </div>
                </Button>
              </>
            )}
          </div>
        </div>

        <BottomSheetFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onDeselectAll()
              onOpenChange(false)
            }}
            className="w-full"
          >
            Clear selection
          </Button>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  )
}
