'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/google-drive/utils'

interface FileUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
  currentFolderId?: string | null
}

export function FileUploadDialog({
  isOpen,
  onClose,
  onUploadComplete,
  currentFolderId,
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', fileName || selectedFile.name)
      if (description) formData.append('description', description)
      if (currentFolderId) formData.append('parentId', currentFolderId)

      // Upload progress will be handled by the actual upload stream
      setUploadProgress(50)

      const response = await fetch('/api/drive/files', {
        method: 'POST',
        body: formData,
      })

      // Progress interval would be cleared here if implemented
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()

        // Handle reauthentication needed
        if (
          errorData.needsReauth ||
          response.status === 401 ||
          response.status === 403
        ) {
          toast.error(
            errorData.error ||
              'Google Drive access expired. Please reconnect your account.'
          )
          window.location.reload()
          return
        }

        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      toast.success(`${result.name} uploaded successfully`)
      onUploadComplete()
      handleClose()
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
      }
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null)
      setFileName('')
      setDescription('')
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to your Google Drive
            {currentFolderId && ' in the current folder'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="file-input">Select File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-input"
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                className="file:bg-primary file:text-primary-foreground file:mr-2 file:rounded file:border-0 file:px-2 file:py-1 file:text-sm"
              />
            </div>
            {selectedFile && (
              <div className="bg-muted flex items-center justify-between rounded p-2 text-sm">
                <span className="truncate">{selectedFile.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </span>
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        setFileName('')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="file-name">File Name</Label>
            <Input
              id="file-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name..."
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter file description..."
              disabled={uploading}
              rows={3}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
