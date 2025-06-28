'use client'

import { useState } from 'react'
import { Share2, Globe, Users, Lock, Eye, Edit } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/lib/hooks/use-mobile'

interface ItemsShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (accessLevel: string, linkAccess: string) => void
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

function ItemsShareDialog({ open, onOpenChange, onConfirm, selectedItems }: ItemsShareDialogProps) {
  const [accessLevel, setAccessLevel] = useState<'reader' | 'writer' | 'commenter'>('reader')
  const [linkAccess, setLinkAccess] = useState<'anyone' | 'anyoneWithLink' | 'domain'>('anyoneWithLink')
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [shareResults, setShareResults] = useState<ShareResult[]>([])
  const isMobile = useIsMobile()

  const handleBulkShare = async () => {
    setIsLoading(true)
    try {
      onConfirm(accessLevel, linkAccess)
      // Mock results for demo
      const mockResults: ShareResult[] = selectedItems.map((item) => ({
        id: item.id,
        name: item.name,
        success: true,
        shareLink: `https://drive.google.com/file/d/${item.id}/view`,
      }))
      setShareResults(mockResults)
      setShowResults(true)
    } catch (error) {
      toast.error('Failed to generate share links')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    const links = shareResults
      .filter((r) => r.success && r.shareLink)
      .map((r) => `${r.name}: ${r.shareLink}`)
      .join('\n')

    try {
      await navigator.clipboard.writeText(links)
      toast.success('Share links copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const exportToTxt = () => {
    const content = shareResults.map((r) => `${r.name}: ${r.success ? r.shareLink : 'Failed'}`).join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'share-links.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToCsv = () => {
    const headers = 'Name,Share Link,Status\n'
    const content = shareResults.map((r) => `"${r.name}","${r.shareLink || ''}","${r.success ? 'Success' : 'Failed'}"`).join('\n')

    const blob = new Blob([headers + content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'share-links.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJson = () => {
    const content = JSON.stringify(shareResults, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'share-links.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const fileCount = selectedItems.filter((item) => !item.isFolder).length
  const folderCount = selectedItems.filter((item) => item.isFolder).length

  const renderContent = () => (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Share2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Share Items</h3>
          <p className="text-muted-foreground text-sm">
            Generate share links for {selectedItems.length} item
            {selectedItems.length > 1 ? 's' : ''} with customizable privacy settings
          </p>
        </div>
      </div>

      {/* File Count Badges */}
      <div className="flex justify-center gap-2">
        <Badge variant="secondary" className="px-3 py-1">
          {selectedItems.length} total
        </Badge>
        {fileCount > 0 && (
          <Badge variant="outline" className="px-3 py-1">
            {fileCount} file{fileCount > 1 ? 's' : ''}
          </Badge>
        )}
        {folderCount > 0 && (
          <Badge variant="outline" className="px-3 py-1">
            {folderCount} folder{folderCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Selected Items Preview */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Items to share</Label>
        <div className="bg-muted/50 max-h-32 space-y-1 overflow-y-auto rounded-lg border p-3">
          {selectedItems.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <Share2 className="h-4 w-4 flex-shrink-0 text-purple-500" />
              <span className="truncate" title={item.name}>
                {item.name}
              </span>
            </div>
          ))}
          {selectedItems.length > 5 && (
            <div className="text-muted-foreground text-center text-xs italic">and {selectedItems.length - 5} more items...</div>
          )}
        </div>
      </div>

      {/* Share Settings */}
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Access level</Label>
          <Select value={accessLevel} onValueChange={(value: 'reader' | 'writer' | 'commenter') => setAccessLevel(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reader">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Viewer</p>
                    <p className="text-muted-foreground text-xs">Can view only</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="commenter">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Commenter</p>
                    <p className="text-muted-foreground text-xs">Can view and comment</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="writer">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Editor</p>
                    <p className="text-muted-foreground text-xs">Can view, comment, and edit</p>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Who has access</Label>
          <Select value={linkAccess} onValueChange={(value: 'anyone' | 'anyoneWithLink' | 'domain') => setLinkAccess(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anyoneWithLink">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Anyone with the link</p>
                    <p className="text-muted-foreground text-xs">Anyone who has the link can access</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="anyone">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Anyone on the internet</p>
                    <p className="text-muted-foreground text-xs">Public on the web</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="domain">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Anyone in your organization</p>
                    <p className="text-muted-foreground text-xs">People in your organization can find and access</p>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
        <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="text-sm text-green-800 dark:text-green-200">
          Share links will be generated for all selected items with the chosen access settings.
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="flex max-h-[90vh] flex-col">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Share Items</div>
                <div className="text-muted-foreground text-sm font-normal">Bulk share operation</div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">{renderContent()}</div>

          <BottomSheetFooter className="bg-background flex-shrink-0 border-t p-4">
            <div className="grid w-full gap-4">
              <Button onClick={handleBulkShare} disabled={isLoading || selectedItems.length === 0} className="min-h-[48px] text-base font-medium">
                {isLoading ? (
                  <>
                    <Share2 className="mr-2 h-4 w-4 animate-pulse" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Generate {selectedItems.length} Share Links
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="min-h-[48px] text-base font-medium">
                Cancel
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
              <div className="text-lg font-semibold">Share Items</div>
              <div className="text-muted-foreground text-sm font-normal">Bulk share operation</div>
            </div>
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-2">{renderContent()}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button onClick={handleBulkShare} disabled={isLoading || selectedItems.length === 0} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Share2 className="mr-2 h-4 w-4 animate-pulse" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Generate Share Links
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ItemsShareDialog }
export default ItemsShareDialog
