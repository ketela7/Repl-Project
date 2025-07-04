'use client'

import { useState, useRef } from 'react'
import {
  Download,
  Archive,
  FileText,
  Folder,
  Image,
  Video,
  Music,
  File,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  SkipForward,
  HardDrive,
  Settings,
  Info,
  Clock,
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
import { cn, calculateProgress, formatBytes } from '@/lib/utils'

interface ItemsDownloadDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
    size?: number
  }>
}

type DownloadStep = 'setup' | 'processing' | 'completed'

type DownloadFormat = 'original' | 'zip' | 'individual'

interface DownloadResult {
  fileId: string
  fileName: string
  success: boolean
  downloadUrl?: string
  size?: number
  error?: string
}

function getFileIcon(mimeType: string | undefined, isFolder: boolean) {
  if (isFolder) return <Folder className="h-4 w-4 text-blue-600" />
  if (!mimeType) return <File className="h-4 w-4 text-gray-600" />

  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-green-600" />
  if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-purple-600" />
  if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4 text-orange-600" />
  if (mimeType.includes('zip') || mimeType.includes('archive'))
    return <Archive className="h-4 w-4 text-yellow-600" />

  return <FileText className="h-4 w-4 text-gray-600" />
}

function ItemsDownloadDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
}: ItemsDownloadDialogProps) {
  const [currentStep, setCurrentStep] = useState<DownloadStep>('setup')
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('original')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

  // Download options
  const [includeMetadata, setIncludeMetadata] = useState(false)
  const [compressFiles, setCompressFiles] = useState(true)
  const [createManifest, setCreateManifest] = useState(false)
  const [autoStartDownload, setAutoStartDownload] = useState(true)

  // Results
  const [downloadResults, setDownloadResults] = useState<DownloadResult[]>([])
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string>('')

  const [progress, setProgress] = useState<{
    current: number
    total: number
    currentFile?: string
    success: number
    skipped: number
    failed: number
    totalSize: number
    downloadedSize: number
    errors: Array<{ file: string; error: string }>
  }>({
    current: 0,
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    totalSize: 0,
    downloadedSize: 0,
    errors: [],
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter(item => !item.isFolder).length
  const folderCount = selectedItems.filter(item => item.isFolder).length
  const totalSize = selectedItems.reduce((sum, item) => sum + (item.size || 0), 0)

  const handleClose = () => {
    if (isProcessing) {
      handleCancel()
    }
    resetState()
    onClose()
  }

  const resetState = () => {
    setCurrentStep('setup')
    setDownloadFormat('original')
    setIncludeMetadata(false)
    setCompressFiles(true)
    setCreateManifest(false)
    setAutoStartDownload(true)
    setDownloadResults([])
    setZipDownloadUrl('')
    setProgress({
      current: 0,
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      totalSize: 0,
      downloadedSize: 0,
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
    toast.info('Download preparation cancelled')
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

  const handleDownload = async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for download')
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
      totalSize: totalSize,
      downloadedSize: 0,
      errors: [],
    })

    let successCount = 0
    let failedCount = 0
    let skippedCount = 0
    let downloadedSize = 0
    const errors: Array<{ file: string; error: string }> = []
    const results: DownloadResult[] = []

    try {
      if (downloadFormat === 'zip' || (selectedItems.length > 1 && downloadFormat === 'original')) {
        // Create zip download
        setProgress(prev => ({
          ...prev,
          currentFile: 'Creating archive...',
        }))

        const response = await fetch('/api/drive/files/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileIds: selectedItems.map(item => item.id),
            format: 'zip',
            includeMetadata: includeMetadata,
            compress: compressFiles,
            createManifest: createManifest,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create download archive')
        }

        const data = await response.json()
        setZipDownloadUrl(data.downloadUrl)

        if (autoStartDownload) {
          triggerDownload(data.downloadUrl, `download_${Date.now()}.zip`)
        }

        successCount = selectedItems.length
        downloadedSize = totalSize

        selectedItems.forEach(item => {
          results.push({
            fileId: item.id,
            fileName: item.name,
            success: true,
            downloadUrl: data.downloadUrl,
            size: item.size,
          })
        })
      } else {
        // Individual file downloads
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
            const response = await fetch('/api/drive/files/download', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileIds: [item.id],
                format: 'original',
                includeMetadata: includeMetadata,
              }),
              signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Download failed')
            }

            const data = await response.json()

            const result: DownloadResult = {
              fileId: item.id,
              fileName: item.name,
              success: true,
              downloadUrl: data.downloadUrl,
              size: item.size,
            }

            results.push(result)

            if (autoStartDownload) {
              triggerDownload(data.downloadUrl, item.name)
            }

            successCount++
            downloadedSize += item.size || 0
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

          setProgress(prev => ({
            ...prev,
            downloadedSize: downloadedSize,
          }))

          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } catch (error) {
      console.error('Download operation failed:', error)
      if (error instanceof Error && error.name !== 'AbortError') {
        errors.push({ file: 'Archive creation', error: error.message })
        failedCount = selectedItems.length
      }
    } finally {
      setProgress(prev => ({
        ...prev,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        downloadedSize: downloadedSize,
        errors,
      }))

      setDownloadResults(results)
      setIsProcessing(false)
      setCurrentStep('completed')

      if (isCancelledRef.current) {
        toast.info('Download preparation cancelled')
      } else if (successCount > 0) {
        toast.success(`Successfully prepared ${successCount} item(s) for download`)
        onConfirm?.()
      } else {
        toast.error('Download preparation failed')
      }
    }
  }

  const renderSetupStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Download Settings</h3>
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
            {totalSize > 0 && (
              <Badge variant="outline" className="gap-1">
                <HardDrive className="h-3 w-3" />
                {formatBytes(totalSize)}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-40">
          <div className="space-y-2">
            {selectedItems.slice(0, 10).map(item => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                {getFileIcon(item.mimeType, item.isFolder)}
                <div className="min-w-0 flex-1">
                  <span className="block truncate">{item.name}</span>
                  {item.size && (
                    <span className="text-muted-foreground text-xs">{formatBytes(item.size)}</span>
                  )}
                </div>
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

      <div className="space-y-4">
        <Label className="text-sm font-medium">Download Format</Label>
        <RadioGroup
          value={downloadFormat}
          onValueChange={value => setDownloadFormat(value as DownloadFormat)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="original" id="original" />
            <Label htmlFor="original" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Original Files
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="zip" id="zip" />
            <Label htmlFor="zip" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              ZIP Archive
            </Label>
          </div>
          {selectedItems.length > 1 && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Individual Downloads
              </Label>
            </div>
          )}
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Download Options</Label>

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

          {downloadFormat === 'zip' && (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="compressFiles"
                  checked={compressFiles}
                  onCheckedChange={setCompressFiles}
                />
                <Label htmlFor="compressFiles" className="text-sm">
                  Compress files in archive
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="createManifest"
                  checked={createManifest}
                  onCheckedChange={setCreateManifest}
                />
                <Label htmlFor="createManifest" className="text-sm">
                  Include file manifest
                </Label>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="includeMetadata"
              checked={includeMetadata}
              onCheckedChange={setIncludeMetadata}
            />
            <Label htmlFor="includeMetadata" className="text-sm">
              Include file metadata
            </Label>
          </div>
        </div>
      </div>

      {downloadFormat === 'zip' && (
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2 font-medium">
              <Archive className="h-4 w-4" />
              <span>ZIP Archive Benefits</span>
            </div>
            <div>• Single download for all files</div>
            <div>• Preserves folder structure</div>
            <div>• Smaller total download size</div>
            <div>• Easier to share and organize</div>
          </div>
        </div>
      )}

      {selectedItems.length > 5 && downloadFormat === 'individual' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              Individual downloads will trigger {selectedItems.length} separate downloads
            </span>
          </div>
        </div>
      )}
    </div>
  )

  const renderProcessingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <h3 className="font-semibold">Preparing Downloads</h3>
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
            <span className="truncate">Processing: {progress.currentFile}</span>
          </div>
        )}

        {progress.totalSize > 0 && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <HardDrive className="h-4 w-4" />
            <span>
              {formatBytes(progress.downloadedSize)} / {formatBytes(progress.totalSize)}
            </span>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{progress.success} prepared</span>
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
          {isCancelled ? 'Download Preparation Cancelled' : 'Downloads Ready'}
        </h3>
      </div>

      {!isCancelled && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div>✓ Successfully prepared {progress.success} item(s) for download</div>
            <div>
              ✓ {autoStartDownload ? 'Downloads started automatically' : 'Download links generated'}
            </div>
            <div>✓ Files ready for immediate access</div>
          </div>
        </div>
      )}

      {zipDownloadUrl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ZIP Archive</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerDownload(zipDownloadUrl, `download_${Date.now()}.zip`)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Archive
            </Button>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3 dark:bg-gray-950/50">
            <div className="flex items-center gap-2 text-sm">
              <Archive className="h-4 w-4 text-blue-600" />
              <span className="font-medium">All files bundled in ZIP format</span>
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              Size: {formatBytes(progress.totalSize)} • Items: {progress.success}
            </div>
          </div>
        </div>
      )}

      {downloadResults.length > 0 && !zipDownloadUrl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Individual Downloads</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadResults.forEach(result => {
                  if (result.success && result.downloadUrl) {
                    triggerDownload(result.downloadUrl, result.fileName)
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
              {downloadResults.map((result, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="flex-1 truncate font-medium">{result.fileName}</span>
                    {result.success && result.downloadUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => triggerDownload(result.downloadUrl!, result.fileName)}
                        className="h-8 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

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
            Failed to prepare {progress.failed} item(s):
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
            💡 Tip: Downloads may be blocked by your browser's popup blocker
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
            <Button onClick={handleDownload} disabled={selectedItems.length === 0}>
              Prepare Downloads
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
            <BottomSheetTitle>Download Items</BottomSheetTitle>
            <BottomSheetDescription>
              Download selected items from Google Drive in various formats.
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
          <DialogTitle>Download Items</DialogTitle>
          <DialogDescription>
            Download selected items from Google Drive in various formats.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsDownloadDialog
export { ItemsDownloadDialog }
