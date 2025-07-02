'use client'

import { useState, useRef } from 'react'
import { Move, Loader2, Folder, ArrowLeft, CheckCircle, XCircle, AlertTriangle, SkipForward } from 'lucide-react'
import { toast } from 'sonner'

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
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { DriveDestinationSelector } from '@/components/drive-destination-selector'
import { cn } from '@/lib/utils'

// FileMoveDialog removed - functionality integrated into bulk operations

interface ItemsMoveDialogProps {
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

function ItemsMoveDialog({ isOpen, onClose, onConfirm: _onConfirm, selectedItems }: ItemsMoveDialogProps) {
  const [showDestinationSelector, setShowDestinationSelector] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root')
  const [selectedFolderName, setSelectedFolderName] = useState<string>('My Drive')
  const [progress, setProgress] = useState<{
    current: number
    total: number
    currentFile?: string
    success: number
    skipped: number
    failed: number
    errors: Array<{ file: string; error: string }>
  }>({
    current: 0,
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  })

  // Use ref for immediate cancellation control
  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter(item => !item.isFolder).length
  const folderCount = selectedItems.filter(item => item.isFolder).length

  const handleCancel = () => {
    // Immediately set cancellation flags
    isCancelledRef.current = true
    setIsCancelled(true)

    // Abort any ongoing network requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Stop processing
    setIsProcessing(false)
    setIsCompleted(true)

    toast.info('Move operation cancelled by user')
  }

  const handleMove = async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for moving')
      return
    }

    // Reset cancellation flags
    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setIsCompleted(false)

    // Create new AbortController for this operation
    abortControllerRef.current = new AbortController()

    try {
      // Initialize progress
      setProgress({
        current: 0,
        total: selectedItems.length,
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      })

      let successCount = 0
      let failedCount = 0
      const errors: Array<{ file: string; error: string }> = []

      // Move items with progress tracking and cancellation support
      for (let i = 0; i < selectedItems.length; i++) {
        // Check cancellation using ref (immediate)
        if (isCancelledRef.current) {
          toast.info(`Move cancelled after ${successCount} items`)
          break
        }

        const item = selectedItems[i]
        if (!item) continue

        try {
          setProgress(prev => ({
            ...prev,
            current: i + 1,
            currentFile: item.name,
          }))

          // Check cancellation before API call
          if (isCancelledRef.current) {
            break
          }

          const response = await fetch('/api/drive/files/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{ id: item.id }],
              targetFolderId: selectedFolderId,
            }),
            signal: abortControllerRef.current?.signal,
          })

          if (abortControllerRef.current?.signal.aborted) {
            break // Operation was cancelled
          }

          const result = await response.json()

          if (result.success) {
            successCount++
          } else {
            throw new Error(result.error || 'Failed to move item')
          }

          // Small delay between items to allow cancellation
          if (!isCancelledRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error: any) {
          if (abortControllerRef.current?.signal.aborted) {
            break // Operation was cancelled
          }

          failedCount++
          errors.push({
            file: item.name,
            error: error.message || 'Move failed',
          })
        }

        // Update progress
        setProgress(prev => ({
          ...prev,
          success: successCount,
          failed: failedCount,
          errors,
        }))

        // Final cancellation check
        if (isCancelledRef.current) {
          break
        }
      }

      // Show results only if not cancelled
      if (!isCancelledRef.current) {
        if (successCount > 0) {
          toast.success(`Moved ${successCount} item${successCount > 1 ? 's' : ''} to "${selectedFolderName}"`)
        }
        if (failedCount > 0) {
          toast.error(`Failed to move ${failedCount} item${failedCount > 1 ? 's' : ''}`)
        }
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        // Operation was cancelled, don't show error
        return
      }
      // // // // // console.error(err)
      toast.error('Move operation failed')
    } finally {
      // Clean up
      abortControllerRef.current = null
      setIsProcessing(false)
      setIsCompleted(true)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      // Reset states when closing
      setIsCompleted(false)
      setIsCancelled(false)
      isCancelledRef.current = false
      abortControllerRef.current = null
      setShowDestinationSelector(false)
      setProgress({
        current: 0,
        total: 0,
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      })
      onClose()
    }
  }

  const handleCloseAndRefresh = () => {
    if (!isProcessing) {
      // Refresh immediately to show results
      window.location.reload()
    }
  }

  const handleDestinationSelect = (folderId: string, folderName?: string) => {
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName || (folderId === 'root' ? 'My Drive' : 'Selected Folder'))
  }

  const handleBackToMainDialog = () => {
    setShowDestinationSelector(false)
  }

  const handleConfirmDestinationAndMove = () => {
    setShowDestinationSelector(false)
    setIsProcessing(true)
    // Trigger move operation immediately
    setTimeout(() => {
      handleMove()
    }, 100)
  }

  // Render different content based on state
  const renderContent = () => {
    // 1. Initial State - Show selection and destination options
    if (!isProcessing && !isCompleted) {
      return (
        <div className="flex max-h-[60vh] flex-col space-y-4">
          {/* Header Info - Compact */}
          <div className="flex-shrink-0 space-y-2 text-center">
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
          <div className="flex flex-shrink-0 justify-center gap-1">
            {fileCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              >
                {fileCount} file{fileCount > 1 ? 's' : ''}
              </Badge>
            )}
            {folderCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-100"
              >
                {folderCount} folder{folderCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Items Preview - Scrollable */}
          <div className="min-h-0 flex-1 space-y-2">
            <h4 className="text-center text-xs font-medium">Items to move:</h4>
            <div className="bg-muted/50 flex-1 overflow-y-auto rounded-lg border">
              <div className="space-y-1 p-2">
                {selectedItems.slice(0, 5).map(item => (
                  <div key={item.id} className="bg-background/50 flex min-w-0 items-center gap-2 rounded-md p-2">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    <span className="flex-1 truncate font-mono text-xs" title={item.name}>
                      {item.name}
                    </span>
                    <Badge variant="outline" className="flex-shrink-0 px-1 py-0 text-[10px]">
                      {item.isFolder ? 'folder' : 'file'}
                    </Badge>
                  </div>
                ))}
                {selectedItems.length > 5 && (
                  <div className="text-muted-foreground py-1 text-center text-xs">
                    ... and {selectedItems.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Destination Selection */}
          <div className="flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Destination:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDestinationSelector(true)}
                className="h-7 text-xs"
              >
                <Folder className="mr-1 h-3 w-3" />
                Choose
              </Button>
            </div>
            <div className="bg-muted/30 rounded-md border p-2">
              <div className="text-muted-foreground text-xs">Moving to:</div>
              <div className="text-sm font-medium">{selectedFolderName}</div>
            </div>
          </div>
        </div>
      )
    }

    // 2. Processing State - Show progress with cancellation
    if (isProcessing) {
      const progressPercentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

      return (
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold">Moving Items...</h3>
              <p className="text-muted-foreground text-sm">
                {progress.current} of {progress.total} items
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {/* Current File */}
          {progress.currentFile && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Current:</div>
              <div className="text-muted-foreground bg-muted/50 truncate rounded p-2 font-mono text-xs">
                {progress.currentFile}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1">
              <div className="text-lg font-bold text-green-600">{progress.success}</div>
              <div className="text-muted-foreground text-xs">Success</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-red-600">{progress.failed}</div>
              <div className="text-muted-foreground text-xs">Failed</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-orange-600">{progress.skipped}</div>
              <div className="text-muted-foreground text-xs">Skipped</div>
            </div>
          </div>
        </div>
      )
    }

    // 3. Completed State - Show results and allow close
    const totalProcessed = progress.success + progress.failed + progress.skipped
    const wasSuccessful = progress.success > 0
    const hasErrors = progress.failed > 0

    return (
      <div className="space-y-4">
        {/* Results Header */}
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                isCancelled
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : wasSuccessful && !hasErrors
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : hasErrors
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-gray-100 dark:bg-gray-900/30',
              )}
            >
              {isCancelled ? (
                <XCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              ) : wasSuccessful && !hasErrors ? (
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : hasErrors ? (
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <SkipForward className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              )}
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold">
              {isCancelled
                ? 'Move Cancelled'
                : wasSuccessful && !hasErrors
                  ? 'Move Completed'
                  : hasErrors
                    ? 'Move Partially Completed'
                    : 'No Items Moved'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {totalProcessed} of {selectedItems.length} items processed
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-green-600">{progress.success}</div>
            <div className="text-muted-foreground text-xs">Moved</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-red-600">{progress.failed}</div>
            <div className="text-muted-foreground text-xs">Failed</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-blue-600">{progress.current}</div>
            <div className="text-muted-foreground text-xs">Processed</div>
          </div>
        </div>

        {/* Error Details */}
        {progress.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600">Errors:</h4>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {progress.errors.map((error, index) => (
                <div
                  key={`error-${error.file}-${index}`}
                  className="rounded border border-red-200 bg-red-50 p-2 text-xs dark:border-red-800 dark:bg-red-900/20"
                >
                  <div className="font-medium">{error.file}</div>
                  <div className="text-red-600 dark:text-red-400">{error.error}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Notice */}
        {(progress.success > 0 || progress.failed > 0) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Click the button below to refresh and see your updated files.
            </p>
          </div>
        )}
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <BottomSheet open={isOpen} onOpenChange={onClose}>
          <BottomSheetContent className="max-h-[90vh]">
            <BottomSheetHeader className="pb-4">
              <BottomSheetTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Move className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Move Items</div>
                  <div className="text-muted-foreground text-sm font-normal">Move operation</div>
                </div>
              </BottomSheetTitle>
            </BottomSheetHeader>

            <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

            <BottomSheetFooter className={cn('grid gap-4')}>
              {!isProcessing && !isCompleted && (
                <>
                  <Button onClick={handleMove} className={cn('touch-target min-h-[44px] active:scale-95')}>
                    <Move className="mr-2 h-4 w-4" />
                    Move to {selectedFolderName}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className={cn('touch-target min-h-[44px] active:scale-95')}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {isProcessing && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className={cn('touch-target min-h-[44px] active:scale-95')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Move
                </Button>
              )}
              {isCompleted && (
                <>
                  {progress.success > 0 || progress.failed > 0 ? (
                    <Button onClick={handleCloseAndRefresh} className={cn('touch-target min-h-[44px] active:scale-95')}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Refresh Now
                    </Button>
                  ) : (
                    <Button onClick={handleClose} className={cn('touch-target min-h-[44px] active:scale-95')}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                  )}
                  {(progress.success > 0 || progress.failed > 0) && (
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      className={cn('touch-target min-h-[44px] active:scale-95')}
                    >
                      Close Without Refresh
                    </Button>
                  )}
                </>
              )}
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
                    Select where to move {selectedItems.length} item
                    {selectedItems.length > 1 ? 's' : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DriveDestinationSelector
              onSelect={handleDestinationSelect}
              selectedFolderId={selectedFolderId}
              className="py-4"
            />

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <div className="flex-1 text-left">
                <div className="text-muted-foreground text-sm">
                  Selected: <span className="text-foreground font-medium">{selectedFolderName}</span>
                </div>
              </div>
              <Button onClick={handleConfirmDestinationAndMove} className="w-full sm:w-auto">
                <Move className="mr-2 h-4 w-4" />
                Confirm & Move
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
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Move className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Move Items</div>
                <div className="text-muted-foreground text-sm font-normal">Move operation</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">{renderContent()}</div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {!isProcessing && !isCompleted && (
              <>
                <Button
                  onClick={handleMove}
                  className="w-full text-xs sm:w-auto sm:max-w-[200px]"
                  title={`Move to ${selectedFolderName}`}
                >
                  <Move className="mr-1 h-3 w-3" />
                  <span className="truncate">
                    Move to{' '}
                    {selectedFolderName.length > 12 ? `${selectedFolderName.substring(0, 12)}...` : selectedFolderName}
                  </span>
                </Button>
                <Button variant="outline" onClick={handleClose} className="w-full text-xs sm:w-auto">
                  Cancel
                </Button>
              </>
            )}
            {isProcessing && (
              <Button onClick={handleCancel} variant="outline" className="w-full sm:w-auto">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Move
              </Button>
            )}
            {isCompleted && (
              <>
                {progress.success > 0 || progress.failed > 0 ? (
                  <Button onClick={handleCloseAndRefresh} className="w-full sm:w-auto">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Refresh Now
                  </Button>
                ) : (
                  <Button onClick={handleClose} className="w-full sm:w-auto">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Close
                  </Button>
                )}
                {(progress.success > 0 || progress.failed > 0) && (
                  <Button onClick={handleClose} variant="outline" className="w-full sm:w-auto">
                    Close Without Refresh
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destination Selector Dialog */}
      <Dialog open={showDestinationSelector} onOpenChange={setShowDestinationSelector}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBackToMainDialog} className="h-8 w-8 p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle>Choose Move Destination</DialogTitle>
                <DialogDescription>
                  Select where to move {selectedItems.length} item
                  {selectedItems.length > 1 ? 's' : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 py-2">
            <DriveDestinationSelector
              onSelect={handleDestinationSelect}
              selectedFolderId={selectedFolderId}
              className="h-full"
            />
          </div>

          <DialogFooter className="flex-shrink-0 flex-col gap-2 border-t pt-4 sm:flex-row">
            <div className="flex-1 text-left">
              <div className="text-muted-foreground text-sm">
                Selected: <span className="text-foreground font-medium">{selectedFolderName}</span>
              </div>
            </div>
            <Button onClick={handleConfirmDestinationAndMove} className="w-full sm:w-auto">
              <Move className="mr-2 h-4 w-4" />
              Confirm & Move
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
