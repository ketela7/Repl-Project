'use client'

import { useState, useRef } from 'react'
import {
  Users,
  Link,
  Globe,
  Eye,
  Edit3,
  Copy,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  SkipForward,
  FileText,
  Folder,
  Settings,
  Shield,
  Mail,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { calculateProgress } from '@/lib/utils'

interface ItemsShareDialogProps {
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

type ShareStep = 'setup' | 'processing' | 'completed'

type ShareMethod = 'link' | 'email' | 'public'

type Permission = 'viewer' | 'commenter' | 'editor'

interface ShareResult {
  fileId: string
  fileName: string
  success: boolean
  shareLink?: string
  error?: string
}

function ItemsShareDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsShareDialogProps) {
  const [currentStep, setCurrentStep] = useState<ShareStep>('setup')
  const [shareMethod, setShareMethod] = useState<ShareMethod>('link')
  const [permission, setPermission] = useState<Permission>('viewer')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

  // Email sharing options
  const [emailAddresses, setEmailAddresses] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [notifyByEmail, setNotifyByEmail] = useState(true)

  // Link sharing options
  const [requireSignIn, setRequireSignIn] = useState(false)
  const [allowDownload, setAllowDownload] = useState(true)
  const [copyLinks, setCopyLinks] = useState(false)

  // Results
  const [shareResults, setShareResults] = useState<ShareResult[]>([])

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
    resetState()
    onClose()
  }

  const resetState = () => {
    setCurrentStep('setup')
    setShareMethod('link')
    setPermission('viewer')
    setEmailAddresses('')
    setEmailMessage('')
    setNotifyByEmail(true)
    setRequireSignIn(false)
    setAllowDownload(true)
    setCopyLinks(false)
    setShareResults([])
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
    toast.info('Share operation cancelled')
  }

  const validateEmailAddresses = (emails: string): string[] => {
    const emailList = emails
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails = emailList.filter(email => emailRegex.test(email))

    if (validEmails.length !== emailList.length) {
      const invalidEmails = emailList.filter(email => !emailRegex.test(email))
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`)
      return []
    }

    return validEmails
  }

  const handleShare = async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for sharing')
      return
    }

    if (shareMethod === 'email') {
      const validEmails = validateEmailAddresses(emailAddresses)
      if (validEmails.length === 0) {
        return
      }
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
    const skippedCount = 0
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
          const requestBody: any = {
            fileId: item.id,
            permission,
          }

          if (shareMethod === 'email') {
            requestBody.emailAddresses = validateEmailAddresses(emailAddresses)
            requestBody.message = emailMessage
            requestBody.notifyByEmail = notifyByEmail
          } else if (shareMethod === 'link') {
            requestBody.createLink = true
            requestBody.requireSignIn = requireSignIn
            requestBody.allowDownload = allowDownload
          } else if (shareMethod === 'public') {
            requestBody.makePublic = true
            requestBody.allowDownload = allowDownload
          }

          const response = await fetch('/api/drive/files/share', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Share failed')
          }

          const data = await response.json()

          const result: ShareResult = {
            fileId: item.id,
            fileName: item.name,
            success: true,
            shareLink: data.shareLink,
          }

          results.push(result)
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

        // Copy links to clipboard if requested
        if (copyLinks && shareMethod === 'link') {
          const links = results
            .filter(r => r.success && r.shareLink)
            .map(r => `${r.fileName}: ${r.shareLink}`)
            .join('\n')

          if (links) {
            navigator.clipboard.writeText(links)
            toast.success('Share links copied to clipboard')
          }
        }

        onConfirm?.()
      } else {
        toast.error('Share operation failed')
      }
    }
  }

  const renderSetupStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Share Settings</h3>
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

        <ScrollArea className="max-h-32">
          <div className="space-y-1">
            {selectedItems.slice(0, 5).map(item => (
              <div key={item.id} className="text-muted-foreground flex items-center gap-2 text-sm">
                {item.isFolder ? <Folder className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                <span className="truncate">{item.name}</span>
              </div>
            ))}
            {selectedItems.length > 5 && (
              <div className="text-muted-foreground text-center text-sm">
                +{selectedItems.length - 5} more items
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Share Method</Label>
        <RadioGroup
          value={shareMethod}
          onValueChange={value => setShareMethod(value as ShareMethod)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="link" id="link" />
            <Label htmlFor="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Share Link
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email" id="email" />
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Invitation
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Make Public
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Permission Level</Label>
        <RadioGroup
          value={permission}
          onValueChange={value => setPermission(value as Permission)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="viewer" id="viewer" />
            <Label htmlFor="viewer" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Viewer (can view and comment)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="commenter" id="commenter" />
            <Label htmlFor="commenter" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Commenter (can comment)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="editor" id="editor" />
            <Label htmlFor="editor" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Editor (can edit)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Method-specific options */}
      <div className="space-y-4">
        {shareMethod === 'email' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="emailAddresses">Email Addresses</Label>
              <Textarea
                id="emailAddresses"
                placeholder="Enter email addresses (comma or line separated)"
                value={emailAddresses}
                onChange={e => setEmailAddresses(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailMessage">Message (Optional)</Label>
              <Textarea
                id="emailMessage"
                placeholder="Add a personal message..."
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="notifyByEmail"
                checked={notifyByEmail}
                onCheckedChange={setNotifyByEmail}
              />
              <Label htmlFor="notifyByEmail" className="text-sm">
                Send email notifications
              </Label>
            </div>
          </div>
        )}

        {shareMethod === 'link' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="requireSignIn"
                checked={requireSignIn}
                onCheckedChange={setRequireSignIn}
              />
              <Label htmlFor="requireSignIn" className="text-sm">
                Require sign-in to access
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="allowDownload"
                checked={allowDownload}
                onCheckedChange={setAllowDownload}
              />
              <Label htmlFor="allowDownload" className="text-sm">
                Allow download
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="copyLinks" checked={copyLinks} onCheckedChange={setCopyLinks} />
              <Label htmlFor="copyLinks" className="text-sm">
                Copy links to clipboard after sharing
              </Label>
            </div>
          </div>
        )}

        {shareMethod === 'public' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Making files public allows anyone on the internet to access them
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="allowDownloadPublic"
                checked={allowDownload}
                onCheckedChange={setAllowDownload}
              />
              <Label htmlFor="allowDownloadPublic" className="text-sm">
                Allow download
              </Label>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="h-4 w-4" />
            <span>Privacy & Security</span>
          </div>
          <div>• Shared files retain their original permissions</div>
          <div>• You can revoke access at any time</div>
          <div>• Recipients can only access shared items</div>
          <div>• All sharing activity is logged</div>
        </div>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
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
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ArrowRight className="h-4 w-4" />
            <span className="truncate">Sharing: {progress.currentFile}</span>
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

  const renderCompletedStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold">
          {isCancelled ? 'Share Operation Cancelled' : 'Items Shared Successfully'}
        </h3>
      </div>

      {!isCancelled && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div>✓ Successfully shared {progress.success} item(s)</div>
            <div>
              ✓ {shareMethod === 'email' ? 'Email invitations sent' : 'Share links generated'}
            </div>
            <div>✓ Recipients can access files immediately</div>
          </div>
        </div>
      )}

      {shareResults.length > 0 && shareMethod === 'link' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Share Links</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const links = shareResults
                  .filter(r => r.success && r.shareLink)
                  .map(r => `${r.fileName}: ${r.shareLink}`)
                  .join('\n')

                if (links) {
                  navigator.clipboard.writeText(links)
                  toast.success('Links copied to clipboard')
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All Links
            </Button>
          </div>

          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {shareResults.map((result, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="truncate font-medium">{result.fileName}</span>
                  </div>

                  {result.success && result.shareLink && (
                    <div className="ml-6 flex items-center gap-2">
                      <Input value={result.shareLink} readOnly className="font-mono text-xs" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(result.shareLink!)
                          toast.success('Link copied')
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
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

      {!isCancelled && progress.success > 0 && (
        <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20">
          <div className="text-sm text-amber-700 dark:text-amber-300">
            💡 Tip: You can manage sharing permissions in Google Drive settings
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
            <Button onClick={handleShare} disabled={selectedItems.length === 0}>
              Share Items
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
            <BottomSheetTitle>Share Items</BottomSheetTitle>
            <BottomSheetDescription>
              Share selected items with others via links, email, or public access.
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
          <DialogTitle>Share Items</DialogTitle>
          <DialogDescription>
            Share selected items with others via links, email, or public access.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ItemsShareDialog
export { ItemsShareDialog }
