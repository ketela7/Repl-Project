'use client'

import { useState } from 'react'
import { Copy, Settings, Trash2, Download, Move, Share2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/use-mobile'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface DuplicateGroup {
  identifier: string
  type: 'md5' | 'filename'
  files: Array<{
    id: string
    name: string
    size?: string | number
    modifiedTime?: string
    webViewLink?: string
  }>
  totalSize: number
  wastedSpace: number
}

interface DuplicateBulkOperationsDialogProps {
  isOpen: boolean
  onClose: () => void
  duplicateGroups: DuplicateGroup[]
}

interface OperationOption {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'destructive'
  requiresSelection?: boolean
}

const OPERATION_OPTIONS: OperationOption[] = [
  {
    id: 'delete-oldest',
    label: 'Delete Oldest Files',
    description: 'Keep the newest file in each duplicate group',
    icon: Trash2,
    variant: 'destructive',
  },
  {
    id: 'delete-smallest',
    label: 'Delete Smallest Files',
    description: 'Keep the largest file in each duplicate group',
    icon: Trash2,
    variant: 'destructive',
  },
  {
    id: 'move-duplicates',
    label: 'Move to Folder',
    description: 'Move all duplicate files to a specific folder',
    icon: Move,
    variant: 'default',
  },
  {
    id: 'download-all',
    label: 'Download All',
    description: 'Download all duplicate files for manual review',
    icon: Download,
    variant: 'default',
  },
  {
    id: 'share-duplicates',
    label: 'Share Access',
    description: 'Share all duplicate files with specific users',
    icon: Share2,
    variant: 'default',
  },
]

export function DuplicateBulkOperationsDialog({
  isOpen,
  onClose,
  duplicateGroups,
}: DuplicateBulkOperationsDialogProps) {
  const isMobile = useIsMobile()
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null)

  const totalGroups = duplicateGroups.length
  const totalFiles = duplicateGroups.reduce((sum, group) => sum + group.files.length, 0)
  const totalWastedSpace = duplicateGroups.reduce((sum, group) => sum + group.wastedSpace, 0)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const handleOperationSelect = (operationId: string) => {
    setSelectedOperation(operationId)
    // TODO: Implement specific operation logic
    console.log('Selected operation:', operationId, 'for', totalGroups, 'duplicate groups')
    onClose()
  }

  const renderContent = () => (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <h4 className="mb-2 font-semibold">Duplicate Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Groups</span>
            <div className="font-semibold">{totalGroups}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Total Files</span>
            <div className="font-semibold">{totalFiles}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Wasted Space</span>
            <div className="font-semibold text-destructive">{formatFileSize(totalWastedSpace)}</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Operation Options */}
      <div className="space-y-2">
        <h4 className="font-semibold">Available Actions</h4>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {OPERATION_OPTIONS.map((operation) => {
              const Icon = operation.icon
              return (
                <Button
                  key={operation.id}
                  variant={operation.variant}
                  className={cn(
                    'h-auto w-full justify-start p-3 text-left',
                    operation.variant === 'destructive' && 'hover:bg-destructive/90'
                  )}
                  onClick={() => handleOperationSelect(operation.id)}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="font-medium">{operation.label}</div>
                      <div className="text-xs opacity-80">{operation.description}</div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Review carefully before proceeding
          </p>
          <p className="text-amber-700 dark:text-amber-300">
            Bulk operations on duplicate files can affect many files at once. Make sure you have backups
            if needed.
          </p>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={onClose}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Duplicate File Actions
            </BottomSheetTitle>
            <BottomSheetDescription>
              Choose an action to apply to all {totalGroups} duplicate groups ({totalFiles} files)
            </BottomSheetDescription>
          </BottomSheetHeader>
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">
            {renderContent()}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate File Actions
          </DialogTitle>
          <DialogDescription>
            Choose an action to apply to all {totalGroups} duplicate groups ({totalFiles} files)
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}