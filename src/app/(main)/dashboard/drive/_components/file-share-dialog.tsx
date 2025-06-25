'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Share2, Users, Globe, Lock, Mail, Eye, Edit } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/bottom-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { successToast, errorToast, loadingToast } from '@/lib/utils'
import { copyToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'

interface FileShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: { id: string; name: string; type: 'file' | 'folder' } | null
  file?: { id: string; name: string; mimeType: string } | null
  items?: { id: string; name: string; type: 'file' | 'folder' }[]
  onShare?: (shareData: ShareData) => void
}

interface ShareData {
  action: 'get_share_link' | 'add_permission' | 'remove_permission'
  role: 'reader' | 'writer' | 'commenter'
  type: 'anyone' | 'anyoneWithLink' | 'domain' | 'user'
  emailAddress?: string
  message?: string
  allowFileDiscovery?: boolean
  expirationTime?: string
}

export function FileShareDialog({
  open,
  onOpenChange,
  file,
  item,
  items,
  onShare,
}: FileShareDialogProps) {
  const [shareType, setShareType] = useState<'link' | 'email'>('link')
  const [accessLevel, setAccessLevel] = useState<
    'reader' | 'writer' | 'commenter'
  >('reader')
  const [linkAccess, setLinkAccess] = useState<
    'anyone' | 'anyoneWithLink' | 'domain'
  >('anyoneWithLink')
  const [emailAddress, setEmailAddress] = useState('')
  const [message, setMessage] = useState('')
  const [allowDiscovery, setAllowDiscovery] = useState(false)
  const [expirationDays, setExpirationDays] = useState<string>('none')
  const [isLoading, setIsLoading] = useState(false)
  const isMobile = useIsMobile()

  const handleShare = async () => {
    if (!item && !items) return

    const loadingId = 'share-operation'

    try {
      setIsLoading(true)

      let shareData: ShareData

      if (shareType === 'link') {
        // Convert linkAccess to proper Google Drive API type
        let apiType
        switch (linkAccess) {
          case 'anyoneWithLink':
            apiType = 'anyone'
            break
          case 'anyone':
            apiType = 'anyone'
            break
          case 'domain':
            apiType = 'domain'
            break
          default:
            apiType = 'anyone'
        }

        shareData = {
          action: 'get_share_link',
          role: accessLevel,
          type: apiType as 'anyone' | 'anyoneWithLink' | 'domain' | 'user',
          allowFileDiscovery: allowDiscovery,
        }

        if (expirationDays && expirationDays !== 'none') {
          const expirationDate = new Date()
          expirationDate.setDate(
            expirationDate.getDate() + parseInt(expirationDays)
          )
          shareData.expirationTime = expirationDate.toISOString()
        }
      } else {
        if (!emailAddress.trim()) {
          errorToast.generic('Please enter an email address')
          return
        }

        shareData = {
          action: 'add_permission',
          role: accessLevel,
          type: 'user',
          emailAddress: emailAddress.trim(),
          message: message.trim(),
        }
      }

      // Handle bulk operations
      if (items && items.length > 1) {
        loadingToast.start(`Sharing ${items.length} items...`, loadingId)

        const results = []
        for (const currentItem of items) {
          try {
            const response = await fetch(
              `/api/drive/files/${currentItem.id}/share`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shareData),
              }
            )

            if (response.ok) {
              const result = await response.json()
              results.push({ item: currentItem, success: true, result })
            } else {
              results.push({
                item: currentItem,
                success: false,
                error: await response.text(),
              })
            }
          } catch (error) {
            results.push({
              item: currentItem,
              success: false,
              error: String(error),
            })
          }
        }

        const successCount = results.filter((r) => r.success).length
        const failCount = results.filter((r) => !r.success).length

        if (successCount === items.length) {
          loadingToast.success(
            `Successfully shared all ${successCount} items`,
            loadingId
          )
        } else if (successCount > 0) {
          toast(`Shared ${successCount} of ${items.length} items`, {
            description: 'Some items could not be shared',
          })
        } else {
          loadingToast.error(
            `Failed to share all ${failCount} items`,
            loadingId
          )
        }

        onOpenChange(false)
        return
      }

      // Handle single item
      if (shareType === 'link') {
        loadingToast.start(
          `Generating share link for "${item?.name || 'file'}"...`,
          loadingId
        )
      } else {
        loadingToast.start(
          `Sharing "${item?.name || 'file'}" with ${emailAddress}...`,
          loadingId
        )
      }

      const response = await fetch(`/api/drive/files/${item?.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData),
      })

      if (!response.ok) {
        const errorData = await response.json()

        if (errorData.needsReauth) {
          loadingToast.error('Google Drive access expired', loadingId)
          errorToast.driveAccessDenied()
          window.location.reload()
          return
        }

        if (response.status === 403) {
          loadingToast.error(
            `Permission denied for "${item?.name || 'file'}"`,
            loadingId
          )
          errorToast.permissionDenied()
          return
        }

        throw new Error(errorData.error || 'Failed to share item')
      }

      const result = await response.json()

      if (shareType === 'link' && result.webViewLink) {
        const success = await copyToClipboard(result.webViewLink)
        if (success) {
          loadingToast.success(
            `Share link for "${item?.name || 'file'}" copied to clipboard`,
            loadingId
          )
        } else {
          loadingToast.success(
            `Share link generated for "${item?.name || 'file'}"`,
            loadingId
          )
          successToast.generic(`Link: ${result.webViewLink}`, {
            description: 'Click to copy manually',
            duration: 8000,
          })
        }
      } else if (shareType === 'email') {
        loadingToast.success(
          `"${item?.name || 'file'}" shared with ${emailAddress}`,
          loadingId
        )
        successToast.shared(1)
      }

      onOpenChange(false)

      // Reset form
      setEmailAddress('')
      setMessage('')
      setExpirationDays('none')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
      }
      loadingToast.error('Failed to share item', loadingId)
      errorToast.apiError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!item) return null

  const renderContent = () => (
    <>
      <div className="space-y-4 pt-2">
        <div className="text-base">
          {items && items.length > 1
            ? `Configure sharing settings for ${items.length} selected items.`
            : `Configure sharing settings and privacy options for this ${item.type}.`}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-slate-200 dark:bg-slate-700">
            {items && items.length > 1 ? (
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            ) : item.type === 'folder' ? (
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            ) : (
              <Share2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {items && items.length > 1
                ? `${items.length} selected items`
                : item.name}
            </div>
            <div className="text-muted-foreground text-xs capitalize">
              {items && items.length > 1 ? 'bulk operation' : item.type}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Share Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Share method</Label>
            <RadioGroup
              value={shareType}
              onValueChange={(value: 'link' | 'email') => setShareType(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label
                  htmlFor="link"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Share link
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label
                  htmlFor="email"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Invite people
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Access Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Access level</Label>
            <Select
              value={accessLevel}
              onValueChange={(value: any) => setAccessLevel(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Viewer</p>
                      <p className="text-muted-foreground text-xs">
                        Can view only
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="commenter">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Commenter</p>
                      <p className="text-muted-foreground text-xs">
                        Can view and comment
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="writer">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Editor</p>
                      <p className="text-muted-foreground text-xs">
                        Can view, comment, and edit
                      </p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Link Sharing Options */}
          {shareType === 'link' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Who has access</Label>
                <Select
                  value={linkAccess}
                  onValueChange={(value: any) => setLinkAccess(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anyoneWithLink">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Anyone with the link</p>
                          <p className="text-muted-foreground text-xs">
                            Anyone who has the link can access
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="anyone">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Anyone on the internet</p>
                          <p className="text-muted-foreground text-xs">
                            Public on the web
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="domain">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <div>
                          <p className="font-medium">
                            Anyone in your organization
                          </p>
                          <p className="text-muted-foreground text-xs">
                            People in your organization can find and access
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Link expiration (optional)
                </Label>
                <Select
                  value={expirationDays}
                  onValueChange={setExpirationDays}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No expiration</SelectItem>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Email Sharing Options */}
          {shareType === 'email' && (
            <>
              <div className="space-y-3">
                <Label htmlFor="email-input" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email-input"
                  type="email"
                  placeholder="Enter email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className={cn('min-h-[44px]')}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="message-input" className="text-sm font-medium">
                  Message (optional)
                </Label>
                <Input
                  id="message-input"
                  placeholder="Add a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={cn('min-h-[44px]')}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
          <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
          <div className="text-sm text-green-800 dark:text-green-200">
            {shareType === 'link'
              ? 'Share link will be generated and copied to clipboard.'
              : 'Invitation will be sent to the specified email address.'}
          </div>
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="flex max-h-[90vh] flex-col">
          <BottomSheetHeader className="flex-shrink-0 pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {items && items.length > 1
                    ? `Share ${items.length} Items`
                    : `Share ${item.type}`}
                </div>
                <div className="text-muted-foreground text-sm font-normal">
                  Configure sharing settings
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {renderContent()}
          </div>

          <BottomSheetFooter className="bg-background safe-area-bottom flex-shrink-0 border-t p-4">
            <div className="grid w-full grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="min-h-[48px] touch-manipulation text-base font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={isLoading}
                className="min-h-[48px] touch-manipulation text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Share2 className="mr-2 h-4 w-4 animate-pulse" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    {shareType === 'link' ? 'Copy Link' : 'Send Invitation'}
                  </>
                )}
              </Button>
            </div>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Share {item.type}</div>
              <div className="text-muted-foreground text-sm font-normal">
                Configure sharing settings
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-2">
            {renderContent()}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isLoading}>
            {isLoading
              ? 'Sharing...'
              : shareType === 'link'
                ? 'Copy Link'
                : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
