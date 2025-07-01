'use client'

import { useState } from 'react'
import { FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

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

interface CreateFolderDialogProps {
  isOpen: boolean
  onClose: () => void
  onFolderCreated: () => void
  parentFolderId?: string | null
  currentFolderId?: string | null
}

export function CreateFolderDialog({ isOpen, onClose, onFolderCreated, parentFolderId }: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  // Rename parentFolderId to actualParentId to be used in the API call
  const actualParentId = parentFolderId

  const handleCreate = async () => {
    if (!(folderName as string).trim()) {
      toast.error('Please enter a folder name')
      return
    }

    try {
      setCreating(true)

      const response = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: (folderName as string).trim(),
          parentId: actualParentId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle reauthentication needed
        if (errorData.needsReauth || response.status === 401 || response.status === 403) {
          toast.error(errorData.error || 'Google Drive access expired. Please reconnect your account.')
          // Trigger parent component to show connection card
          window.location.reload()
          return
        }

        throw new Error(errorData.error || 'Failed to create folder')
      }

      const result = await response.json()

      toast.success(`Folder "${result.name}" created successfully`)
      onFolderCreated()
      handleClose()
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
      }
      toast.error(error instanceof Error ? error.message : 'Failed to create folder')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    if (!creating) {
      setFolderName('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder
            {parentFolderId && ' in the current location'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder="Enter folder name..."
              disabled={creating}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleCreate()
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!(folderName as string).trim() || creating}>
            {creating ? (
              <>
                <FolderPlus className="mr-2 h-4 w-4 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Folder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
