'use client'

import { useState } from 'react'
import { Settings, Users, Clock, Trash2 } from 'lucide-react'
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
import { OperationsDialog } from '@/app/(main)/dashboard/drive/_components/operations-dialog'

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
  const [selectedFiles, setSelectedFiles] = useState<DuplicateFile[]>([])
  const [isOperationsOpen, setIsOperationsOpen] = useState(false)

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
    setSelectedFiles(getSelectedFiles(mode))
  }

  const handleProceed = () => {
    const filesToProcess = getSelectedFiles(selectionMode)
    
    // Transform files to match OperationsDialog expected format
    const operationItems = filesToProcess.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      canDelete: file.canDelete ?? true,
      canTrash: file.canTrash ?? true,
      canMove: file.canMove ?? true,
      canCopy: file.canCopy ?? true,
      canShare: file.canShare ?? true,
      canRename: file.canRename ?? true,
      canExport: file.canExport ?? true,
      canDownload: file.canDownload ?? true,
      isFolder: file.isFolder ?? false,
    }))
    
    setSelectedFiles(operationItems)
    onClose()
    setIsOperationsOpen(true)
  }

  const getSelectionPreview = () => {
    const selected = getSelectedFiles(selectionMode)
    const kept = duplicateGroup.files.filter(f => !selected.find(s => s.id === f.id))
    
    return {
      selected,
      kept,
      spaceSaved: selected.reduce((sum, file) => sum + (file.size || 0), 0)
    }
  }

  const preview = getSelectionPreview()

  const renderContent = () => (
    <div className="space-y-6">
      {/* Duplicate Group Info */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            {duplicateGroup.files.length} copies
          </Badge>
          <Badge variant={duplicateGroup.type === 'md5' ? 'default' : 'secondary'} className="text-xs">
            {duplicateGroup.type === 'md5' ? 'Identical' : 'Same Name'}
          </Badge>
        </div>
        <p className="font-medium truncate">{duplicateGroup.files[0]?.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatFileSize(duplicateGroup.totalSize)} total • 
          {formatFileSize(duplicateGroup.wastedSpace)} wasted
        </p>
      </div>

      {/* Selection Mode */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Smart Selection</Label>
          <p className="text-sm text-muted-foreground">
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
        <div className="rounded-lg border p-4 space-y-3">
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
          
          <div className="text-sm space-y-1">
            <p><strong>Will be processed:</strong></p>
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
            <div className="text-sm space-y-1">
              <p><strong>Will be kept:</strong></p>
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
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleProceed}
          disabled={preview.selected.length === 0}
          className="flex-1 gap-2"
        >
          <Settings className="h-4 w-4" />
          Open Operations
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
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">
              {renderContent()}
            </div>
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
            <div className="max-h-[70vh] overflow-y-auto">
              {renderContent()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Operations Dialog */}
      {isOperationsOpen && selectedFiles.length > 0 && (
        <OperationsDialog
          isOpen={isOperationsOpen}
          onClose={() => setIsOperationsOpen(false)}
          selectedItems={selectedFiles}
        />
      )}
    </>
  )
}