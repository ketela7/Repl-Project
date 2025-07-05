'use client'

import { useState, useRef } from 'react'
import {
  Copy,
  Loader2,
  Folder,
  FolderOpen,
  CheckCircle,
  XCircle,
  SkipForward,
  Home,
  ArrowRight,
  FileText,
  Files,
  ChevronRight,
} from 'lucide-react'
// // import { toast } from 'sonner' // Removed toast notifications // Removed toast notifications

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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { DriveDestinationSelector } from '@/components/drive-destination-selector'
import { cn, calculateProgress } from '@/lib/utils'

interface ItemsCopyDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
    canCopy: boolean
  }>
}

function ItemsCopyDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsCopyDialogProps) {
  const [currentStep, setCurrentStep] = useState<
    'selection' | 'destination' | 'processing' | 'completed'
  >('selection')
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root')
  const [selectedFolderName, setSelectedFolderName] = useState<string>('My Drive')
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

  const [isItemsExpanded, setIsItemsExpanded] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  const canCopyItems = selectedItems.filter(item => item.canCopy)
  const fileCount = canCopyItems.filter(item => !item.isFolder).length
  const folderCount = canCopyItems.filter(item => item.isFolder).length
  const totalItems = canCopyItems.length
  const handleClose = () => {
    if (isProcessing) {
      handleCancel()
    }

    // If we're in completed step and had successful operations, refresh data
    if (currentStep === 'completed' && progress.success > 0) {
      onConfirm?.()
    }

    setCurrentStep('selection')
    setSelectedFolderId('root')
    setSelectedFolderName('My Drive')
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
    // Removed toast notification
  }

  const handleDestinationSelect = (folderId: string, folderName?: string) => {
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName || 'My Drive')
  }

  const handleCopy = async () => {
    if (canCopyItems.length === 0) {
      // Removed toast notification
      return
    }

    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setCurrentStep('processing')

    abortControllerRef.current = new AbortController()

    setProgress({
      current: 0,
      total: totalItems,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    })

    let successCount = 0
    let failedCount = 0
    const skippedCount = selectedItems.length - canCopyItems.length
    const errors: Array<{ file: string; error: string }> = []

    try {
      for (let i = 0; i < canCopyItems.length; i++) {
        if (isCancelledRef.current) {
          break
        }

        const item = canCopyItems[i]
        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFile: item.name,
        }))

        try {
          const response = await fetch('/api/drive/files/copy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: item.id,
              targetFolderId: selectedFolderId,
              namePrefix: 'Copy of ',
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Copy failed')
          }

          successCount++

          // Update progress after success
          setProgress(prev => ({
            ...prev,
            success: successCount,
            failed: failedCount,
            errors: [...errors],
          }))
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            break
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ file: item.name, error: errorMessage })
          failedCount++

          // Update progress after failure
          setProgress(prev => ({
            ...prev,
            success: successCount,
            failed: failedCount,
            errors: [...errors],
          }))
        }

        // Small delay to prevent overwhelming the API and show progress
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('Copy operation failed:', error)
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
        // Removed toast notification
      } else if (successCount > 0) {
        // Removed toast notification`)
      } else {
        // Removed toast notification
      }
    }
  }

  const renderStepIndicator = () => {
    // Simple "Status: Indicator" format
    const getStatusDisplay = () => {
      switch (currentStep) {
        case 'selection':
          return {
            status: 'Selection',
            icon: Files,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
          }
        case 'destination':
          return {
            status: 'Destination',
            icon: FolderOpen,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/20',
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
            status: 'Selection',
            icon: Files,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
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

  const renderSelectionStep = () => (
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
                <Badge variant="outline">{totalItems} total</Badge>
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
              {canCopyItems.map(item => (
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
      <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <Copy className="h-4 w-4" />
          <span>Files will be named "Copy of [original name]"</span>
        </div>
      </div>
    </div>
  )

  const renderDestinationStep = () => (
    <div className="space-y-4">
      <div className="rounded-lg border bg-amber-50 p-4 dark:bg-amber-950/20">
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <Home className="h-4 w-4" />
          <span>Copy destination: {selectedFolderName}</span>
        </div>
      </div>

      <DriveDestinationSelector
        onSelect={handleDestinationSelect}
        selectedFolderId={selectedFolderId}
        className="border-0 p-0"
      />
    </div>
  )

  const renderProcessingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-green-600" />
        <h3 className="font-semibold">Copying Items</h3>
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
            <span className="truncate">Copying: {progress.currentFile}</span>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{progress.success} success</span>
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
        <h3 className="font-semibold">{isCancelled ? 'Copy Cancelled' : 'Copy Complete'}</h3>
      </div>

      {!isCancelled && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div>✓ Successfully copied {progress.success} item(s)</div>
            <div>✓ Destination: {selectedFolderName}</div>
            <div>✓ Files prefixed with "Copy of"</div>
          </div>
        </div>
      )}

      {progress.failed > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600">
            Failed to copy {progress.failed} item(s):
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
            case 'selection':
              return renderSelectionStep()
            case 'destination':
              return renderDestinationStep()
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
      case 'selection':
        return (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={() => setCurrentStep('destination')}>Select Destination</Button>
          </>
        )
      case 'destination':
        return (
          <>
            <Button variant="outline" onClick={() => setCurrentStep('selection')}>
              Back
            </Button>
            <Button onClick={handleCopy} disabled={!selectedFolderId}>
              Copy Items
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
            <BottomSheetTitle>Copy Items</BottomSheetTitle>
            <BottomSheetDescription>
              Create copies of selected items in a different location
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
          <DialogTitle>Copy Items</DialogTitle>
          <DialogDescription>
            Create copies of selected items in a different location
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsCopyDialog
export { ItemsCopyDialog }
