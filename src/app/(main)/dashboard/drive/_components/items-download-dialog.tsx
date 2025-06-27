'use client'

import { useState } from 'react'
import { Download, FileText, AlertTriangle, CheckCircle, XCircle, SkipForward } from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'

interface ItemsDownloadDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (downloadMode: string, progressCallback?: (progress: any) => void) => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
    size?: string
  }>
}

const DOWNLOAD_MODES = [
  {
    id: 'oneByOne',
    label: 'One by One Download',
    description: 'Download files individually with separate browser downloads',
    icon: Download,
  },
  {
    id: 'batch',
    label: 'Batch Download',
    description: 'Download multiple files simultaneously',
    icon: Download,
  },
  {
    id: 'exportLinks',
    label: 'Export Download Links',
    description: 'Generate CSV file with download links',
    icon: FileText,
  },
]

function ItemsDownloadDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsDownloadDialogProps) {
  const [selectedMode, setSelectedMode] = useState('oneByOne')
  const [isProcessing, setIsProcessing] = useState(false)
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

  const isMobile = useIsMobile()

  // Filter downloadable files (only files, skip folders)
  const downloadableFiles = selectedItems.filter((item) => !item.isFolder)
  const skippedFolders = selectedItems.filter((item) => item.isFolder)

  const handleConfirm = async () => {
    if (downloadableFiles.length === 0) {
      toast.error('No files available for download')
      return
    }

    setIsProcessing(true)
    setProgress({
      current: 0,
      total: downloadableFiles.length,
      success: 0,
      skipped: skippedFolders.length, // Folders are auto-skipped
      failed: 0,
      errors: [],
    })

    // Progress callback to update UI
    const progressCallback = (progressData: any) => {
      setProgress((prev) => ({
        ...prev,
        current: progressData.current || prev.current,
        total: progressData.total || prev.total,
        currentFile: progressData.currentOperation || prev.currentFile,
        success: progressData.success || prev.success,
        failed: progressData.failed || prev.failed,
      }))
    }

    try {
      await onConfirm(selectedMode, progressCallback)

      // Update final progress
      setProgress((prev) => ({
        ...prev,
        current: prev.total,
        success: downloadableFiles.length,
        currentFile: undefined,
      }))

      toast.success(`Downloaded ${downloadableFiles.length} files successfully`)
    } catch (error) {
      toast.error('Download operation failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setProgress({
        current: 0,
        total: 0,
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      })
    }
  }

  const selectedModeData = DOWNLOAD_MODES.find((mode) => mode.id === selectedMode)

  const DialogComponent = isMobile ? BottomSheet : Dialog
  const DialogContentComponent = isMobile ? BottomSheetContent : DialogContent
  const DialogHeaderComponent = isMobile ? BottomSheetHeader : DialogHeader
  const DialogTitleComponent = isMobile ? BottomSheetTitle : DialogTitle
  const DialogFooterComponent = isMobile ? BottomSheetFooter : DialogFooter

  return (
    <DialogComponent open={isOpen} onOpenChange={handleClose}>
      <DialogContentComponent className="sm:max-w-[600px]">
        <DialogHeaderComponent>
          <DialogTitleComponent className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Download className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Download Files</h3>
              <p className="text-muted-foreground text-sm">Choose how you want to download the selected files</p>
            </div>
          </DialogTitleComponent>
        </DialogHeaderComponent>

        <div className="space-y-6">
          {/* File Summary */}
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Selected Items:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {downloadableFiles.length} files
                </Badge>
                {skippedFolders.length > 0 && (
                  <Badge variant="outline" className="text-orange-600">
                    {skippedFolders.length} folders (will be skipped)
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Download Mode Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Download Mode</Label>
            <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="space-y-3">
              {DOWNLOAD_MODES.map((mode) => {
                const IconComponent = mode.icon
                return (
                  <div
                    key={mode.id}
                    className={cn(
                      'flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-colors',
                      selectedMode === mode.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedMode(mode.id)}
                  >
                    <RadioGroupItem value={mode.id} className="mt-1" />
                    <div className="flex flex-1 items-start gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <IconComponent className="text-primary h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{mode.label}</div>
                        <div className="text-muted-foreground text-sm">{mode.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Folders Warning */}
          {skippedFolders.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
                <div className="space-y-1">
                  <div className="font-medium text-orange-800 dark:text-orange-200">Folders will be skipped</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    {skippedFolders.length} folder{skippedFolders.length > 1 ? 's' : ''} cannot be downloaded and will
                    be automatically skipped
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {progress.current} of {progress.total} files
                  </span>
                </div>
                <Progress value={(progress.current / progress.total) * 100} className="h-2" />
                {progress.currentFile && (
                  <div className="text-muted-foreground text-xs">Processing: {progress.currentFile}</div>
                )}
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">{progress.success}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">Success</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <SkipForward className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">{progress.skipped}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">Skipped</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">{progress.failed}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">Failed</div>
                </div>
              </div>

              {/* Error Details */}
              {progress.errors.length > 0 && (
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {progress.errors.map((error, index) => (
                    <div key={index} className="rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/50">
                      <span className="font-medium">{error.file}:</span> {error.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File Preview */}
          {downloadableFiles.length > 0 && !isProcessing && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Files to download:</Label>
              <div className="bg-muted/30 max-h-32 space-y-1 overflow-y-auto rounded-lg border p-3">
                {downloadableFiles.slice(0, 5).map((file) => (
                  <div key={file.id} className="text-muted-foreground text-sm">
                    {file.name}
                    {file.size && <span className="ml-2 text-xs">({file.size})</span>}
                  </div>
                ))}
                {downloadableFiles.length > 5 && (
                  <div className="text-muted-foreground text-xs">... and {downloadableFiles.length - 5} more files</div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooterComponent className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Cancel'}
          </Button>
          <Button onClick={handleConfirm} disabled={downloadableFiles.length === 0 || isProcessing} className="gap-2">
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Start Download
              </>
            )}
          </Button>
        </DialogFooterComponent>
      </DialogContentComponent>
    </DialogComponent>
  )
}

export default ItemsDownloadDialog
