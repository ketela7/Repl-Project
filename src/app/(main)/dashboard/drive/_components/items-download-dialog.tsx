'use client'

import { useState, useRef } from 'react'
import {
  Download,
  FileText,
  CheckCircle,
  XCircle,
  SkipForward,
  Loader2,
  Folder,
  ChevronRight,
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { cn, calculateProgress } from '@/lib/utils'

interface ItemsDownloadDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    canDownload: boolean
  }>
}

const DOWNLOAD_MODES = [
  {
    id: 'direct',
    label: 'Direct Download',
    description: 'Download files simultaneously with progress tracking',
    icon: Download,
  },
  {
    id: 'exportLinks',
    label: 'Export Download Links',
    description: 'Generate CSV file with download links',
    icon: FileText,
  },
]

function ItemsDownloadDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: ItemsDownloadDialogProps) {
  const [selectedMode, setSelectedMode] = useState('direct')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [isItemsExpanded, setIsItemsExpanded] = useState(false)
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

  // Filter downloadable files based on canDownload capability
  const downloadableFiles = selectedItems.filter(item => item.canDownload && !item.isFolder)
  const fileCount = downloadableFiles.length
  const folderCount = downloadableFiles.filter(item => item.isFolder).length
  const totalItems = downloadableFiles.length

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setIsCompleted(true)
    toast.info('Download operation cancelled')
  }

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownload = async () => {
    if (downloadableFiles.length === 0) {
      toast.error('No downloadable files selected (folders cannot be downloaded)')
      return
    }

    isCancelledRef.current = false
    setIsCancelled(false)
    setIsProcessing(true)
    setIsCompleted(false)

    abortControllerRef.current = new AbortController()

    setProgress({
      current: 0,
      total: totalItems,
      success: 0,
      skipped: skippedFolders.length,
      failed: 0,
      errors: [],
    })

    if (selectedMode === 'exportLinks') {
      // Export download links as CSV
      try {
        const response = await fetch('/api/drive/files/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileIds: downloadableFiles.map(f => f.id),
            exportLinks: true,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to generate download links')
        }

        const data = await response.json()

        // Create CSV content
        const csvContent = `Name,Download Link\n${data.links
          .map((link: any) => `"${link.name}","${link.url}"`)
          .join('\n')}`

        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        downloadFile(url, `download-links-${new Date().toISOString().slice(0, 10)}.csv`)
        URL.revokeObjectURL(url)

        setProgress(prev => ({
          ...prev,
          current: totalItems,
          success: totalItems,
        }))

        toast.success('Download links exported successfully')
      } catch (error) {
        console.error('Export failed:', error)
        setProgress(prev => ({
          ...prev,
          failed: totalItems,
          errors: [{ file: 'Export', error: 'Failed to generate download links' }],
        }))
        toast.error('Failed to export download links')
      }
    } else {
      // Direct download mode
      let successCount = 0
      let failedCount = 0
      const errors: Array<{ file: string; error: string }> = []

      try {
        for (let i = 0; i < downloadableFiles.length; i++) {
          if (isCancelledRef.current) {
            break
          }

          const file = downloadableFiles[i]
          setProgress(prev => ({
            ...prev,
            current: i + 1,
            currentFile: file.name,
          }))

          try {
            const response = await fetch('/api/drive/files/download', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileIds: [file.id],
              }),
              signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
              throw new Error('Download failed')
            }

            const data = await response.json()

            if (data.downloadUrl) {
              downloadFile(data.downloadUrl, file.name)
              successCount++
              setProgress(prev => ({
                ...prev,
                success: successCount,
              }))
            } else {
              throw new Error('No download URL received')
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
        console.error('Download operation failed:', error)
      }

      setProgress(prev => ({
        ...prev,
        success: successCount,
        failed: failedCount,
        errors,
      }))
    }

    setIsProcessing(false)
    setIsCompleted(true)

    if (isCancelledRef.current) {
      toast.info('Download operation cancelled')
    } else if (progress.success > 0 || selectedMode === 'exportLinks') {
      toast.success(`Download operation completed`)
    } else {
      toast.error('Download operation failed')
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
    setSelectedMode('direct')
    setIsProcessing(false)
    setIsCompleted(false)
    setIsCancelled(false)
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
      } else if (isCompleted) {
        return {
          status: 'Completed',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
        }
      } else {
        return {
          status: 'Configuration',
          icon: Download,
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
              <Download className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">
                {selectedMode === 'exportLinks' ? 'Generating Download Links' : 'Downloading Files'}
              </h3>
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
                  Processing: {progress.currentFile}
                </div>
              )}

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{progress.success} completed</span>
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
        ) : isCompleted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">
                {isCancelled ? 'Download Operation Cancelled' : 'Download Completed'}
              </h3>
            </div>

            {!isCancelled && (
              <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  {selectedMode === 'exportLinks' ? (
                    <>
                      <div>✓ Download links exported as CSV file</div>
                      <div>✓ File downloaded to your device</div>
                      <div>✓ Links are valid for immediate use</div>
                    </>
                  ) : (
                    <>
                      <div>✓ Successfully processed {progress.success} file(s)</div>
                      <div>✓ Files downloaded to your device</div>
                      <div>✓ Check your browser downloads folder</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {progress.failed > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">
                  Failed to download {progress.failed} item(s):
                </div>
                <div className="space-y-1">
                  {progress.errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-600">
                      • {error.file}: {error.error}
                    </div>
                  ))}
                </div>
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
                    {downloadableFiles.map(item => (
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
              <Label className="text-sm font-medium">Download Mode</Label>
              <RadioGroup
                value={selectedMode}
                onValueChange={setSelectedMode}
                className="space-y-3"
              >
                {DOWNLOAD_MODES.map(mode => (
                  <div key={mode.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={mode.id} id={mode.id} />
                    <Label htmlFor={mode.id} className="flex flex-1 items-center gap-2">
                      <mode.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{mode.label}</div>
                        <div className="text-muted-foreground text-xs">{mode.description}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {downloadableFiles.length === 0 ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">
                    No downloadable files selected. Please select files (not folders).
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <div>• Direct download will start individual file downloads</div>
                  <div>• Export links creates a CSV file with download URLs</div>
                  <div>• Downloads may be blocked by popup blockers</div>
                  <div>• Large files may take longer to process</div>
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

    if (isCompleted) {
      return <Button onClick={handleClose}>{isCancelled ? 'Close' : 'Done'}</Button>
    }

    return (
      <>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleDownload} disabled={downloadableFiles.length === 0}>
          Start Download
        </Button>
      </>
    )
  }

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={open => !open && handleClose()}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Download Items</BottomSheetTitle>
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
          <DialogTitle>Download Items</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsDownloadDialog
export { ItemsDownloadDialog }
