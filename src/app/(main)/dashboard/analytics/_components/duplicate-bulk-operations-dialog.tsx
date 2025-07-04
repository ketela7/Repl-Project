'use client'

import { useState } from 'react'
import { Copy, FileText, Trash2, Move, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { DriveDestinationSelector } from '@/components/drive-destination-selector'
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

interface SelectionOption {
  id: string
  label: string
  description: string
}

const SELECTION_OPTIONS: SelectionOption[] = [
  {
    id: 'newest',
    label: 'Keep Newest Files',
    description: 'Keep the most recently modified file in each group',
  },
  {
    id: 'oldest',
    label: 'Keep Oldest Files',
    description: 'Keep the earliest created file in each group',
  },
  {
    id: 'largest',
    label: 'Keep Largest Files',
    description: 'Keep the file with the largest size in each group',
  },
  {
    id: 'smallest',
    label: 'Keep Smallest Files',
    description: 'Keep the file with the smallest size in each group',
  },
]

interface OperationOption {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'destructive'
}

const OPERATION_OPTIONS: OperationOption[] = [
  {
    id: 'export-txt',
    label: 'Export as TXT',
    description: 'Export duplicate file list as text file',
    icon: FileText,
    variant: 'default',
  },
  {
    id: 'delete-duplicates',
    label: 'Delete Duplicate Files',
    description: 'Delete selected duplicates based on your criteria',
    icon: Trash2,
    variant: 'destructive',
  },
  {
    id: 'move-destination',
    label: 'Move to Destination',
    description: 'Move duplicate files to a specific folder',
    icon: Move,
    variant: 'default',
  },
]

export function DuplicateBulkOperationsDialog({
  isOpen,
  onClose,
  duplicateGroups,
}: DuplicateBulkOperationsDialogProps) {
  const isMobile = useIsMobile()
  const [step, setStep] = useState<'selection' | 'operation' | 'destination'>('selection')
  const [selectedCriteria, setSelectedCriteria] = useState<string>('newest')
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)

  const totalGroups = duplicateGroups.length
  const totalFiles = duplicateGroups.reduce((sum, group) => sum + group.files.length, 0)
  const totalWastedSpace = duplicateGroups.reduce((sum, group) => sum + group.wastedSpace, 0)

  // Reset state when dialog opens/closes
  const handleClose = () => {
    setStep('selection')
    setSelectedCriteria('newest')
    setSelectedOperation(null)
    setSelectedDestination(null)
    onClose()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const handleCriteriaNext = () => {
    setStep('operation')
  }

  const handleOperationSelect = (operationId: string) => {
    setSelectedOperation(operationId)

    if (operationId === 'move-destination') {
      setStep('destination')
    } else {
      // Execute operation immediately for export-txt and delete-duplicates
      executeOperation(operationId)
    }
  }

  const executeOperation = (operationId: string) => {
    console.log('Executing operation:', operationId, 'with criteria:', selectedCriteria)
    console.log('Affecting', totalGroups, 'duplicate groups')

    // TODO: Implement actual operation logic
    switch (operationId) {
      case 'export-txt':
        console.log('Exporting duplicate list as TXT')
        break
      case 'delete-duplicates':
        console.log('Deleting duplicates based on criteria:', selectedCriteria)
        break
      case 'move-destination':
        console.log('Moving duplicates to destination:', selectedDestination)
        break
    }

    handleClose()
  }

  const handleDestinationSelect = (folderId: string, folderName?: string) => {
    setSelectedDestination(folderId)
  }

  const handleDestinationConfirm = () => {
    if (selectedDestination) {
      executeOperation('move-destination')
    }
  }

  const renderSelectionStep = () => (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="bg-muted/20 rounded-lg border p-4">
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
            <div className="text-destructive font-semibold">{formatFileSize(totalWastedSpace)}</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Selection Criteria */}
      <div className="space-y-3">
        <h4 className="font-semibold">Choose which files to keep</h4>
        <RadioGroup value={selectedCriteria} onValueChange={setSelectedCriteria}>
          <div className="space-y-2">
            {SELECTION_OPTIONS.map(option => (
              <div key={option.id} className="flex items-start space-x-3 rounded-lg border p-3">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-muted-foreground text-sm">{option.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleCriteriaNext} className="gap-2">
          Next: Choose Action
        </Button>
      </div>
    </div>
  )

  const renderOperationStep = () => (
    <div className="space-y-4">
      {/* Back button and selected criteria */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setStep('selection')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-muted-foreground text-sm">
          Selected:{' '}
          <span className="font-medium">
            {SELECTION_OPTIONS.find(o => o.id === selectedCriteria)?.label}
          </span>
        </div>
      </div>

      <Separator />

      {/* Operation Options */}
      <div className="space-y-3">
        <h4 className="font-semibold">Choose Action</h4>
        <div className="space-y-2">
          {OPERATION_OPTIONS.map(operation => {
            const Icon = operation.icon
            return (
              <Button
                key={operation.id}
                variant={operation.variant}
                className={cn(
                  'h-auto w-full justify-start p-3 text-left',
                  operation.variant === 'destructive' && 'hover:bg-destructive/90',
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
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Review carefully before proceeding
          </p>
          <p className="text-amber-700 dark:text-amber-300">
            Bulk operations on duplicate files can affect many files at once. Make sure you have
            backups if needed.
          </p>
        </div>
      </div>
    </div>
  )

  const renderDestinationStep = () => (
    <div className="space-y-4">
      {/* Back button and selected options */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setStep('operation')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-muted-foreground text-sm">Action: Move duplicate files</div>
      </div>

      <Separator />

      {/* Destination Selector */}
      <div className="space-y-3">
        <h4 className="font-semibold">Select Destination Folder</h4>
        <DriveDestinationSelector
          onSelect={handleDestinationSelect}
          selectedFolderId={selectedDestination || undefined}
        />
      </div>

      {selectedDestination && (
        <div className="flex justify-end">
          <Button onClick={handleDestinationConfirm} className="gap-2">
            <Move className="h-4 w-4" />
            Move Files
          </Button>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (step) {
      case 'selection':
        return renderSelectionStep()
      case 'operation':
        return renderOperationStep()
      case 'destination':
        return renderDestinationStep()
      default:
        return renderSelectionStep()
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'selection':
        return 'Select Files to Keep'
      case 'operation':
        return 'Choose Action'
      case 'destination':
        return 'Select Destination'
      default:
        return 'Duplicate File Actions'
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case 'selection':
        return `Choose which files to keep from ${totalGroups} duplicate groups (${totalFiles} files)`
      case 'operation':
        return 'Select what action to take with the duplicate files'
      case 'destination':
        return 'Choose where to move the duplicate files'
      default:
        return `Manage ${totalGroups} duplicate groups (${totalFiles} files)`
    }
  }

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={handleClose}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              {getStepTitle()}
            </BottomSheetTitle>
            <BottomSheetDescription>{getStepDescription()}</BottomSheetDescription>
          </BottomSheetHeader>
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">{renderContent()}</div>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
