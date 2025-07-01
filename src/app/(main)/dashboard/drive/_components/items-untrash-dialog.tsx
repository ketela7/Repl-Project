'use client'

import { useState, useRef } from 'react'
import { RotateCcw, Loader2, CheckCircle, XCircle, AlertTriangle, SkipForward } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { successToast, errorToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ItemsUntrashDialogProps {
  isOpen: boolean
  onClose: () => void
  _onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
  }>
}

function ItemsUntrashDialog({
  isOpen,
  onClose,
  _onConfirm,
  selectedItems,
}: ItemsUntrashDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
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

  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter(item => !item.isFolder).length
  const folderCount = selectedItems.filter(item => item.isFolder).length

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setIsCompleted(true)

    toast.info('Untrash operation cancelled by user')
  }

  const handleUntrash = async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for untrashing')
      return
    }

    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setIsCompleted(false)

    abortControllerRef.current = new AbortController()

    try {
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

      for (let i = 0; i < selectedItems.length; i++) {
        if (isCancelledRef.current) {
          toast.info(`Untrash cancelled after ${successCount} items`)
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

          if (isCancelledRef.current) {
            break
          }

          const response = await fetch('/api/drive/files/untrash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{ id: item.id }],
            }),
            signal: abortControllerRef.current?.signal,
          })

          if (abortControllerRef.current?.signal.aborted) {
            break
          }

          const result = await response.json()

          if (result.success) {
            successCount++
          } else {
            throw new Error(result.error || 'Failed to restore item')
          }

          if (!isCancelledRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error: any) {
          if (abortControllerRef.current?.signal.aborted) {
            break
          }

          failedCount++
          errors.push({
            file: item.name,
            error: error.message || 'Restore failed',
          })
        }

        setProgress(prev => ({
          ...prev,
          success: successCount,
          failed: failedCount,
          errors,
        }))

        if (isCancelledRef.current) {
          break
        }
      }

      if (!isCancelledRef.current) {
        if (successCount > 0) {
          successToast.generic(
            `Untrashed ${successCount} item${successCount > 1 ? 's' : ''} from trash`,
          )
        }
        if (failedCount > 0) {
          errorToast.generic(`Failed to untrash ${failedCount} item${failedCount > 1 ? 's' : ''}`)
        }
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      // // // // // console.error(err)
      errorToast.generic('Untrash operation failed')
    } finally {
      abortControllerRef.current = null
      setIsProcessing(false)
      setIsCompleted(true)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setIsCompleted(false)
      setIsCancelled(false)
      isCancelledRef.current = false
      abortControllerRef.current = null
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

  // Render different content based on state
  const renderContent = () => {
    // 1. Initial State - Show confirmation and items preview
    if (!isProcessing && !isCompleted) {
      return (
        <div className="space-y-4">
          {/* Header Info */}
          <div className="space-y-2 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <RotateCcw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Untrash Items</h3>
              <p className="text-muted-foreground text-sm">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} will be restored
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
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              >
                {folderCount} folder{folderCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Items Preview */}
          {selectedItems.length <= 5 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Items to restore:</h4>
              <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                <ul className="space-y-1 text-sm">
                  {selectedItems.map(item => (
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
              <h4 className="text-sm font-medium">Preview (first 3 items):</h4>
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                <ul className="space-y-1 text-sm">
                  {selectedItems.slice(0, 3).map(item => (
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
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Items will be restored to their original location in Google Drive.
            </div>
          </div>
        </div>
      )
    }

    // 2. Processing State - Show progress with cancellation
    if (isProcessing) {
      const progressPercentage =
        progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

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
              <h3 className="text-base font-semibold">Restoring Items...</h3>
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

    // 3. Completed State - Show results
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
                ? 'Untrash Cancelled'
                : wasSuccessful && !hasErrors
                  ? 'Items Untrashed'
                  : hasErrors
                    ? 'Partially Untrashed'
                    : 'No Items Untrashed'}
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
            <div className="text-muted-foreground text-xs">Untrashed</div>
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
      <BottomSheet open={isOpen} onOpenChange={handleClose}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Untrash Items</div>
                <div className="text-muted-foreground text-sm font-normal">Untrash operation</div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            {!isProcessing && !isCompleted && (
              <>
                <Button
                  onClick={handleUntrash}
                  className={`${cn('touch-target min-h-[44px] active:scale-95')} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800`}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Untrash Items
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
                Cancel Operation
              </Button>
            )}
            {isCompleted && (
              <>
                {progress.success > 0 || progress.failed > 0 ? (
                  <Button
                    onClick={handleCloseAndRefresh}
                    className={cn('touch-target min-h-[44px] active:scale-95')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Refresh Now
                  </Button>
                ) : (
                  <Button
                    onClick={handleClose}
                    className={cn('touch-target min-h-[44px] active:scale-95')}
                  >
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
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Untrash Items</div>
              <div className="text-muted-foreground text-sm font-normal">Untrash operation</div>
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 px-1">{renderContent()}</div>

        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
          {!isProcessing && !isCompleted && (
            <>
              <AlertDialogAction
                onClick={handleUntrash}
                className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 sm:w-auto dark:bg-green-700 dark:hover:bg-green-800"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Untrash Items
              </AlertDialogAction>
              <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            </>
          )}
          {isProcessing && (
            <Button onClick={handleCancel} variant="outline" className="w-full sm:w-auto">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Operation
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ItemsUntrashDialog }
export default ItemsUntrashDialog
