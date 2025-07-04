'use client'

import { useState, useRef } from 'react'
import {
  Share2,
  Globe,
  Users,
  Eye,
  Edit,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  SkipForward,
  Copy,
  Download,
  ChevronDown,
  FileText,
  Code,
  Folder,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
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
} from '@/components/ui/bottom-sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn, calculateProgress } from '@/lib/utils'

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
  const [currentStep, setCurrentStep] = useState<'configuration' | 'processing' | 'completed'>(
    'configuration',
  )
  const [accessLevel, setAccessLevel] = useState<'reader' | 'writer' | 'commenter'>('reader')
  const [linkAccess, setLinkAccess] = useState<'anyone' | 'anyoneWithLink' | 'domain'>(
    'anyoneWithLink',
  )
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
  const [shareResults, setShareResults] = useState<ShareResult[]>([])

  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef(false)
  const isMobile = useIsMobile()

  const handleCancel = () => {
    isCancelledRef.current = true
    setIsCancelled(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsProcessing(false)
    setCurrentStep('completed')
    toast.info('Share operation cancelled')
  }

  const handleShare = async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for sharing')
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
    setShareResults([])

    let successCount = 0
    let failedCount = 0
    let skippedCount = 0
    const errors: Array<{ file: string; error: string }> = []
    const results: ShareResult[] = []

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
          const response = await fetch('/api/drive/files/share', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: item.id,
              permission: accessLevel,
              type: linkAccess,
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Share failed')
          }

          const data = await response.json()
          results.push({
            id: item.id,
            name: item.name,
            success: true,
            shareLink: data.shareLink,
          })
          successCount++
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            break
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ file: item.name, error: errorMessage })
          results.push({
            id: item.id,
            name: item.name,
            success: false,
            error: errorMessage,
          })
          failedCount++
        }

        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Share operation failed:', error)
    } finally {
      setProgress(prev => ({
        ...prev,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        errors,
      }))
      setShareResults(results)

      setIsProcessing(false)
      setCurrentStep('completed')

      if (isCancelledRef.current) {
        toast.info('Share operation cancelled')
      } else if (successCount > 0) {
        toast.success(`Successfully shared ${successCount} item(s)`)
      } else {
        toast.error('Share operation failed')
      }
    }
  }

  const handleClose = () => {
    if (isProcessing) {
      handleCancel()
    } else {
      resetState()
      onClose()
    }
  }

  const handleComplete = () => {
    onConfirm()
    resetState()
    onClose()
  }

  const resetState = () => {
    setCurrentStep('configuration')
    setAccessLevel('reader')
    setLinkAccess('anyoneWithLink')
    setIsProcessing(false)
    setIsCancelled(false)
    setProgress({
      current: 0,
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    })
    setShareResults([])
  }

  const renderConfigurationStep = () => {
    const folderCount = selectedItems.filter(item => item.isFolder).length
    const fileCount = selectedItems.length - folderCount

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Configure Share Settings</h3>
        </div>

        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <AlertTriangle className="h-4 w-4" />
            <span>Configure sharing permissions and access levels for selected items</span>
          </div>
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
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                >
                  {item.isFolder ? (
                    <Folder className="h-4 w-4 text-blue-600" />
                  ) : (
                    <FileText className="h-4 w-4 text-gray-600" />
                  )}
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

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            <h4 className="font-medium">Share Configuration</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shareMethod">Share Method</Label>
              <Select value={linkAccess} onValueChange={(value: any) => setLinkAccess(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyoneWithLink">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Anyone with link
                    </div>
                  </SelectItem>
                  <SelectItem value="anyone">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Anyone on internet
                    </div>
                  </SelectItem>
                  <SelectItem value="domain">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Domain only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permission Level</Label>
              <Select value={accessLevel} onValueChange={(value: any) => setAccessLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reader">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Viewer
                    </div>
                  </SelectItem>
                  <SelectItem value="commenter">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Commenter
                    </div>
                  </SelectItem>
                  <SelectItem value="writer">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Editor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Files will be shared with the selected permissions. You can revoke access later.
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const exportShareResults = (format: 'clipboard' | 'txt' | 'csv' | 'json') => {
    const successfulShares = shareResults.filter(result => result.success)

    if (successfulShares.length === 0) {
      toast.error('No successful shares to export')
      return
    }

    let content = ''
    let filename = ''

    switch (format) {
      case 'clipboard':
        content = successfulShares.map(share => `${share.name}: ${share.shareLink}`).join('\n')
        navigator.clipboard.writeText(content).then(() => {
          toast.success('Share links copied to clipboard')
        })
        return

      case 'txt':
        content = successfulShares.map(share => `${share.name}: ${share.shareLink}`).join('\n')
        filename = `share-links-${new Date().toISOString().slice(0, 10)}.txt`
        break

      case 'csv':
        content =
          'Name,Share Link\n' +
          successfulShares.map(share => `"${share.name}","${share.shareLink}"`).join('\n')
        filename = `share-links-${new Date().toISOString().slice(0, 10)}.csv`
        break

      case 'json':
        content = JSON.stringify(successfulShares, null, 2)
        filename = `share-links-${new Date().toISOString().slice(0, 10)}.json`
        break
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    toast.success(`Exported as ${format.toUpperCase()}`)
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'configuration', label: 'Configuration', icon: Share2 },
      { key: 'processing', label: 'Processing', icon: Loader2 },
      { key: 'completed', label: 'Completed', icon: CheckCircle },
    ]

    return (
      <div className="mb-6 flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.key
          const isCompleted =
            (currentStep === 'processing' && step.key === 'configuration') ||
            (currentStep === 'completed' && step.key !== 'completed')
          const isCurrent = isActive

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                  isCurrent && 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300',
                  isCompleted &&
                    'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-300',
                  !isCurrent && !isCompleted && 'text-muted-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    isCurrent && (step.key === 'processing' ? 'animate-spin' : ''),
                  )}
                />
                <span className="font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="text-muted-foreground mx-2 h-4 w-4" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderContent = () => {
    if (currentStep === 'processing') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <h3 className="font-semibold">Sharing Items</h3>
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
              <div className="text-muted-foreground text-sm">
                Processing: {progress.currentFile}
              </div>
            )}

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{progress.success} shared</span>
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
    }

    if (currentStep === 'completed') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">
              {isCancelled ? 'Share Operation Cancelled' : 'Items Shared Successfully'}
            </h3>
          </div>

          {!isCancelled && progress.success > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Export Share Links</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Export <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportShareResults('clipboard')}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportShareResults('txt')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportShareResults('csv')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportShareResults('json')}>
                      <Code className="mr-2 h-4 w-4" />
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {shareResults.map((result, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{result.name}</span>
                      </div>
                      {result.shareLink && (
                        <div className="text-muted-foreground ml-6 text-xs">{result.shareLink}</div>
                      )}
                      {result.error && (
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
                Failed to share {progress.failed} item(s):
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
    }

    return renderConfigurationStep()
  }

  const renderFooter = () => {
    if (currentStep === 'processing') {
      return (
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      )
    }

    if (currentStep === 'completed') {
      return (
        <Button onClick={isCancelled ? handleClose : handleComplete}>
          {isCancelled ? 'Close' : 'Done'}
        </Button>
      )
    }

    return (
      <>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleShare} disabled={selectedItems.length === 0}>
          Share Items
        </Button>
      </>
    )
  }

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={open => !open && handleClose()}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Share Items</BottomSheetTitle>
          </BottomSheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {renderStepIndicator()}
            {renderContent()}
          </div>

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
          <DialogTitle>Share Items</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {renderStepIndicator()}
          {renderContent()}
        </div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsShareDialog
export { ItemsShareDialog }
