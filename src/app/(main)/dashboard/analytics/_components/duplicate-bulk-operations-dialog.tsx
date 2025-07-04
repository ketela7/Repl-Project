'use client'

import { useState, Suspense } from 'react'
import {
  Settings,
  FileText,
  Trash2,
  Move,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
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
import { ItemsDeleteDialog } from '@/components/lazy-imports'
import { ItemsMoveDialog } from '@/components/lazy-imports'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/google-drive/utils'

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

  // Dialog states for actual operations
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)

  const totalGroups = duplicateGroups.length
  const totalFiles = duplicateGroups.reduce((sum, group) => sum + group.files.length, 0)
  const totalWastedSpace = duplicateGroups.reduce((sum, group) => sum + group.wastedSpace, 0)

  // Reset state when dialog opens/closes
  const handleClose = () => {
    setStep('selection')
    setSelectedCriteria('newest')
    setSelectedOperation(null)
    setSelectedDestination(null)
    setIsDeleteDialogOpen(false)
    setIsMoveDialogOpen(false)
    onClose()
  }

  // Transform duplicate groups into files for operations
  const getSelectedFilesForOperation = () => {
    const allSelectedFiles: any[] = []

    duplicateGroups.forEach(group => {
      const sortedFiles = [...group.files].sort((a, b) => {
        switch (selectedCriteria) {
          case 'newest':
            const timeA = new Date(a.modifiedTime || 0).getTime()
            const timeB = new Date(b.modifiedTime || 0).getTime()
            return timeB - timeA
          case 'oldest':
            const timeOldA = new Date(a.modifiedTime || 0).getTime()
            const timeOldB = new Date(b.modifiedTime || 0).getTime()
            return timeOldA - timeOldB
          case 'largest':
            const sizeA = parseInt(a.size?.toString() || '0', 10)
            const sizeB = parseInt(b.size?.toString() || '0', 10)
            return sizeB - sizeA
          case 'smallest':
            const sizeSmalA = parseInt(a.size?.toString() || '0', 10)
            const sizeSmalB = parseInt(b.size?.toString() || '0', 10)
            return sizeSmalA - sizeSmalB
          default:
            return 0
        }
      })

      // Skip the first file (keep it), select the rest for operation
      const filesToSelect = sortedFiles.slice(1)

      // Transform to match expected dialog format
      filesToSelect.forEach(file => {
        allSelectedFiles.push({
          id: file.id,
          name: file.name,
          size: file.size,
          mimeType: 'application/octet-stream', // Default since we don't have mimeType
          modifiedTime: file.modifiedTime,
          webViewLink: file.webViewLink,
          canDelete: true,
          canTrash: true,
          canMove: true,
          canCopy: true,
          canShare: true,
          canRename: true,
          canExport: true,
          canDownload: true,
          isFolder: false,
        })
      })
    })

    return allSelectedFiles
  }

  const exportToTXT = () => {
    const selectedFiles = getSelectedFilesForOperation()
    const timestamp = new Date().toLocaleString()

    const content = [
      'Google Drive Duplicate Files Report',
      '='.repeat(40),
      `Generated: ${timestamp}`,
      `Selection Criteria: ${SELECTION_OPTIONS.find(o => o.id === selectedCriteria)?.label}`,
      '',
      'Summary:',
      `- Total duplicate groups: ${totalGroups}`,
      `- Total files in groups: ${totalFiles}`,
      `- Files selected for action: ${selectedFiles.length}`,
      `- Total wasted space: ${formatFileSize(totalWastedSpace)}`,
      '',
      'Duplicate Groups:',
      '='.repeat(40),
    ]

    duplicateGroups.forEach((group, index) => {
      content.push(
        `\nGroup ${index + 1}: ${group.type === 'md5' ? 'Identical Files' : 'Same Name Files'}`,
      )
      content.push(`Identifier: ${group.identifier}`)
      content.push(`Files in group: ${group.files.length}`)
      content.push(`Wasted space: ${formatFileSize(group.wastedSpace)}`)
      content.push('Files:')

      group.files.forEach((file, fileIndex) => {
        const size = parseInt(file.size?.toString() || '0', 10)
        content.push(`  ${fileIndex + 1}. ${file.name}`)
        content.push(`     Size: ${formatFileSize(size)}`)
        content.push(`     Modified: ${file.modifiedTime || 'Unknown'}`)
        content.push(`     ID: ${file.id}`)
      })
    })

    const blob = new Blob([content.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `duplicate-files-report-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
    switch (operationId) {
      case 'export-txt':
        exportToTXT()
        handleClose()
        break
      case 'delete-duplicates':
        // Open delete dialog with selected files
        setIsDeleteDialogOpen(true)
        break
      case 'move-destination':
        // Open move dialog with selected files
        setIsMoveDialogOpen(true)
        break
    }
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

  const selectedFiles = getSelectedFilesForOperation()

  if (isMobile) {
    return (
      <>
        <BottomSheet open={isOpen} onOpenChange={handleClose}>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {getStepTitle()}
              </BottomSheetTitle>
              <BottomSheetDescription>{getStepDescription()}</BottomSheetDescription>
            </BottomSheetHeader>
            <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">{renderContent()}</div>
          </BottomSheetContent>
        </BottomSheet>

        {/* Delete Dialog */}
        <Suspense fallback={<div className="sr-only">Loading delete dialog...</div>}>
          <ItemsDeleteDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            selectedItems={selectedFiles}
          />
        </Suspense>

        {/* Move Dialog */}
        <Suspense fallback={<div className="sr-only">Loading move dialog...</div>}>
          <ItemsMoveDialog
            isOpen={isMoveDialogOpen}
            onClose={() => setIsMoveDialogOpen(false)}
            selectedItems={selectedFiles}
            onConfirm={() => {
              setIsMoveDialogOpen(false)
              handleClose()
            }}
          />
        </Suspense>
      </>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {getStepTitle()}
            </DialogTitle>
            <DialogDescription>{getStepDescription()}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Suspense fallback={<div className="sr-only">Loading delete dialog...</div>}>
        <ItemsDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          selectedItems={selectedFiles}
        />
      </Suspense>

      {/* Move Dialog */}
      <Suspense fallback={<div className="sr-only">Loading move dialog...</div>}>
        <ItemsMoveDialog
          isOpen={isMoveDialogOpen}
          onClose={() => setIsMoveDialogOpen(false)}
          selectedItems={selectedFiles}
          onConfirm={() => {
            setIsMoveDialogOpen(false)
            handleClose()
          }}
        />
      </Suspense>
    </>
  )
}
