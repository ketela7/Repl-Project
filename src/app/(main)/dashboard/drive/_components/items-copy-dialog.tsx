'use client'

import { useState } from 'react'
import { Copy, AlertTriangle, Loader2, Folder, ArrowLeft } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { DriveDestinationSelector } from '@/components/drive-destination-selector'
import { cn, successToast, errorToast } from '@/lib/utils'

interface ItemsCopyDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (targetFolderId: string) => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
  }>
}

function ItemsCopyDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsCopyDialogProps) {
  const [showDestinationSelector, setShowDestinationSelector] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root')
  const [selectedFolderName, setSelectedFolderName] = useState<string>('My Drive')
  const isMobile = useIsMobile()

  const files = selectedItems.filter((item) => !item.isFolder)
  const folders = selectedItems.filter((item) => item.isFolder)

  const handleCopy = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/drive/files/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({ id: item.id, name: item.name })),
          targetFolderId: selectedFolderId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        successToast(`${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} copied to "${selectedFolderName}"`)
        onConfirm(selectedFolderId)
        onClose()
        setShowDestinationSelector(false)
      } else {
        throw new Error(result.error || 'Failed to copy items')
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to copy items')
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Copy className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Copy Items</h3>
          <p className="text-muted-foreground text-xs">
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </p>
        </div>
      </div>

      {/* Stats - Compact */}
      <div className="flex justify-center gap-1 flex-shrink-0">
        {files.length > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
            {files.length} file{files.length > 1 ? 's' : ''}
          </Badge>
        )}
        {folders.length > 0 && (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs">
            {folders.length} folder{folders.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Folder Warning - Compact */}
      {folders.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20 flex-shrink-0">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-xs text-amber-800 dark:text-amber-200">
            Folders cannot be copied via API
          </div>
        </div>
      )}

      {/* Files Preview - Scrollable */}
      {files.length > 0 && (
        <div className="space-y-2 flex-1 min-h-0">
          <h4 className="text-xs font-medium text-center">Files to copy:</h4>
          <div className="bg-muted/50 flex-1 overflow-y-auto rounded-lg border">
            <div className="p-2 space-y-1">
              {files.slice(0, 20).map((item) => (
                <div key={item.id} className="bg-background/50 flex items-center gap-2 rounded-md p-2 min-w-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="flex-1 truncate text-xs font-mono" title={item.name}>
                    {item.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">
                    file
                  </Badge>
                </div>
              ))}
              {files.length > 20 && (
                <div className="text-muted-foreground py-1 text-center text-xs">
                  ... and {files.length - 20} more files
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info - Compact */}
      <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20 flex-shrink-0">
        <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="text-xs text-green-800 dark:text-green-200">Select destination folder</div>
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
                  <div className="text-muted-foreground text-sm font-normal">Bulk copy operation</div>
                </div>
              </BottomSheetTitle>
            </BottomSheetHeader>

            <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

            <BottomSheetFooter className={cn('grid gap-4')}>
              <Button onClick={() => setShowDestinationSelector(true)} disabled={isLoading || files.length === 0} className={cn('touch-target min-h-[44px] active:scale-95')}>
                <Folder className="mr-2 h-4 w-4" />
                Choose Destination
              </Button>
              <Button variant="outline" onClick={onClose} className={cn('touch-target min-h-[44px] active:scale-95')}>
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
                  <DialogTitle>Choose Copy Destination</DialogTitle>
                  <DialogDescription>
                    Select where to copy {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}
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
                onClick={handleCopy}
                disabled={isLoading || !selectedFolderId}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 sm:w-auto dark:bg-purple-700 dark:hover:bg-purple-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy {files.length} Item{files.length > 1 ? 's' : ''}
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Copy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Copy Items</div>
                <div className="text-muted-foreground text-sm font-normal">Bulk copy operation</div>
              </div>
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-2">
              <div className="text-base">
                You are about to copy <span className="font-semibold">{files.length}</span> file
                {files.length > 1 ? 's' : ''} to a new location.
              </div>

              <div className="flex flex-wrap gap-2">
                {files.length > 0 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    {files.length} file{files.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {folders.length > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    {folders.length} folder{folders.length > 1 ? 's' : ''} (cannot copy)
                  </Badge>
                )}
              </div>

              {folders.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">Folders cannot be copied through the Google Drive API. Only files will be copied.</div>
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
                      <div className="text-sm font-semibold">Preview (first 3 files):</div>
                      <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                        <ul className="space-y-1 text-sm">
                          {files.slice(0, 3).map((item) => (
                            <li key={item.id} className="flex items-center gap-2 truncate">
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
                    <div className="text-sm text-purple-800 dark:text-purple-200">Select a destination folder to copy these files.</div>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => setShowDestinationSelector(true)}
              disabled={files.length === 0}
              className="w-full bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 sm:w-auto dark:bg-purple-700 dark:hover:bg-purple-800"
            >
              <Folder className="mr-2 h-4 w-4" />
              Choose Destination
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destination Selector Dialog */}
      <Dialog open={showDestinationSelector} onOpenChange={setShowDestinationSelector}>
        <DialogContent className="max-h-[80vh] max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBackToMainDialog} className="h-8 w-8 p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle>Choose Copy Destination</DialogTitle>
                <DialogDescription>
                  Select where to copy {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}
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
              onClick={handleCopy}
              disabled={isLoading || !selectedFolderId}
              className="w-full bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 sm:w-auto dark:bg-purple-700 dark:hover:bg-purple-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy {files.length} Item{files.length > 1 ? 's' : ''}
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

export { ItemsCopyDialog }
export default ItemsCopyDialog
