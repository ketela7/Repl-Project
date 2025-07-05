'use client'

import { useState, useRef } from 'react'
import {
  Move,
  Loader2,
  Folder,
  FolderOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  SkipForward,
  Home,
  ArrowRight,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
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
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { DriveDestinationSelector } from '@/components/drive-destination-selector'
import { cn, calculateProgress } from '@/lib/utils'

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

function ItemsMoveDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsMoveDialogProps) {
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

  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter(item => !item.isFolder).length
  const folderCount = selectedItems.filter(item => item.isFolder).length

  const handleClose = () => {
    if (isProcessing) {
      handleCancel()
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
    toast.info('Move operation cancelled')
  }

  const handleDestinationSelect = (folderId: string, folderName?: string) => {
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName || 'My Drive')
  }

  const handleMove = async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for moving')
      return
    }

    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setCurrentStep('processing')

    abortControllerRef.current = new AbortController()

    const totalItems = selectedItems.length
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
    let skippedCount = 0
    const errors: Array<{ file: string; error: string }> = []

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        if (isCancelledRef.current) {
          break
        }

        const item = selectedItems[i]
        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFile: item.name,
        }))

        try {
          const response = await fetch('/api/drive/move', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: item.id,
              destinationId: selectedFolderId,
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Move failed')
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
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Move operation failed:', error)
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
        toast.info('Move operation cancelled')
      } else if (successCount > 0) {
        toast.success(`Successfully moved ${successCount} item(s)`)
        onConfirm()
      } else {
        toast.error('Move operation failed')
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
            icon: Move,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
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
            icon: Move,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
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
      <div className="flex items-center gap-2">
        <Move className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Move Items</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Selected Items</span>
          <div className="flex gap-2">
            {folderCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Folder className="h-3 w-3" />
                {folderCount} folder{folderCount > 1 ? 's' : ''}
              </Badge>
            )}
            {fileCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {fileCount} file{fileCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-48">
          <div className="space-y-2">
            {selectedItems.slice(0, 10).map(item => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                {getFileIcon(item.mimeType, item.isFolder)}
                <span className="truncate">{item.name}</span>
              </div>
            ))}
            {selectedItems.length > 10 && (
              <div className="text-muted-foreground text-center text-sm">
                +{selectedItems.length - 10} more items
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )

  const renderDestinationStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Select Destination</h3>
      </div>

      <div className="rounded-lg border bg-amber-50 p-4 dark:bg-amber-950/20">
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <Home className="h-4 w-4" />
          <span>Current destination: {selectedFolderName}</span>
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
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <h3 className="font-semibold">Moving Items</h3>
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
            <span className="truncate">Moving: {progress.currentFile}</span>
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
        <h3 className="font-semibold">{isCancelled ? 'Move Cancelled' : 'Move Complete'}</h3>
      </div>

      {!isCancelled && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div>✓ Successfully moved {progress.success} item(s)</div>
            <div>✓ Destination: {selectedFolderName}</div>
          </div>
        </div>
      )}

      {progress.failed > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600">
            Failed to move {progress.failed} item(s):
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
            <Button onClick={handleMove} disabled={!selectedFolderId}>
              Move Items
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
            <BottomSheetTitle>Move Items</BottomSheetTitle>
            <BottomSheetDescription>
              Move selected items to a different location in your Google Drive
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
          <DialogTitle>Move Items</DialogTitle>
          <DialogDescription>
            Move selected items to a different location in your Google Drive
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsMoveDialog
export { ItemsMoveDialog }
