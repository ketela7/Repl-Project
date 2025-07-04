'use client'

import { useState, useRef } from 'react'
import {
  FileDown,
  FileText,
  Image,
  Table,
  Code,
  File,
  Folder,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  SkipForward,
  Settings,
  Info,
  Download,
  Zap,
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn, calculateProgress } from '@/lib/utils'

interface ItemsExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
  }>
}

type ExportStep = 'setup' | 'processing' | 'completed'

interface ExportFormat {
  id: string
  name: string
  description: string
  extension: string
  icon: React.ComponentType<{ className?: string }>
  mimeTypes: string[]
  googleMimeType?: string
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Document',
    description: 'Portable Document Format',
    extension: 'pdf',
    icon: FileText,
    mimeTypes: ['application/vnd.google-apps.document', 'application/vnd.google-apps.presentation'],
    googleMimeType: 'application/pdf',
  },
  {
    id: 'docx',
    name: 'Microsoft Word',
    description: 'Word Document (.docx)',
    extension: 'docx',
    icon: FileText,
    mimeTypes: ['application/vnd.google-apps.document'],
    googleMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  {
    id: 'odt',
    name: 'OpenDocument Text',
    description: 'Open Document Format (.odt)',
    extension: 'odt',
    icon: FileText,
    mimeTypes: ['application/vnd.google-apps.document'],
    googleMimeType: 'application/vnd.oasis.opendocument.text',
  },
  {
    id: 'xlsx',
    name: 'Microsoft Excel',
    description: 'Excel Spreadsheet (.xlsx)',
    extension: 'xlsx',
    icon: Table,
    mimeTypes: ['application/vnd.google-apps.spreadsheet'],
    googleMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    id: 'ods',
    name: 'OpenDocument Spreadsheet',
    description: 'Open Document Spreadsheet (.ods)',
    extension: 'ods',
    icon: Table,
    mimeTypes: ['application/vnd.google-apps.spreadsheet'],
    googleMimeType: 'application/vnd.oasis.opendocument.spreadsheet',
  },
  {
    id: 'csv',
    name: 'CSV File',
    description: 'Comma Separated Values',
    extension: 'csv',
    icon: Table,
    mimeTypes: ['application/vnd.google-apps.spreadsheet'],
    googleMimeType: 'text/csv',
  },
  {
    id: 'pptx',
    name: 'Microsoft PowerPoint',
    description: 'PowerPoint Presentation (.pptx)',
    extension: 'pptx',
    icon: Image,
    mimeTypes: ['application/vnd.google-apps.presentation'],
    googleMimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  {
    id: 'odp',
    name: 'OpenDocument Presentation',
    description: 'Open Document Presentation (.odp)',
    extension: 'odp',
    icon: Image,
    mimeTypes: ['application/vnd.google-apps.presentation'],
    googleMimeType: 'application/vnd.oasis.opendocument.presentation',
  },
  {
    id: 'jpeg',
    name: 'JPEG Image',
    description: 'JPEG Image Format',
    extension: 'jpg',
    icon: Image,
    mimeTypes: ['application/vnd.google-apps.presentation'],
    googleMimeType: 'image/jpeg',
  },
  {
    id: 'png',
    name: 'PNG Image',
    description: 'PNG Image Format',
    extension: 'png',
    icon: Image,
    mimeTypes: ['application/vnd.google-apps.presentation'],
    googleMimeType: 'image/png',
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Text File (.txt)',
    extension: 'txt',
    icon: FileText,
    mimeTypes: ['application/vnd.google-apps.document'],
    googleMimeType: 'text/plain',
  },
  {
    id: 'html',
    name: 'HTML File',
    description: 'HTML Web Page',
    extension: 'html',
    icon: Code,
    mimeTypes: ['application/vnd.google-apps.document'],
    googleMimeType: 'text/html',
  },
]

interface ExportResult {
  fileId: string
  fileName: string
  success: boolean
  exportUrl?: string
  exportFormat?: string
  error?: string
}

function getFileIcon(mimeType: string | undefined, isFolder: boolean) {
  if (isFolder) return <Folder className="h-4 w-4 text-blue-600" />
  if (!mimeType) return <File className="h-4 w-4 text-gray-600" />

  if (mimeType === 'application/vnd.google-apps.document')
    return <FileText className="h-4 w-4 text-blue-600" />
  if (mimeType === 'application/vnd.google-apps.spreadsheet')
    return <Table className="h-4 w-4 text-green-600" />
  if (mimeType === 'application/vnd.google-apps.presentation')
    return <Image className="h-4 w-4 text-orange-600" />

  return <File className="h-4 w-4 text-gray-600" />
}

function ItemsExportDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsExportDialogProps) {
  const [currentStep, setCurrentStep] = useState<ExportStep>('setup')
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

  // Export options
  const [autoStartDownload, setAutoStartDownload] = useState(true)
  const [includeComments, setIncludeComments] = useState(false)
  const [includeSuggestions, setIncludeSuggestions] = useState(false)

  // Results
  const [exportResults, setExportResults] = useState<ExportResult[]>([])

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

  // Filter items that can be exported
  const exportableItems = selectedItems.filter(
    item =>
      !item.isFolder &&
      item.mimeType &&
      [
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.google-apps.presentation',
      ].includes(item.mimeType),
  )

  const nonExportableItems = selectedItems.filter(
    item =>
      item.isFolder ||
      !item.mimeType ||
      ![
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.google-apps.presentation',
      ].includes(item.mimeType),
  )

  // Get available formats based on selected items
  const availableFormats = EXPORT_FORMATS.filter(format =>
    exportableItems.some(item => format.mimeTypes.includes(item.mimeType!)),
  )

  const handleClose = () => {
    if (isProcessing) {
      handleCancel()
    }
    resetState()
    onClose()
  }

  const resetState = () => {
    setCurrentStep('setup')
    setSelectedFormat('pdf')
    setAutoStartDownload(true)
    setIncludeComments(false)
    setIncludeSuggestions(false)
    setExportResults([])
    setProgress({
      current: 0,
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    })
  }

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setCurrentStep('completed')
    toast.info('Export operation cancelled')
  }

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async () => {
    if (exportableItems.length === 0) {
      toast.error('No exportable Google Workspace files selected')
      return
    }

    const format = EXPORT_FORMATS.find(f => f.id === selectedFormat)
    if (!format) {
      toast.error('Invalid export format selected')
      return
    }

    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setCurrentStep('processing')

    abortControllerRef.current = new AbortController()

    const totalItems = exportableItems.length
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
    const results: ExportResult[] = []

    try {
      for (let i = 0; i < exportableItems.length; i++) {
        if (isCancelledRef.current) {
          break
        }

        const item = exportableItems[i]
        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFile: item.name,
        }))

        // Check if the item can be exported to this format
        if (!format.mimeTypes.includes(item.mimeType!)) {
          skippedCount++
          results.push({
            fileId: item.id,
            fileName: item.name,
            success: false,
            error: `Cannot export ${item.mimeType} to ${format.name}`,
          })
          continue
        }

        try {
          const response = await fetch('/api/drive/files/export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: item.id,
              mimeType: format.googleMimeType,
              includeComments: includeComments,
              includeSuggestions: includeSuggestions,
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Export failed')
          }

          const data = await response.json()

          const result: ExportResult = {
            fileId: item.id,
            fileName: item.name,
            success: true,
            exportUrl: data.exportUrl,
            exportFormat: format.name,
          }

          results.push(result)

          if (autoStartDownload && data.exportUrl) {
            const exportFileName = item.name.replace(/\.[^/.]+$/, '') + '.' + format.extension
            triggerDownload(data.exportUrl, exportFileName)
          }

          successCount++
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            break
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ file: item.name, error: errorMessage })

          results.push({
            fileId: item.id,
            fileName: item.name,
            success: false,
            error: errorMessage,
          })
          failedCount++
        }

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Export operation failed:', error)
    } finally {
      setProgress(prev => ({
        ...prev,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        errors,
      }))

      setExportResults(results)
      setIsProcessing(false)
      setCurrentStep('completed')

      if (isCancelledRef.current) {
        toast.info('Export operation cancelled')
      } else if (successCount > 0) {
        toast.success(`Successfully exported ${successCount} item(s)`)
        onConfirm?.()
      } else {
        toast.error('Export operation failed')
      }
    }
  }

  const renderSetupStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Export Settings</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Exportable Items</span>
          <Badge variant="secondary" className="gap-1">
            <FileDown className="h-3 w-3" />
            {exportableItems.length} exportable
          </Badge>
        </div>

        {exportableItems.length > 0 && (
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {exportableItems.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  className="text-muted-foreground flex items-center gap-2 text-sm"
                >
                  {getFileIcon(item.mimeType, item.isFolder)}
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
              {exportableItems.length > 5 && (
                <div className="text-muted-foreground text-center text-sm">
                  +{exportableItems.length - 5} more items
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {nonExportableItems.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {nonExportableItems.length} item(s) cannot be exported
                </span>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Only Google Docs, Sheets, and Slides can be exported to other formats.
              </div>
            </div>
          </div>
        )}
      </div>

      {exportableItems.length === 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">
              No Google Workspace files selected. Please select Google Docs, Sheets, or Slides.
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup
              value={selectedFormat}
              onValueChange={setSelectedFormat}
              className="space-y-2"
            >
              {availableFormats.map(format => (
                <div key={format.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={format.id} id={format.id} />
                  <Label htmlFor={format.id} className="flex flex-1 items-center gap-2">
                    <format.icon className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{format.name}</div>
                      <div className="text-muted-foreground text-xs">{format.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Export Options</Label>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoStartDownload"
                  checked={autoStartDownload}
                  onCheckedChange={setAutoStartDownload}
                />
                <Label htmlFor="autoStartDownload" className="text-sm">
                  Start downloads automatically
                </Label>
              </div>

              {selectedFormat === 'pdf' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeComments"
                      checked={includeComments}
                      onCheckedChange={setIncludeComments}
                    />
                    <Label htmlFor="includeComments" className="text-sm">
                      Include comments in export
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeSuggestions"
                      checked={includeSuggestions}
                      onCheckedChange={setIncludeSuggestions}
                    />
                    <Label htmlFor="includeSuggestions" className="text-sm">
                      Include suggestions in export
                    </Label>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2 font-medium">
                <Info className="h-4 w-4" />
                <span>Export Information</span>
              </div>
              <div>• Files will be converted to the selected format</div>
              <div>• Original files remain unchanged in Google Drive</div>
              <div>• Some formatting may be lost during conversion</div>
              <div>• Large files may take longer to export</div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderProcessingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <h3 className="font-semibold">Exporting Files</h3>
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
            <span className="truncate">Exporting: {progress.currentFile}</span>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{progress.success} exported</span>
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
          {isCancelled ? 'Export Operation Cancelled' : 'Files Exported Successfully'}
        </h3>
      </div>

      {!isCancelled && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div>✓ Successfully exported {progress.success} file(s)</div>
            <div>
              ✓ Files converted to {EXPORT_FORMATS.find(f => f.id === selectedFormat)?.name}
            </div>
            <div>
              ✓{' '}
              {autoStartDownload
                ? 'Downloads started automatically'
                : 'Export files ready for download'}
            </div>
          </div>
        </div>
      )}

      {exportResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Exported Files</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportResults.forEach(result => {
                  if (result.success && result.exportUrl) {
                    const format = EXPORT_FORMATS.find(f => f.id === selectedFormat)
                    const exportFileName =
                      result.fileName.replace(/\.[^/.]+$/, '') +
                      '.' +
                      (format?.extension || 'export')
                    triggerDownload(result.exportUrl, exportFileName)
                  }
                })
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          </div>

          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {exportResults.map((result, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="flex-1 truncate font-medium">{result.fileName}</span>
                    {result.success && result.exportUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const format = EXPORT_FORMATS.find(f => f.id === selectedFormat)
                          const exportFileName =
                            result.fileName.replace(/\.[^/.]+$/, '') +
                            '.' +
                            (format?.extension || 'export')
                          triggerDownload(result.exportUrl!, exportFileName)
                        }}
                        className="h-8 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {result.success && result.exportFormat && (
                    <div className="text-muted-foreground ml-6 text-xs">
                      Exported as: {result.exportFormat}
                    </div>
                  )}

                  {!result.success && (
                    <div className="ml-6 text-xs text-red-600">Error: {result.error}</div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {progress.failed > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600">
            Failed to export {progress.failed} item(s):
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

      {!isCancelled && progress.success > 0 && (
        <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20">
          <div className="text-sm text-amber-700 dark:text-amber-300">
            💡 Tip: Exported files retain their original quality and content structure
          </div>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (currentStep) {
      case 'setup':
        return renderSetupStep()
      case 'processing':
        return renderProcessingStep()
      case 'completed':
        return renderCompletedStep()
      default:
        return null
    }
  }

  const renderFooter = () => {
    switch (currentStep) {
      case 'setup':
        return (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exportableItems.length === 0}>
              Export Files
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
            <BottomSheetTitle>Export Files</BottomSheetTitle>
            <BottomSheetDescription>
              Export Google Workspace files to various formats like PDF, Word, Excel, etc.
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Files</DialogTitle>
          <DialogDescription>
            Export Google Workspace files to various formats like PDF, Word, Excel, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsExportDialog
export { ItemsExportDialog }
