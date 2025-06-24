'use client'

import React, { useState } from 'react'
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
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { toast } from 'sonner'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import { Edit } from 'lucide-react'
import { cn } from '@/shared/utils'

interface FileRenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (newName: string) => Promise<void>
  fileName: string
  fileId: string
}

export function FileRenameDialog({
  open,
  onOpenChange,
  onConfirm,
  fileName,
  fileId,
}: FileRenameDialogProps) {
  const [newName, setNewName] = useState(fileName || '')
  const [renaming, setRenaming] = useState(false)
  const isMobile = useIsMobile()

  const handleRename = async () => {
    if (!newName?.trim() || !fileId || newName === fileName) {
      handleClose()
      return
    }

    try {
      setRenaming(true)
      await onConfirm(newName.trim())
      handleClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename file'
      )
    } finally {
      setRenaming(false)
    }
  }

  const handleClose = () => {
    if (!renaming) {
      setNewName(fileName || '')
      onOpenChange(false)
    }
  }

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    }
  }

  // Update newName when fileName prop changes
  React.useEffect(() => {
    if (fileName) {
      setNewName(fileName)
    }
  }, [fileName])

  // Add React import
  if (!fileId || !fileName) {
    return null
  }

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={handleDialogOpenChange}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Rename File
            </BottomSheetTitle>
            <BottomSheetDescription>
              Enter a new name for "{fileName}"
            </BottomSheetDescription>
          </BottomSheetHeader>

          <div className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="file-name-mobile" className="text-sm font-medium">
                File Name
              </Label>
              <Input
                id="file-name-mobile"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new file name..."
                disabled={renaming}
                className={`${cn('min-h-[44px]')} text-base`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename()
                  }
                }}
                autoFocus
                onFocus={(e) => {
                  const name = e.target.value
                  const lastDot = name.lastIndexOf('.')
                  if (lastDot > 0) {
                    e.target.setSelectionRange(0, lastDot)
                  } else {
                    e.target.select()
                  }
                }}
              />
            </div>
          </div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={renaming}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newName?.trim() || newName === fileName || renaming}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              {renaming ? (
                <>
                  <Edit className="mr-2 h-4 w-4 animate-pulse" />
                  Renaming...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </>
              )}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Rename File
          </DialogTitle>
          <DialogDescription>
            Enter a new name for "{fileName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-name">File Name</Label>
            <Input
              id="file-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new file name..."
              disabled={renaming}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename()
                }
              }}
              autoFocus
              onFocus={(e) => {
                const name = e.target.value
                const lastDot = name.lastIndexOf('.')
                if (lastDot > 0) {
                  e.target.setSelectionRange(0, lastDot)
                } else {
                  e.target.select()
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={renaming}>
            Close
          </Button>
          <Button
            onClick={handleRename}
            disabled={!newName?.trim() || newName === fileName || renaming}
          >
            {renaming ? (
              <>
                <Edit className="mr-2 h-4 w-4 animate-pulse" />
                Renaming...
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
