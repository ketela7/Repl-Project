'use client'

import { useState, useRef } from 'react'
import {
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  SkipForward,
  ArrowRight,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Folder,
  Shield,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react'
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
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn, calculateProgress } from '@/lib/utils'

interface ItemsDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
    canDelete: boolean
  }>
}

function getFileIcon(mimeType: string | undefined, isFolder: boolean) {
  if (isFolder) return <Folder className="h-4 w-4 text-blue-600" />
  if (!mimeType) return <File className="h-4 w-4 text-gray-600" />

  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-green-600" />
  if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-purple-600" />
  if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4 text-orange-600" />
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive'))
    return <Archive className="h-4 w-4 text-yellow-600" />

  return <FileText className="h-4 w-4 text-gray-600" />
}

function ItemsDeleteDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsDeleteDialogProps) {
  const [currentStep, setCurrentStep] = useState<
    'warning' | 'confirmation' | 'processing' | 'completed'
  >('warning')
  const [confirmationText, setConfirmationText] = useState('')
  const [acknowledgeWarning, setAcknowledgeWarning] = useState(false)
  const [isItemsExpanded, setIsItemsExpanded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
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

  // Filter items that can be deleted
  const canDeleteItems = selectedItems.filter(item => item.canDelete)
  const fileCount = canDeleteItems.filter(item => !item.isFolder).length
  const folderCount = canDeleteItems.filter(item => item.isFolder).length
  const isConfirmationValid = confirmationText.trim() === 'CONFIRM DELETE' && acknowledgeWarning

  const handleClose = () => {
    if (isProcessing) {
      handleCancel()
    }
    setCurrentStep('warning')
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

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setCurrentStep('completed')
    toast.info('Delete operation cancelled')
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
    setCurrentStep('processing')

    abortControllerRef.current = new AbortController()

    const totalItems = canDeleteItems.length
    const skippedCount = selectedItems.length - canDeleteItems.length
    setProgress({
      current: 0,
      total: totalItems,
      success: 0,
      skipped: skippedCount,
      failed: 0,
      errors: [],
    })

    let successCount = 0
    let failedCount = 0
    const errors: Array<{ file: string; error: string }> = []

    try {
      for (let i = 0; i < canDeleteItems.length; i++) {
        if (isCancelledRef.current) {
          break
        }

        const item = canDeleteItems[i]
        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFile: item.name,
        }))

        try {
          const response = await fetch(`/api/drive/files/${item.id}`, {
            method: 'DELETE',
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Delete failed')
          }

          successCount++
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            break
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ file: item.name, error: errorMessage })
          failedCount++
        }

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    } catch (error) {
      console.error('Delete operation failed:', error)
    } finally {
      setProgress(prev => ({
        ...prev,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        errors,
      }))

      setIsProcessing(false)
      setCurrentStep('completed')

      if (isCancelledRef.current) {
        toast.info('Delete operation cancelled')
      } else if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} item(s) permanently`)
        onConfirm?.()
      } else {
        toast.error('Delete operation failed')
      }
    }
  }

  const renderStepIndicator = () => {
    // Simple "Status: Indicator" format
    const getStatusDisplay = () => {
      switch (currentStep) {
        case 'warning':
          return {
            status: 'Warning',
            icon: AlertOctagon,
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-950/20',
          }
        case 'confirmation':
          return {
            status: 'Confirmation',
            icon: Shield,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          }
        case 'processing':
          return {
            status: 'Processing',
            icon: Loader2,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          }
        case 'completed':
          return {
            status: 'Completed',
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
          }
        default:
          return {
            status: 'Warning',
            icon: AlertOctagon,
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-950/20',
          }
      }
    }

    const { status, icon: Icon, color, bgColor } = getStatusDisplay()

    return (
      <div className={cn('mb-4 rounded-lg border p-3', bgColor)}>
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              color,
              currentStep === 'processing' && 'animate-spin',
            )}
          />
          <span className="text-sm font-medium">
            Status: <span className={color}>{status}</span>
          </span>
        </div>
      </div>
    )
  }

  const renderWarningStep = () => (
    <div className="space-y-4">
      <Collapsible open={isItemsExpanded} onOpenChange={setIsItemsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="hover:bg-muted/50 w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isItemsExpanded ? 'Hide Selected Items' : 'Show Selected Items'}
              </span>
              <div className="flex gap-2">
                {folderCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Folder className="h-3 w-3" />
                    {folderCount}
                  </Badge>
                )}
                {fileCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {fileCount}
                  </Badge>
                )}
                <Badge variant="outline">{selectedItems.length} total</Badge>
              </div>
            </div>
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isItemsExpanded && 'rotate-90',
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="bg-muted/5 max-h-64 overflow-y-auto rounded-lg border p-2">
            <div className="space-y-2">
              {selectedItems.map(item => (
                <div
                  key={item.id}
                  className="bg-muted/20 hover:bg-muted/40 flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors"
                >
                  {item.isFolder ? (
                    <Folder className="h-4 w-4 flex-shrink-0 text-blue-600" />
                  ) : (
                    <FileText className="h-4 w-4 flex-shrink-0 text-gray-600" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
        <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="h-4 w-4" />
            <span>This action cannot be undone</span>
          </div>
          <div>• Files will be permanently deleted from Google Drive</div>
          <div>• Items will not be moved to trash</div>
          <div>• Recovery will be impossible</div>
          <div>• Shared access will be immediately revoked</div>
        </div>
      </div>
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trash2 className="h-5 w-5 text-red-600" />
        <h3 className="font-semibold">Confirm Permanent Deletion</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="acknowledge"
            checked={acknowledgeWarning}
            onCheckedChange={checked => setAcknowledgeWarning(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acknowledge"
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand this action is permanent and cannot be undone
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmation" className="text-sm font-medium">
            Type "CONFIRM DELETE" to proceed
          </Label>
          <Input
            id="confirmation"
            placeholder="CONFIRM DELETE"
            value={confirmationText}
            onChange={e => setConfirmationText(e.target.value)}
            className={cn(
              'font-mono',
              confirmationText.trim() === 'CONFIRM DELETE' &&
                'border-green-600 bg-green-50 dark:bg-green-950/20',
            )}
          />
        </div>

        <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20">
          <div className="text-sm text-amber-700 dark:text-amber-300">
            Deleting {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} permanently
          </div>
        </div>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-red-600" />
        <h3 className="font-semibold">Deleting Items Permanently</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span>
            {progress.current} of {progress.total}
          </span>
        </div>

        <Progress value={calculateProgress(progress.current, progress.total)} className="h-2" />

        {progress.currentFile && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ArrowRight className="h-4 w-4" />
            <span className="truncate">Deleting: {progress.currentFile}</span>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{progress.success} deleted</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{progress.failed} failed</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-600">
            <SkipForward className="h-4 w-4" />
            <span>{progress.skipped} skipped</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCompletedStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold">
          {isCancelled ? 'Deletion Cancelled' : 'Deletion Complete'}
        </h3>
      </div>

      {!isCancelled && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div>✓ Permanently deleted {progress.success} item(s)</div>
            <div>✓ Items removed from Google Drive</div>
            <div>✓ Recovery is not possible</div>
          </div>
        </div>
      )}

      {progress.failed > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600">
            Failed to delete {progress.failed} item(s):
          </div>
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {progress.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600">
                  • {error.file}: {error.error}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    return (
      <>
        {renderStepIndicator()}
        {(() => {
          switch (currentStep) {
            case 'warning':
              return renderWarningStep()
            case 'confirmation':
              return renderConfirmationStep()
            case 'processing':
              return renderProcessingStep()
            case 'completed':
              return renderCompletedStep()
            default:
              return null
          }
        })()}
      </>
    )
  }

  const renderFooter = () => {
    switch (currentStep) {
      case 'warning':
        return (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setCurrentStep('confirmation')}>
              Continue
            </Button>
          </>
        )
      case 'confirmation':
        return (
          <>
            <Button variant="outline" onClick={() => setCurrentStep('warning')}>
              Back
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!isConfirmationValid}>
              Delete Permanently
            </Button>
          </>
        )
      case 'processing':
        return (
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )
      case 'completed':
        return <Button onClick={handleClose}>{isCancelled ? 'Close' : 'Done'}</Button>
      default:
        return null
    }
  }

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={open => !open && handleClose()}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle className="text-red-600">Delete Items Permanently</BottomSheetTitle>
            <BottomSheetDescription>
              Permanently remove selected items from Google Drive. This action cannot be undone.
            </BottomSheetDescription>
          </BottomSheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-2">{renderContent()}</div>

          <BottomSheetFooter>
            <div className="flex gap-2">{renderFooter()}</div>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Items Permanently</DialogTitle>
          <DialogDescription>
            Permanently remove selected items from Google Drive. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsDeleteDialog
export { ItemsDeleteDialog }
