'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FileText,
  FileOutput,
  FileSpreadsheet,
  Presentation,
  Image,
  Loader2,
  CheckCircle,
  XCircle,
  SkipForward,
  Folder,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
// import { toast } from 'sonner' // Removed toast notifications

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { cn, calculateProgress } from '@/lib/utils'

interface ItemsExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
    canExport: boolean
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
    id: 'odp',
    label: 'OpenDocument Presentation (.odp)',
    icon: Presentation,
    description: 'For Google Slides only',
    supportedTypes: ['application/vnd.google-apps.presentation'],
  },
  {
    id: 'rtf',
    label: 'Rich Text Format (.rtf)',
    icon: FileText,
    description: 'For Google Docs only',
    supportedTypes: ['application/vnd.google-apps.document'],
  },
  {
    id: 'txt',
    label: 'Plain Text (.txt)',
    icon: FileText,
    description: 'For Google Docs only',
    supportedTypes: ['application/vnd.google-apps.document'],
  },
  {
    id: 'html',
    label: 'HTML (.html)',
    icon: FileText,
    description: 'For Google Docs only',
    supportedTypes: ['application/vnd.google-apps.document'],
  },
  {
    id: 'csv',
    label: 'Comma Separated Values (.csv)',
    icon: FileSpreadsheet,
    description: 'For Google Sheets only',
    supportedTypes: ['application/vnd.google-apps.spreadsheet'],
  },
  {
    id: 'jpeg',
    label: 'JPEG Image (.jpg)',
    icon: Image,
    description: 'For Google Slides only',
    supportedTypes: ['application/vnd.google-apps.presentation'],
  },
  {
    id: 'png',
    label: 'PNG Image (.png)',
    icon: Image,
    description: 'For Google Slides only',
    supportedTypes: ['application/vnd.google-apps.presentation'],
  },
]

function ItemsExportDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [currentStep, setCurrentStep] = useState<'configuration' | 'processing' | 'completed'>(
    'configuration',
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [isItemsExpanded, setIsItemsExpanded] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)

  // Filter items that can be exported
  const canExportItems = selectedItems.filter(item => item.canExport)

  // Calculate available export formats based on exportable items
  const availableFormats = EXPORT_FORMATS.filter(format => {
    return canExportItems.some(
      item => !item.isFolder && item.mimeType && format.supportedTypes.includes(item.mimeType),
    )
  })

  // Filter exportable files based on selected format from canExportItems
  const selectedFormatData = EXPORT_FORMATS.find(f => f.id === selectedFormat)
  const exportableFiles = canExportItems.filter(
    item =>
      !item.isFolder && item.mimeType && selectedFormatData?.supportedTypes.includes(item.mimeType),
  )
  const incompatibleFiles = selectedItems.filter(
    item =>
      !item.canExport ||
      item.isFolder ||
      !item.mimeType ||
      !selectedFormatData?.supportedTypes.includes(item.mimeType),
  )

  const totalItems = exportableFiles.length

  // Auto-select first available format if current selection is not available
  useEffect(() => {
    const isSelectedFormatAvailable = availableFormats.some(format => format.id === selectedFormat)
    if (!isSelectedFormatAvailable && availableFormats.length > 0) {
      setSelectedFormat(availableFormats[0].id)
    }
  }, [availableFormats, selectedFormat])

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

  const downloadFile = async (url: string, filename: string) => {
    try {
      // Use fetch to download the file and create a blob
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`)
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      // Fallback to direct URL if blob approach fails
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.target = '_blank'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleExport = async () => {
    if (exportableFiles.length === 0) {
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
      skipped: incompatibleFiles.length,
      failed: 0,
      errors: [],
    })

    let successCount = 0
    let failedCount = 0
    const errors: Array<{ file: string; error: string }> = []

    try {
      for (let i = 0; i < exportableFiles.length; i++) {
        if (isCancelledRef.current) {
          break
        }

        const file = exportableFiles[i]
        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFile: file.name,
        }))

        try {
          const response = await fetch('/api/drive/files/export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: file.id,
              exportFormat: selectedFormat,
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            throw new Error('Export failed')
          }

          const data = await response.json()
          console.log('Export API response:', data)

          // Handle the correct response structure - results array
          if (data.results && data.results.length > 0) {
            const result = data.results[0] // Single file export
            if (result.success && result.exportUrl) {
              const fileExtension = selectedFormat === 'jpeg' ? 'jpg' : selectedFormat
              const exportFileName = `${file.name.replace(/\.[^/.]+$/, '')}.${fileExtension}`
              await downloadFile(result.exportUrl, exportFileName)
              successCount++
              setProgress(prev => ({
                ...prev,
                success: successCount,
              }))
            } else if (result.downloadUrl) {
              // Handle non-Google Workspace files
              await downloadFile(result.downloadUrl, file.name)
              successCount++
              setProgress(prev => ({
                ...prev,
                success: successCount,
              }))
            } else {
              throw new Error(result.error || 'Export failed for this file')
            }
          } else {
            throw new Error('No export results received')
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            break
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ file: file.name, error: errorMessage })
          failedCount++
          setProgress(prev => ({
            ...prev,
            failed: failedCount,
            errors: [...errors],
          }))
        }

        // Small delay for better visual feedback and API throttling
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('Export operation failed:', error)
    }

    setProgress(prev => ({
      ...prev,
      success: successCount,
      failed: failedCount,
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

  const handleClose = () => {
    if (isProcessing) {
      handleCancel()
    } else {
      // If we're in completed step and had successful operations, refresh data
      if (currentStep === 'completed' && progress.success > 0) {
        onConfirm?.()
      }
      resetState()
      onClose()
    }
  }

  const resetState = () => {
    setSelectedFormat('pdf')
    setIsProcessing(false)
    setIsCancelled(false)
    setCurrentStep('configuration')
    setProgress({
      current: 0,
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    })
  }

  const isMobile = useIsMobile()

  const renderStepIndicator = () => {
    // Simple "Status: Indicator" format
    const getStatusDisplay = () => {
      if (isProcessing) {
        return {
          status: 'Processing',
          icon: Loader2,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        }
      } else if (currentStep === 'completed') {
        return {
          status: 'Completed',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
        }
      } else {
        return {
          status: 'Configuration',
          icon: FileOutput,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        }
      }
    }

    const { status, icon: Icon, color, bgColor } = getStatusDisplay()

    return (
      <div className={cn('mb-4 rounded-lg border p-3', bgColor)}>
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4 flex-shrink-0', color, isProcessing && 'animate-spin')} />
          <span className="text-sm font-medium">
            Status: <span className={color}>{status}</span>
          </span>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    return (
      <>
        {renderStepIndicator()}
        {isProcessing ? (
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

              <Progress
                value={calculateProgress(progress.current, progress.total)}
                className="h-2"
              />

              {progress.currentFile && (
                <div className="text-muted-foreground text-sm">
                  Exporting: {progress.currentFile}
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
                {progress.skipped > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <SkipForward className="h-4 w-4" />
                    <span>{progress.skipped} skipped</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : currentStep === 'completed' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">
                {isCancelled ? 'Export Operation Cancelled' : 'Export Completed'}
              </h3>
            </div>

            {!isCancelled && (
              <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <div>✓ Successfully exported {progress.success} file(s)</div>
                  <div>✓ Files converted to {selectedFormatData?.label}</div>
                  <div>✓ Downloads started automatically</div>
                </div>
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
          </div>
        ) : (
          <div className="space-y-4">
            <Collapsible open={isItemsExpanded} onOpenChange={setIsItemsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="hover:bg-muted/50 w-full justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {isItemsExpanded ? 'Hide Selected Items' : 'Show Selected Items'}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{exportableFiles.length} exportable</Badge>
                      {incompatibleFiles.length > 0 && (
                        <Badge variant="outline">{incompatibleFiles.length} incompatible</Badge>
                      )}
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
                    {exportableFiles.map(item => (
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

            <div className="space-y-4">
              <Label className="text-sm font-medium">Export Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  {availableFormats.map(format => {
                    const Icon = format.icon
                    return (
                      <SelectItem key={format.id} value={format.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{format.label}</div>
                            <div className="text-muted-foreground text-xs">
                              {format.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {availableFormats.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      No export formats available for selected files. Please select Google Workspace
                      files.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {exportableFiles.length === 0 ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">
                    No exportable files selected. Please select Google Workspace files.
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <div>• Export converts Google Workspace files to standard formats</div>
                  <div>• Downloaded files will be saved to your device</div>
                  <div>• Large files may take longer to process</div>
                  <div>• Some formatting may be lost during conversion</div>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  const renderFooter = () => {
    if (isProcessing) {
      return (
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      )
    }

    if (currentStep === 'completed') {
      return <Button onClick={handleClose}>{isCancelled ? 'Close' : 'Done'}</Button>
    }

    return (
      <>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleExport} disabled={exportableFiles.length === 0}>
          Export Files
        </Button>
      </>
    )
  }

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={open => !open && handleClose()}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Export Files</BottomSheetTitle>
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
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsExportDialog
export { ItemsExportDialog }
