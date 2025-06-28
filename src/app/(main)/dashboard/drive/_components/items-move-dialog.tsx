'use client'

import { useState } from 'react'
import { Move, Loader2, Folder, ArrowLeft } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { DriveDestinationSelector } from '@/components/drive-destination-selector'
import { cn, successToast, errorToast } from '@/lib/utils'

// FileMoveDialog removed - functionality integrated into bulk operations

interface ItemsMoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (targetFolderId: string) => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
  }>
}

function ItemsMoveDialog({ open, onOpenChange, onConfirm, selectedItems }: ItemsMoveDialogProps) {
  const [showDestinationSelector, setShowDestinationSelector] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root')
  const [selectedFolderName, setSelectedFolderName] = useState<string>('My Drive')
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter((item) => !item.isFolder).length
  const folderCount = selectedItems.filter((item) => item.isFolder).length

  const handleMove = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/drive/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({ id: item.id })),
          targetFolderId: selectedFolderId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        successToast(`${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} moved to "${selectedFolderName}"`)
        onConfirm(selectedFolderId)
        onOpenChange(false)
        setShowDestinationSelector(false)
      } else {
        throw new Error(result.error || 'Failed to move items')
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to move items')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDestinationSelect = (folderId: string, folderName?: string) => {
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName || (folderId === 'root' ? 'My Drive' : 'Selected Folder'))
  }

  const handleBackToMainDialog = () => {
    setShowDestinationSelector(false)
  }

  const renderContent = () => (
    <div className="flex flex-col space-y-4 max-h-[60vh]">
      {/* Header Info - Compact */}
      <div className="space-y-2 text-center flex-shrink-0">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Move className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Move Items</h3>
          <p className="text-muted-foreground text-xs">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </p>
        </div>
      </div>

      {/* Stats - Compact */}
      <div className="flex justify-center gap-1 flex-shrink-0">
        {fileCount > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs">
            {fileCount} file{fileCount > 1 ? 's' : ''}
          </Badge>
        )}
        {folderCount > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs">
            {folderCount} folder{folderCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Items Preview - Scrollable */}
      <div className="space-y-2 flex-1 min-h-0">
        <h4 className="text-xs font-medium text-center">Items to move:</h4>
        <div className="bg-muted/50 flex-1 overflow-y-auto rounded-lg border">
          <div className="p-2 space-y-1">
            {selectedItems.slice(0, 20).map((item) => (
              <div key={item.id} className="bg-background/50 flex items-center gap-2 rounded-md p-2 min-w-0">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="flex-1 truncate text-xs font-mono" title={item.name}>
                  {item.name}
                </span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">
                  {item.isFolder ? 'folder' : 'file'}
                </Badge>
              </div>
            ))}
            {selectedItems.length > 20 && (
              <div className="text-muted-foreground py-1 text-center text-xs">
                ... and {selectedItems.length - 20} more items
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info - Compact */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20 flex-shrink-0">
        <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="text-xs text-blue-800 dark:text-blue-200">Select destination folder</div>
      </div>
    </div>
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
                  <div className="text-muted-foreground text-sm font-normal">Bulk move operation</div>
                </div>
              </BottomSheetTitle>
            </BottomSheetHeader>

            <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

            <BottomSheetFooter className={cn('grid gap-4')}>
              <Button onClick={() => setShowDestinationSelector(true)} disabled={isLoading} className={cn('touch-target min-h-[44px] active:scale-95')}>
                <Folder className="mr-2 h-4 w-4" />
                Choose Destination
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className={cn('touch-target min-h-[44px] active:scale-95')}>
                Cancel
              </Button>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>

        {/* Destination Selector Dialog for Mobile */}
        <Dialog open={showDestinationSelector} onOpenChange={setShowDestinationSelector}>
          <DialogContent className="max-h-[80vh] max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleBackToMainDialog} className="h-8 w-8 p-1">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>Choose Move Destination</DialogTitle>
                  <DialogDescription>
                    Select where to move {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DriveDestinationSelector onSelect={handleDestinationSelect} selectedFolderId={selectedFolderId} className="py-4" />

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <div className="flex-1 text-left">
                <div className="text-muted-foreground text-sm">
                  Selected: <span className="text-foreground font-medium">{selectedFolderName}</span>
                </div>
              </div>
              <Button
                onClick={handleMove}
                disabled={isLoading || !selectedFolderId}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 sm:w-auto dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Moving...
                  </>
                ) : (
                  <>
                    <Move className="mr-2 h-4 w-4" />
                    Move {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleBackToMainDialog} className="w-full sm:w-auto">
                Back
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <div className="text-muted-foreground text-sm font-normal">Bulk move operation</div>
              </div>
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-2">
              <div className="text-base">
                You are about to move <span className="font-semibold">{selectedItems.length}</span> item
                {selectedItems.length > 1 ? 's' : ''} to a new location.
              </div>

              <div className="flex flex-wrap gap-2">
                {fileCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    {fileCount} file{fileCount > 1 ? 's' : ''}
                  </Badge>
                )}
                {folderCount > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
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

              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">Click &ldquo;Choose Destination&rdquo; to select where you want to move these items.</div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button onClick={() => setShowDestinationSelector(true)} className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 sm:w-auto dark:bg-blue-700 dark:hover:bg-blue-800">
              <Folder className="mr-2 h-4 w-4" />
              Choose Destination
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destination Selector Dialog for Desktop */}
      <Dialog open={showDestinationSelector} onOpenChange={setShowDestinationSelector}>
        <DialogContent className="max-h-[80vh] max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBackToMainDialog} className="h-8 w-8 p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle>Choose Move Destination</DialogTitle>
                <DialogDescription>
                  Select where to move {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DriveDestinationSelector onSelect={handleDestinationSelect} selectedFolderId={selectedFolderId} className="py-4" />

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <div className="flex-1 text-left">
              <div className="text-muted-foreground text-sm">
                Selected: <span className="text-foreground font-medium">{selectedFolderName}</span>
              </div>
            </div>
            <Button
              onClick={handleMove}
              disabled={isLoading || !selectedFolderId}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 sm:w-auto dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <Move className="mr-2 h-4 w-4" />
                  Move {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleBackToMainDialog} className="w-full sm:w-auto">
              Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ItemsMoveDialog }
export default ItemsMoveDialog
