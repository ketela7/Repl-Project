'use client'

import { useState, useRef } from 'react'
import { Trash2, Loader2, CheckCircle, XCircle, AlertTriangle, SkipForward } from 'lucide-react'
import { toast } from 'sonner'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface ItemsDeleteDialogProps {
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

function ItemsDeleteDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsDeleteDialogProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const [acknowledgeWarning, setAcknowledgeWarning] = useState(false)
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

  const fileCount = selectedItems.filter((item) => !item.isFolder).length
  const folderCount = selectedItems.filter((item) => item.isFolder).length

  const isConfirmationValid = confirmationText.trim() === 'CONFIRM DELETE' && acknowledgeWarning

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setIsCompleted(true)

    toast.info('Delete operation cancelled by user')
  }

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      toast.error('Please confirm the deletion')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('No items selected for deletion')
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
          toast.info(`Delete cancelled after ${successCount} items`)
          break
        }

        const item = selectedItems[i]

        try {
          setProgress((prev) => ({
            ...prev,
            current: i + 1,
            currentFile: item.name,
          }))

          if (isCancelledRef.current) {
            break
          }

          const response = await fetch('/api/drive/files/delete', {
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
            throw new Error(result.error || 'Failed to delete item')
          }

          if (!isCancelledRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        } catch (error: any) {
          if (abortControllerRef.current?.signal.aborted) {
            break
          }

          failedCount++
          errors.push({
            file: item.name,
            error: error.message || 'Delete failed',
          })
        }

        setProgress((prev) => ({
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
          toast.success(`Permanently deleted ${successCount} item${successCount > 1 ? 's' : ''}`)
          onConfirm()
        }
        if (failedCount > 0) {
          toast.error(`Failed to delete ${failedCount} item${failedCount > 1 ? 's' : ''}`)
        }
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      console.error(err)
      toast.error('Delete operation failed')
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
      setConfirmationText('')
      setAcknowledgeWarning(false)
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

  // Render different content based on state
  const renderContent = () => {
    // 1. Initial State - Show confirmation form and items preview
    if (!isProcessing && !isCompleted) {
      return (
        <div className="flex max-h-[60vh] flex-col space-y-4">
          {/* Header Info - Compact */}
          <div className="flex-shrink-0 space-y-2 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-red-600">Delete Permanently</h3>
              <p className="text-muted-foreground text-xs">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} will be permanently deleted
              </p>
            </div>
          </div>

          {/* Stats - Compact */}
          <div className="flex flex-shrink-0 justify-center gap-1">
            {fileCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-xs text-red-800 dark:bg-red-900 dark:text-red-100">
                {fileCount} file{fileCount > 1 ? 's' : ''}
              </Badge>
            )}
            {folderCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-xs text-red-800 dark:bg-red-900 dark:text-red-100">
                {folderCount} folder{folderCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Warning */}
          <div className="flex-shrink-0 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">This action cannot be undone!</p>
                <p>Items will be permanently deleted from Google Drive and cannot be recovered.</p>
              </div>
            </div>
          </div>

          {/* Items Preview - Scrollable */}
          <div className="min-h-0 flex-1 space-y-2">
            <h4 className="text-center text-xs font-medium">Items to delete:</h4>
            <div className="bg-muted/50 flex-1 overflow-y-auto rounded-lg border">
              <div className="space-y-1 p-2">
                {selectedItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="bg-background/50 flex min-w-0 items-center gap-2 rounded-md p-2">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                    <span className="flex-1 truncate font-mono text-xs" title={item.name}>
                      {item.name}
                    </span>
                    <Badge variant="outline" className="flex-shrink-0 px-1 py-0 text-[10px]">
                      {item.isFolder ? 'folder' : 'file'}
                    </Badge>
                  </div>
                ))}
                {selectedItems.length > 5 && <div className="text-muted-foreground py-1 text-center text-xs">... and {selectedItems.length - 5} more items</div>}
              </div>
            </div>
          </div>

          {/* Confirmation Form */}
          <div className="flex-shrink-0 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Type "CONFIRM DELETE" to proceed:</Label>
              <Input value={confirmationText} onChange={(e) => setConfirmationText(e.target.value)} placeholder="CONFIRM DELETE" className="h-8 font-mono text-xs" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="acknowledge" checked={acknowledgeWarning} onCheckedChange={(checked) => setAcknowledgeWarning(!!checked)} className="h-3 w-3" />
              <Label htmlFor="acknowledge" className="text-xs">
                I understand this action is permanent and cannot be undone
              </Label>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Loader2 className="h-6 w-6 animate-spin text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold">Deleting Items...</h3>
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
              <div className="text-muted-foreground bg-muted/50 truncate rounded p-2 font-mono text-xs">{progress.currentFile}</div>
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
                      : 'bg-gray-100 dark:bg-gray-900/30'
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
            <h3 className="text-base font-semibold">{isCancelled ? 'Delete Cancelled' : wasSuccessful && !hasErrors ? 'Items Deleted' : hasErrors ? 'Partially Deleted' : 'No Items Deleted'}</h3>
            <p className="text-muted-foreground text-sm">
              {totalProcessed} of {selectedItems.length} items processed
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-green-600">{progress.success}</div>
            <div className="text-muted-foreground text-xs">Deleted</div>
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
                <div key={index} className="rounded border border-red-200 bg-red-50 p-2 text-xs dark:border-red-800 dark:bg-red-900/20">
                  <div className="font-medium">{error.file}</div>
                  <div className="text-red-600 dark:text-red-400">{error.error}</div>
                </div>
              ))}
            </div>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Delete Items</div>
                <div className="text-muted-foreground text-sm font-normal">Permanent deletion operation</div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            {!isProcessing && !isCompleted && (
              <>
                <Button onClick={handleDelete} disabled={!isConfirmationValid} className={cn('touch-target min-h-[44px] bg-red-600 text-white hover:bg-red-700 active:scale-95')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Items
                </Button>
                <Button variant="outline" onClick={handleClose} className={cn('touch-target min-h-[44px] active:scale-95')}>
                  Cancel
                </Button>
              </>
            )}
            {isProcessing && (
              <Button onClick={handleCancel} variant="outline" className={cn('touch-target min-h-[44px] active:scale-95')}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Delete
              </Button>
            )}
            {isCompleted && (
              <Button onClick={handleClose} className={cn('touch-target min-h-[44px] active:scale-95')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Close
              </Button>
            )}
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Delete Items</div>
              <div className="text-muted-foreground text-sm font-normal">Permanent deletion operation</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">{renderContent()}</div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {!isProcessing && !isCompleted && (
            <>
              <Button
                onClick={handleDelete}
                disabled={!isConfirmationValid}
                className="w-full bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 sm:w-auto dark:bg-red-700 dark:hover:bg-red-800"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Items
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
            </>
          )}
          {isProcessing && (
            <Button onClick={handleCancel} variant="outline" className="w-full sm:w-auto">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Delete
            </Button>
          )}
          {isCompleted && (
            <Button onClick={handleClose} className="w-full sm:w-auto">
              <CheckCircle className="mr-2 h-4 w-4" />
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ItemsDeleteDialog }
export default ItemsDeleteDialog
