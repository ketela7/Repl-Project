'use client'

import { useState } from 'react'
import { Edit3, Hash, Calendar, AlignLeft, Code2, Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn, successToast, errorToast } from '@/lib/utils'

interface ItemsRenameDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (renamePattern: string, renameType: string) => void
  selectedItems: Array<{
    id: string
    name: string
    isFolder: boolean
    mimeType?: string
  }>
}

const RENAME_TYPES = [
  {
    id: 'prefix',
    name: 'Add Prefix',
    description: 'Add text before the filename',
    icon: AlignLeft,
    example: 'prefix_filename.txt',
    placeholder: 'Enter prefix text...',
  },
  {
    id: 'suffix',
    name: 'Add Suffix',
    description: 'Add text before file extension',
    icon: AlignLeft,
    example: 'filename_suffix.txt',
    placeholder: 'Enter suffix text...',
  },
  {
    id: 'numbering',
    name: 'Sequential Numbering',
    description: 'Add numbers in sequence',
    icon: Hash,
    example: 'filename (1).txt, filename (2).txt',
    placeholder: 'Enter base name...',
  },
  {
    id: 'timestamp',
    name: 'Add Timestamp',
    description: 'Add current date and time',
    icon: Calendar,
    example: 'filename_2024-01-15_14-30.txt',
    placeholder: 'No input required',
  },
  {
    id: 'replace',
    name: 'Find & Replace',
    description: 'Replace specific text',
    icon: Edit3,
    example: 'old text → new text',
    placeholder: 'old_text|new_text',
  },
  {
    id: 'regex',
    name: 'Regular Expression',
    description: 'Advanced pattern replacement',
    icon: Code2,
    example: '/pattern/replacement/flags',
    placeholder: 'Enter regex pattern...',
  },
]

function ItemsRenameDialog({ isOpen, onClose, onConfirm, selectedItems }: ItemsRenameDialogProps) {
  const [renameType, setRenameType] = useState('prefix')
  const [renamePattern, setRenamePattern] = useState('')
  const [regexPattern, setRegexPattern] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const isMobile = useIsMobile()

  const handleRename = async () => {
    const pattern = renameType === 'regex' ? regexPattern.trim() : renamePattern.trim()

    if (!pattern && renameType !== 'timestamp') return
    if (isProcessing) return

    setIsProcessing(true)
    setIsLoading(true)
    setProcessedCount(0)
    setFailedCount(0)
    setIsCompleted(false)

    try {
      const response = await fetch('/api/drive/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({ id: item.id, name: item.name })),
          namePrefix: pattern,
          renameType: renameType,
        }),
      })

      const result = await response.json()

      setProcessedCount(result.processed || 0)
      setFailedCount(result.failed || 0)
      setIsCompleted(true)

      if (result.success) {
        successToast(`${result.processed} item${result.processed > 1 ? 's' : ''} renamed successfully`)
        onConfirm(pattern, renameType)
        // Don't close immediately, show results briefly
        setTimeout(() => {
          if (isCompleted) onClose()
        }, 1500)
      } else if (result.processed > 0 && result.failed > 0) {
        // Partial success
        successToast(`${result.processed} items renamed successfully, ${result.failed} failed`)
        onConfirm(pattern, renameType)
        setTimeout(() => {
          if (isCompleted) onClose()
        }, 2000)
      } else {
        throw new Error(result.error || result.errors?.[0]?.error || 'Failed to rename items')
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to rename items')
      setIsCompleted(true)
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (isProcessing) return
    setRenameType('prefix')
    setRenamePattern('')
    setRegexPattern('')
    setShowPreview(false)
    setIsCompleted(false)
    setProcessedCount(0)
    setFailedCount(0)
    onClose()
  }

  const selectedRenameType = RENAME_TYPES.find((type) => type.id === renameType)

  // Preview function that matches API logic
  const generatePreviewName = (originalName: string, index: number): string => {
    const pattern = renameType === 'regex' ? regexPattern.trim() : renamePattern.trim()
    const extension = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : ''
    const nameWithoutExt = extension ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName

    switch (renameType) {
      case 'prefix':
        return pattern ? `${pattern}_${originalName}` : originalName

      case 'suffix':
        return pattern ? (extension ? `${nameWithoutExt}_${pattern}${extension}` : `${originalName}_${pattern}`) : originalName

      case 'numbering':
        const basePattern = pattern || 'File'
        return extension ? `${basePattern} (${index + 1})${extension}` : `${basePattern} (${index + 1})`

      case 'timestamp':
        const now = new Date()
        const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '_').replace(/-/g, '')
        return extension ? `${nameWithoutExt}_${timestamp}${extension}` : `${originalName}_${timestamp}`

      case 'replace':
        if (!pattern.includes('|')) return originalName
        const [oldText, newText] = pattern.split('|')
        return originalName.replace(new RegExp(oldText, 'g'), newText)

      case 'regex':
        try {
          const regexMatch = pattern.match(/^\/(.+)\/(.*)\/([gimuy]*)$/)
          if (regexMatch) {
            const [, regPattern, replacement, flags] = regexMatch
            const regex = new RegExp(regPattern, flags)
            return originalName.replace(regex, replacement)
          }
          return originalName
        } catch (error) {
          return originalName
        }

      default:
        return originalName
    }
  }

  const renderContent = () => {
    // Show results if completed
    if (isCompleted) {
      return (
        <div className="space-y-6 text-center">
          {/* Results Header */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Edit3 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Rename Results</h3>
              <p className="text-muted-foreground text-sm">Review your rename operation results</p>
            </div>
          </div>

          {/* Results Summary */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">{processedCount}</div>
                <div className="text-muted-foreground text-sm">Renamed</div>
              </div>
              {failedCount > 0 && (
                <div className="rounded-lg border p-3">
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">{failedCount}</div>
                  <div className="text-muted-foreground text-sm">Failed</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Show processing state
    if (isProcessing) {
      return (
        <div className="space-y-6 text-center">
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Renaming Files...</h3>
              <p className="text-muted-foreground text-sm">
                Please wait while we rename {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Default content
    return (
      <div className="space-y-6">
        {/* Header Info */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <Edit3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Bulk Rename</h3>
            <p className="text-muted-foreground text-sm">
              Rename {selectedItems.length} item
              {selectedItems.length > 1 ? 's' : ''} using a consistent pattern
            </p>
          </div>
        </div>

        {/* File Count Badge */}
        <div className="text-center">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </Badge>
        </div>

        {/* Rename Type Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Rename method</Label>
          <RadioGroup value={renameType} onValueChange={setRenameType} className="space-y-3">
            {RENAME_TYPES.map((type) => {
              const IconComponent = type.icon
              return (
                <div key={type.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                  <Label htmlFor={type.id} className="flex-1 cursor-pointer space-y-1">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <div className="text-muted-foreground text-sm">{type.description}</div>
                    <div className="text-muted-foreground bg-muted rounded px-2 py-1 font-mono text-xs">Example: {type.example}</div>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>

        {/* Input Field */}
        {selectedRenameType && selectedRenameType.id !== 'timestamp' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">{selectedRenameType.id === 'regex' ? 'Regular Expression' : 'Pattern'}</Label>
            <Input
              type="text"
              value={selectedRenameType.id === 'regex' ? regexPattern : renamePattern}
              onChange={(e) => (selectedRenameType.id === 'regex' ? setRegexPattern(e.target.value) : setRenamePattern(e.target.value))}
              placeholder={selectedRenameType.placeholder}
              className={selectedRenameType.id === 'regex' ? 'font-mono' : ''}
            />
            {selectedRenameType.id === 'replace' && <div className="text-muted-foreground text-xs">Format: old_text|new_text (use | to separate old and new text)</div>}
            {selectedRenameType.id === 'regex' && <div className="text-muted-foreground text-xs">Advanced users only. Use JavaScript regex syntax: /pattern/replacement/flags</div>}
          </div>
        )}

        {/* Preview Section */}
        {selectedItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Preview (first 3 items)</Label>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="h-8 px-2">
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
            {showPreview && (
              <div className="space-y-2">
                <ul className="space-y-2">
                  {selectedItems.slice(0, 3).map((item) => (
                    <li key={item.id} className="bg-muted/50 rounded-lg border p-3 text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">
                          <span className="font-medium">Original:</span> {item.name}
                        </div>
                        <div className="text-foreground">
                          <span className="font-medium text-orange-600 dark:text-orange-400">New:</span>{' '}
                          <span className="rounded bg-orange-50 px-1 font-mono dark:bg-orange-950/20">{generatePreviewName(item.name, selectedItems.indexOf(item))}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                  {selectedItems.length > 3 && (
                    <li className="text-muted-foreground/70 flex items-center gap-2 italic">
                      <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                      and {selectedItems.length - 3} more items...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={onClose}>
        <BottomSheetContent className="max-h-[95vh] px-0">
          <BottomSheetHeader className="px-4 pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Edit3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Bulk Rename</div>
                <div className="text-muted-foreground text-sm font-normal">Bulk Rename Operation</div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={`${cn('grid gap-4')} px-4`}>
            <Button
              onClick={handleRename}
              disabled={isLoading || (renameType === 'regex' ? !regexPattern.trim() : !renamePattern.trim() && renameType !== 'timestamp')}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
              {isLoading ? 'Renaming...' : 'Rename All'}
            </Button>
            <Button variant="outline" onClick={onClose} className={cn('touch-target min-h-[44px] active:scale-95')}>
              Cancel
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Edit3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Bulk Rename</div>
              <div className="text-muted-foreground text-sm font-normal">Bulk Rename Operation</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">{renderContent()}</div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button onClick={handleRename} disabled={isLoading || (renameType === 'regex' ? !regexPattern.trim() : !renamePattern.trim() && renameType !== 'timestamp')} className="w-full sm:w-auto">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
            {isLoading ? 'Renaming...' : 'Rename All'}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ItemsRenameDialog }
export default ItemsRenameDialog
