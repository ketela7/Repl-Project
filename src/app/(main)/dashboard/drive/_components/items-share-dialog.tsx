'use client'

import { useState, useRef } from 'react'
import { Share2, Globe, Users, Eye, Edit, Loader2, CheckCircle, XCircle, AlertTriangle, SkipForward, Copy, Download, ChevronDown, FileText, Code } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface ItemsShareDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
  }>
}

interface ShareResult {
  id: string
  name: string
  success: boolean
  shareLink?: string
  error?: string
}

function ItemsShareDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsShareDialogProps) {
  const [accessLevel, setAccessLevel] = useState<'reader' | 'writer' | 'commenter'>('reader')
  const [linkAccess, setLinkAccess] = useState<'anyone' | 'anyoneWithLink' | 'domain'>('anyoneWithLink')
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
    shareResults: ShareResult[]
  }>({
    current: 0,
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    shareResults: [],
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  const fileCount = selectedItems.filter((item) => !item.isFolder).length
  const folderCount = selectedItems.filter((item) => item.isFolder).length

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setIsCompleted(true)

    toast.info('Share operation cancelled by user')
  }

  const handleShare = async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for sharing')
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
        shareResults: [],
      })

      let successCount = 0
      let failedCount = 0
      const errors: Array<{ file: string; error: string }> = []
      const shareResults: ShareResult[] = []

      for (let i = 0; i < selectedItems.length; i++) {
        if (isCancelledRef.current) {
          toast.info(`Share cancelled after ${successCount} items`)
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

          const response = await fetch('/api/drive/files/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{ id: item.id }],
              accessLevel,
              linkAccess,
            }),
            signal: abortControllerRef.current?.signal,
          })

          if (abortControllerRef.current?.signal.aborted) {
            break
          }

          const result = await response.json()

          if (result.success) {
            successCount++
            shareResults.push({
              id: item.id,
              name: item.name,
              success: true,
              shareLink: result.shareLink || `https://drive.google.com/file/d/${item.id}/view`,
            })
          } else {
            throw new Error(result.error || 'Failed to share item')
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
            error: error.message || 'Share failed',
          })
          shareResults.push({
            id: item.id,
            name: item.name,
            success: false,
            error: error.message || 'Share failed',
          })
        }

        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          success: successCount,
          failed: failedCount,
          skipped: 0, // Share operation doesn't skip items
          errors,
          shareResults,
        }))

        if (isCancelledRef.current) {
          break
        }
      }

      if (!isCancelledRef.current) {
        if (successCount > 0) {
          toast.success(`Shared ${successCount} item${successCount > 1 ? 's' : ''}`)
        }
        if (failedCount > 0) {
          toast.error(`Failed to share ${failedCount} item${failedCount > 1 ? 's' : ''}`)
        }
      }
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      console.error(err)
      toast.error('Share operation failed')
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
      setProgress({
        current: 0,
        total: 0,
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        shareResults: [],
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

  const handleExportData = (format: 'csv' | 'txt' | 'json') => {
    const successfulShares = progress.shareResults.filter((result) => result.success && result.shareLink)

    if (successfulShares.length === 0) {
      toast.error('No successful shares to export')
      return
    }

    let content: string
    let mimeType: string
    let fileExtension: string

    switch (format) {
      case 'csv':
        // Create CSV content with header
        const csvHeader = 'name,sharelink\n'
        const csvContent = successfulShares.map((result) => `"${result.name}","${result.shareLink}"`).join('\n')
        content = csvHeader + csvContent
        mimeType = 'text/csv;charset=utf-8;'
        fileExtension = 'csv'
        break

      case 'txt':
        // Create plain text content
        content = successfulShares.map((result) => `${result.name}: ${result.shareLink}`).join('\n')
        mimeType = 'text/plain;charset=utf-8;'
        fileExtension = 'txt'
        break

      case 'json':
        // Create JSON content
        const jsonData = {
          exportDate: new Date().toISOString(),
          totalShares: successfulShares.length,
          shares: successfulShares.map((result) => ({
            name: result.name,
            shareLink: result.shareLink,
            fileId: result.id,
          })),
        }
        content = JSON.stringify(jsonData, null, 2)
        mimeType = 'application/json;charset=utf-8;'
        fileExtension = 'json'
        break

      default:
        return
    }

    // Create and download the file
    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `share-links-${new Date().toISOString().split('T')[0]}.${fileExtension}`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Exported ${successfulShares.length} share links to ${format.toUpperCase()}`)
  }

  // Render different content based on state
  const renderContent = () => {
    // 1. Initial State - Show share options and items preview
    if (!isProcessing && !isCompleted) {
      return (
        <div className="flex max-h-[60vh] flex-col space-y-4">
          {/* Header Info - Compact */}
          <div className="flex-shrink-0 space-y-2 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Share2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Share Items</h3>
              <p className="text-muted-foreground text-xs">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Stats - Compact */}
          <div className="flex flex-shrink-0 justify-center gap-1">
            {fileCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                {fileCount} file{fileCount > 1 ? 's' : ''}
              </Badge>
            )}
            {folderCount > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-xs text-green-800 dark:bg-green-900 dark:text-green-100">
                {folderCount} folder{folderCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Share Options */}
          <div className="flex-shrink-0 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Permission Level:</Label>
              <Select value={accessLevel} onValueChange={(value: 'reader' | 'writer' | 'commenter') => setAccessLevel(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reader">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      <span>View only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="commenter">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>Comment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="writer">
                    <div className="flex items-center gap-2">
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Link Access:</Label>
              <Select value={linkAccess} onValueChange={(value: 'anyone' | 'anyoneWithLink' | 'domain') => setLinkAccess(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyoneWithLink">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <span>Anyone with link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="domain">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>Domain users</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="anyone">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <span>Public</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items Preview - Scrollable */}
          <div className="min-h-0 flex-1 space-y-2">
            <h4 className="text-center text-xs font-medium">Items to share:</h4>
            <div className="bg-muted/50 flex-1 overflow-y-auto rounded-lg border">
              <div className="space-y-1 p-2">
                {selectedItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="bg-background/50 flex min-w-0 items-center gap-2 rounded-md p-2">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold">Sharing Items...</h3>
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
              <div className="text-lg font-bold text-blue-600">{progress.current}</div>
              <div className="text-muted-foreground text-xs">Processed</div>
            </div>
          </div>
        </div>
      )
    }

    // 3. Completed State - Show results and share links
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
            <h3 className="text-base font-semibold">{isCancelled ? 'Share Cancelled' : wasSuccessful && !hasErrors ? 'Items Shared' : hasErrors ? 'Partially Shared' : 'No Items Shared'}</h3>
            <p className="text-muted-foreground text-sm">
              {totalProcessed} of {selectedItems.length} items processed
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-green-600">{progress.success}</div>
            <div className="text-muted-foreground text-xs">Shared</div>
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

        {/* Share Links */}
        {progress.shareResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Share Links:</h4>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {progress.shareResults.map((result, index) => (
                <div
                  key={`share-result-${result.name}-${index}`}
                  className={cn(
                    'rounded border p-2 text-xs',
                    result.success ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  )}
                >
                  <div className="font-medium">{result.name}</div>
                  {result.success && result.shareLink ? (
                    <div className="mt-1 flex items-center gap-1">
                      <a href={result.shareLink} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-xs text-blue-600 hover:underline dark:text-blue-400">
                        {result.shareLink}
                      </a>
                      <Button size="sm" variant="ghost" className="h-4 w-4 p-0" onClick={() => navigator.clipboard.writeText(result.shareLink || '')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 dark:text-red-400">{result.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Details */}
        {progress.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600">Errors:</h4>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {progress.errors.map((error, index) => (
                <div key={`error-${error.file}-${index}`} className="rounded border border-red-200 bg-red-50 p-2 text-xs dark:border-red-800 dark:bg-red-900/20">
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
            <p className="text-sm text-blue-700 dark:text-blue-300">Click the button below to refresh and see your updated files.</p>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Share Items</div>
                <div className="text-muted-foreground text-sm font-normal">Share operation</div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            {!isProcessing && !isCompleted && (
              <>
                <Button onClick={handleShare} className={cn('touch-target min-h-[44px] bg-blue-600 text-white hover:bg-blue-700 active:scale-95')}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Items
                </Button>
                <Button variant="outline" onClick={handleClose} className={cn('touch-target min-h-[44px] active:scale-95')}>
                  Cancel
                </Button>
              </>
            )}
            {isProcessing && (
              <Button onClick={handleCancel} variant="outline" className={cn('touch-target min-h-[44px] active:scale-95')}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Operation
              </Button>
            )}
            {isCompleted && (
              <>
                {progress.success > 0 || progress.failed > 0 ? (
                  <Button onClick={handleCloseAndRefresh} className={cn('touch-target min-h-[44px] active:scale-95')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Refresh Now
                  </Button>
                ) : (
                  <Button onClick={handleClose} className={cn('touch-target min-h-[44px] active:scale-95')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Close
                  </Button>
                )}
                {progress.success > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className={cn('touch-target min-h-[44px] active:scale-95')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportData('csv')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportData('txt')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as TXT
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportData('json')}>
                        <Code className="mr-2 h-4 w-4" />
                        Export as JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {(progress.success > 0 || progress.failed > 0) && (
                  <Button onClick={handleClose} variant="outline" className={cn('touch-target min-h-[44px] active:scale-95')}>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Share Items</div>
              <div className="text-muted-foreground text-sm font-normal">Share operation</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">{renderContent()}</div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {!isProcessing && !isCompleted && (
            <>
              <Button onClick={handleShare} className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 sm:w-auto dark:bg-blue-700 dark:hover:bg-blue-800">
                <Share2 className="mr-2 h-4 w-4" />
                Share Items
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
            </>
          )}
          {isProcessing && (
            <Button onClick={handleCancel} variant="outline" className="w-full sm:w-auto">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Operation
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
              {progress.success > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportData('csv')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportData('txt')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportData('json')}>
                      <Code className="mr-2 h-4 w-4" />
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

export { ItemsShareDialog }
export default ItemsShareDialog
