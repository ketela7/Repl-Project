'use client'

import { useState } from 'react'
import { Users, Clock, Trash2, FileText, Table, Code } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { formatFileSize } from '@/lib/google-drive/utils'

interface DuplicateFile {
  id: string
  name: string
  size: number
  mimeType: string
  modifiedTime?: string
  webViewLink?: string
  canDelete?: boolean
  canTrash?: boolean
  canMove?: boolean
  canCopy?: boolean
  canShare?: boolean
  canRename?: boolean
  canExport?: boolean
  canDownload?: boolean
  isFolder?: boolean
}

interface DuplicateGroup {
  identifier: string
  type: 'md5' | 'filename'
  files: DuplicateFile[]
  totalSize: number
  wastedSpace: number
}

interface DuplicateActionDialogProps {
  isOpen: boolean
  onClose: () => void
  duplicateGroup: DuplicateGroup
}

type SelectionMode = 'all' | 'newest' | 'oldest' | 'largest' | 'smallest'

export function DuplicateActionDialog({
  isOpen,
  onClose,
  duplicateGroup,
}: DuplicateActionDialogProps) {
  const isMobile = useIsMobile()
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('newest')

  // Smart selection logic
  const getSelectedFiles = (mode: SelectionMode): DuplicateFile[] => {
    const files = [...duplicateGroup.files]

    switch (mode) {
      case 'all':
        return files

      case 'newest':
        // Keep newest, select others for deletion
        const sortedByDate = files.sort((a, b) => {
          const dateA = new Date(a.modifiedTime || 0).getTime()
          const dateB = new Date(b.modifiedTime || 0).getTime()
          return dateB - dateA
        })
        return sortedByDate.slice(1) // Skip the newest (first after sort)

      case 'oldest':
        // Keep oldest, select others for deletion
        const sortedByDateAsc = files.sort((a, b) => {
          const dateA = new Date(a.modifiedTime || 0).getTime()
          const dateB = new Date(b.modifiedTime || 0).getTime()
          return dateA - dateB
        })
        return sortedByDateAsc.slice(1) // Skip the oldest (first after sort)

      case 'largest':
        // Keep largest, select others for deletion
        const sortedBySize = files.sort((a, b) => (b.size || 0) - (a.size || 0))
        return sortedBySize.slice(1) // Skip the largest (first after sort)

      case 'smallest':
        // Keep smallest, select others for deletion
        const sortedBySizeAsc = files.sort((a, b) => (a.size || 0) - (b.size || 0))
        return sortedBySizeAsc.slice(1) // Skip the smallest (first after sort)

      default:
        return []
    }
  }

  const handleSelectionChange = (mode: SelectionMode) => {
    setSelectionMode(mode)
  }

  // Export functionality for duplicate reports
  const exportToCSV = () => {
    const filesToProcess = getSelectedFiles(selectionMode)
    const headers = ['Name', 'Size (bytes)', 'Size (readable)', 'MIME Type', 'Modified Time', 'ID']
    const csvContent = [
      headers.join(','),
      ...filesToProcess.map(file =>
        [
          `"${file.name.replace(/"/g, '""')}"`,
          file.size || 0,
          formatFileSize(file.size || 0),
          `"${file.mimeType.replace(/"/g, '""')}"`,
          file.modifiedTime || '',
          file.id,
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `duplicate-${duplicateGroup.type}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const filesToProcess = getSelectedFiles(selectionMode)
    const exportData = {
      duplicateGroup: {
        type: duplicateGroup.type,
        totalFiles: duplicateGroup.files.length,
        totalSize: duplicateGroup.totalSize,
        wastedSpace: duplicateGroup.wastedSpace,
        exportedAt: new Date().toISOString(),
      },
      selectedFiles: filesToProcess.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        sizeReadable: formatFileSize(file.size || 0),
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `duplicate-${duplicateGroup.type}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToTXT = () => {
    const filesToProcess = getSelectedFiles(selectionMode)
    const txtContent = [
      `Duplicate Files Report - ${duplicateGroup.type === 'md5' ? 'Identical Files' : 'Same Name Files'}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Files: ${duplicateGroup.files.length}`,
      `Total Size: ${formatFileSize(duplicateGroup.totalSize)}`,
      `Wasted Space: ${formatFileSize(duplicateGroup.wastedSpace)}`,
      `Selection Mode: ${selectionMode}`,
      `Selected Files: ${filesToProcess.length}`,
      '',
      'Selected Files for Processing:',
      '=====================================',
      ...filesToProcess.map((file, index) =>
        [
          `${index + 1}. ${file.name}`,
          `   Size: ${formatFileSize(file.size || 0)}`,
          `   Type: ${file.mimeType}`,
          `   Modified: ${file.modifiedTime || 'Unknown'}`,
          `   ID: ${file.id}`,
          '',
        ].join('\n'),
      ),
    ].join('\n')

    const blob = new Blob([txtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `duplicate-${duplicateGroup.type}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSelectionPreview = () => {
    const selected = getSelectedFiles(selectionMode)
    const kept = duplicateGroup.files.filter(f => !selected.find(s => s.id === f.id))

    return {
      selected,
      kept,
      spaceSaved: selected.reduce((sum, file) => sum + (file.size || 0), 0),
    }
  }

  const preview = getSelectionPreview()

  const renderContent = () => (
    <div className="space-y-6">
      {/* Duplicate Group Info */}
      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            {duplicateGroup.files.length} copies
          </Badge>
          <Badge
            variant={duplicateGroup.type === 'md5' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {duplicateGroup.type === 'md5' ? 'Identical' : 'Same Name'}
          </Badge>
        </div>
        <p className="truncate font-medium">{duplicateGroup.files[0]?.name}</p>
        <p className="text-muted-foreground text-sm">
          {formatFileSize(duplicateGroup.totalSize)} total •
          {formatFileSize(duplicateGroup.wastedSpace)} wasted
        </p>
      </div>

      {/* Selection Mode */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Smart Selection</Label>
          <p className="text-muted-foreground text-sm">
            Choose which files to process (selected files will be available for operations)
          </p>
        </div>

        <RadioGroup value={selectionMode} onValueChange={handleSelectionChange}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All files ({duplicateGroup.files.length} files)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="newest" id="newest" />
              <Label htmlFor="newest" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Keep newest, select others ({duplicateGroup.files.length - 1} files)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oldest" id="oldest" />
              <Label htmlFor="oldest" className="flex items-center gap-2">
                <Clock className="h-4 w-4 rotate-180" />
                Keep oldest, select others ({duplicateGroup.files.length - 1} files)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="largest" id="largest" />
              <Label htmlFor="largest" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Keep largest, select others ({duplicateGroup.files.length - 1} files)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="smallest" id="smallest" />
              <Label htmlFor="smallest" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Keep smallest, select others ({duplicateGroup.files.length - 1} files)
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Selection Preview */}
      {preview.selected.length > 0 && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {preview.selected.length} selected
            </Badge>
            <Badge variant="outline" className="text-xs">
              {preview.kept.length} kept
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(preview.spaceSaved)} to process
            </Badge>
          </div>

          <div className="space-y-1 text-sm">
            <p>
              <strong>Will be processed:</strong>
            </p>
            <ul className="text-muted-foreground space-y-1">
              {preview.selected.slice(0, 3).map((file, index) => (
                <li key={file.id} className="truncate">
                  • {file.name} ({formatFileSize(file.size || 0)})
                </li>
              ))}
              {preview.selected.length > 3 && (
                <li className="text-muted-foreground">
                  ... and {preview.selected.length - 3} more
                </li>
              )}
            </ul>
          </div>

          {preview.kept.length > 0 && (
            <div className="space-y-1 text-sm">
              <p>
                <strong>Will be kept:</strong>
              </p>
              <ul className="text-muted-foreground space-y-1">
                {preview.kept.map((file, index) => (
                  <li key={file.id} className="truncate">
                    • {file.name} ({formatFileSize(file.size || 0)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {/* Export Actions */}
      <div className="space-y-3 pt-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Export selected files ({preview.selected.length} files) as report
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={exportToTXT}
            disabled={preview.selected.length === 0}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            TXT
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={preview.selected.length === 0}
            className="gap-2"
          >
            <Table className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={exportToJSON}
            disabled={preview.selected.length === 0}
            className="gap-2"
          >
            <Code className="h-4 w-4" />
            JSON
          </Button>
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {isMobile ? (
        <BottomSheet open={isOpen} onOpenChange={onClose}>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle>Duplicate Action</BottomSheetTitle>
              <BottomSheetDescription>
                Select which files to process from this duplicate group
              </BottomSheetDescription>
            </BottomSheetHeader>
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">{renderContent()}</div>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Duplicate Action</DialogTitle>
              <DialogDescription>
                Select which files to process from this duplicate group
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">{renderContent()}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
