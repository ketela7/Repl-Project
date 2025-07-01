'use client'

import { useState, useRef } from 'react'
import {
  FileDown,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  Loader2,
  CheckCircle,
  XCircle,
  SkipForward,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'
// Simple error handling without complex recovery

interface ItemsExportDialogProps {
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

const EXPORT_FORMATS = [
  {
    id: 'pdf',
    label: 'PDF Document',
    icon: FileText,
    description: 'For Docs, Sheets, and Slides',
    supportedTypes: [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
    ],
  },
  {
    id: 'docx',
    label: 'Microsoft Word (.docx)',
    icon: FileText,
    description: 'For Google Docs only',
    supportedTypes: ['application/vnd.google-apps.document'],
  },
  {
    id: 'xlsx',
    label: 'Microsoft Excel (.xlsx)',
    icon: FileSpreadsheet,
    description: 'For Google Sheets only',
    supportedTypes: ['application/vnd.google-apps.spreadsheet'],
  },
  {
    id: 'pptx',
    label: 'Microsoft PowerPoint (.pptx)',
    icon: Presentation,
    description: 'For Google Slides only',
    supportedTypes: ['application/vnd.google-apps.presentation'],
  },
  {
    id: 'odt',
    label: 'OpenDocument Text (.odt)',
    icon: FileText,
    description: 'For Google Docs only',
    supportedTypes: ['application/vnd.google-apps.document'],
  },
  {
    id: 'ods',
    label: 'OpenDocument Spreadsheet (.ods)',
    icon: FileSpreadsheet,
    description: 'For Google Sheets only',
    supportedTypes: ['application/vnd.google-apps.spreadsheet'],
  },
  {
    id: 'png',
    label: 'PNG Image',
    icon: Image,
    description: 'For Google Drawings only',
    supportedTypes: ['application/vnd.google-apps.drawing'],
  },
  {
    id: 'jpeg',
    label: 'JPEG Image',
    icon: Image,
    description: 'For Google Drawings only',
    supportedTypes: ['application/vnd.google-apps.drawing'],
  },
]

function ItemsExportDialog({
  isOpen,
  onClose,
  onConfirm: _onConfirm,
  selectedItems,
}: ItemsExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState('pdf')
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
    results: Array<{ fileName: string; success: boolean; downloadUrl?: string; error?: string }>
  }>({
    current: 0,
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    results: [],
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  // Filter exportable files (Google Workspace files only)
  const exportableFiles = selectedItems.filter(
    item =>
      !item.isFolder &&
      item.mimeType &&
      item.mimeType.startsWith('application/vnd.google-apps.') &&
      !item.mimeType.includes('folder') &&
      !item.mimeType.includes('shortcut'),
  )

  // Get compatible files for selected format
  const selectedFormatData = EXPORT_FORMATS.find(f => f.id === selectedFormat)
  const compatibleFiles = exportableFiles.filter(file =>
    selectedFormatData?.supportedTypes.includes(file.mimeType || ''),
  )
  const incompatibleFiles = exportableFiles.filter(
    file => !selectedFormatData?.supportedTypes.includes(file.mimeType || ''),
  )

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setIsCompleted(true)

    toast.info('Export operation cancelled by user')
  }

  const handleExport = async () => {
    if (compatibleFiles.length === 0) {
      toast.error('No compatible files for export')
      return
    }

    // Reset cancellation flags
    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setIsCompleted(false)

    abortControllerRef.current = new AbortController()

    try {
      setProgress({
        current: 0,
        total: compatibleFiles.length,
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        results: [],
      })

      let successCount = 0
      let failedCount = 0
      const errors: Array<{ file: string; error: string }> = []
      const results: Array<{
        fileName: string
        success: boolean
        downloadUrl?: string
        error?: string
      }> = []

      for (let i = 0; i < compatibleFiles.length; i++) {
        if (isCancelledRef.current) {
          toast.info(`Export cancelled after ${successCount} items`)
          break
        }

        const file = compatibleFiles[i]
        if (!file) continue

        try {
          setProgress(prev => ({
            ...prev,
            current: i + 1,
            currentFile: file.name,
          }))

          if (isCancelledRef.current) {
            break
          }

          const response = await fetch('/api/drive/files/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId: file.id,
              format: selectedFormat,
            }),
            signal: abortControllerRef.current?.signal,
          })

          if (abortControllerRef.current?.signal.aborted) {
            break
          }

          if (response.ok) {
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            // Create download
            const a = document.createElement('a')
            a.href = url
            a.download = getExportFilename(file.name, selectedFormat)
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            successCount++
            results.push({
              fileName: file.name,
              success: true,
              downloadUrl: a.download,
            })
          } else {
            throw new Error(`Export failed: ${response.statusText}`)
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
            file: file.name,
            error: error.message || 'Export failed',
          })
          results.push({
            fileName: file.name,
            success: false,
            error: error.message || 'Export failed',
          })
        }

        setProgress(prev => ({
          ...prev,
          success: successCount,
          failed: failedCount,
          errors,
          results,
        }))

        if (isCancelledRef.current) {
          break
        }
      }

      if (!isCancelledRef.current) {
        if (successCount > 0) {
          toast.success(`Exported ${successCount} file${successCount > 1 ? 's' : ''}`)
        }
        if (failedCount > 0) {
          toast.error(`Failed to export ${failedCount} file${failedCount > 1 ? 's' : ''}`)
        }
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      // // // // // console.error(err)
      toast.error('Export operation failed')
    } finally {
      abortControllerRef.current = null
      setIsProcessing(false)
      setIsCompleted(true)
    }
  }

  const getExportFilename = (filename: string, format: string) => {
    const baseName = filename.replace(/\.[^/.]+$/, '') // Remove existing extension
    return `${baseName}.${format}`
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
        results: [],
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
    // 1. Initial State - Show export options and items preview
    if (!isProcessing && !isCompleted) {
      return (
        <div className="flex max-h-[60vh] flex-col space-y-4">
          {/* Header Info - Compact */}
          <div className="flex-shrink-0 space-y-2 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <FileDown className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Export Files</h3>
              <p className="text-muted-foreground text-xs">
                {compatibleFiles.length} compatible file{compatibleFiles.length > 1 ? 's' : ''} for
                export
              </p>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="flex-shrink-0 space-y-3">
            <ScrollArea className="h-full">
              <Label className="text-xs font-medium">Export Format:</Label>
              <RadioGroup
                value={selectedFormat}
                onValueChange={setSelectedFormat}
                className="space-y-2"
              >
                {EXPORT_FORMATS.map(format => (
                  <div key={format.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={format.id} id={format.id} className="h-3 w-3" />
                    <Label
                      htmlFor={format.id}
                      className="flex cursor-pointer items-center gap-2 text-xs"
                    >
                      <format.icon className="h-3 w-3" />
                      <span>{format.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          </div>

          {/* Compatible Files Preview */}
          <div className="min-h-0 flex-1 space-y-2">
            <h4 className="text-center text-xs font-medium">Compatible files:</h4>
            <div className="bg-muted/50 flex-1 overflow-y-auto rounded-lg border">
              <div className="space-y-1 p-2">
                {compatibleFiles.slice(0, 5).map(file => (
                  <div
                    key={file.id}
                    className="bg-background/50 flex min-w-0 items-center gap-2 rounded-md p-2"
                  >
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                    <span className="flex-1 truncate font-mono text-xs" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                ))}
                {compatibleFiles.length > 5 && (
                  <div className="text-muted-foreground py-1 text-center text-xs">
                    ... and {compatibleFiles.length - 5} more files
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {incompatibleFiles.length > 0 && (
            <div className="flex-shrink-0 text-center">
              <Badge
                variant="secondary"
                className="bg-orange-100 text-xs text-orange-800 dark:bg-orange-900 dark:text-orange-100"
              >
                {incompatibleFiles.length} incompatible file
                {incompatibleFiles.length > 1 ? 's' : ''} will be skipped
              </Badge>
            </div>
          )}
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Loader2 className="h-6 w-6 animate-spin text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold">Exporting Files...</h3>
              <p className="text-muted-foreground text-sm">
                {progress.current} of {progress.total} files
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
              <div className="text-lg font-bold text-blue-600">{progress.current}</div>
              <div className="text-muted-foreground text-xs">Processed</div>
            </div>
          </div>
        </div>
      )
    }

    // 3. Completed State - Show results
    const totalProcessed = progress.success + progress.failed
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
                ? 'Export Cancelled'
                : wasSuccessful && !hasErrors
                  ? 'Files Exported'
                  : hasErrors
                    ? 'Partially Exported'
                    : 'No Files Exported'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {totalProcessed} of {compatibleFiles.length} files processed
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-green-600">{progress.success}</div>
            <div className="text-muted-foreground text-xs">Exported</div>
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
                <FileDown className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Export Files</div>
                <div className="text-muted-foreground text-sm font-normal">
                  Convert and download Google Workspace files
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            {!isProcessing && !isCompleted && (
              <>
                <Button
                  onClick={handleExport}
                  disabled={compatibleFiles.length === 0}
                  className={cn(
                    'touch-target min-h-[44px] bg-green-600 text-white hover:bg-green-700 active:scale-95',
                  )}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Files
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
                Cancel Export
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <FileDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Export Files</div>
              <div className="text-muted-foreground text-sm font-normal">
                Convert and download Google Workspace files
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">{renderContent()}</div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {!isProcessing && !isCompleted && (
            <>
              <Button
                onClick={handleExport}
                disabled={compatibleFiles.length === 0}
                className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 sm:w-auto dark:bg-green-700 dark:hover:bg-green-800"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export Files
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
            </>
          )}
          {isProcessing && (
            <Button onClick={handleCancel} variant="outline" className="w-full sm:w-auto">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Export
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
  )
}

export { ItemsExportDialog }
export default ItemsExportDialog
