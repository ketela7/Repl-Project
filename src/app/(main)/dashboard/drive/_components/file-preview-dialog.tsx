'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  X,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  FileText,
  Image,
  Video,
  Music,
  AlertCircle,
} from 'lucide-react'
import { DriveFile } from '@/lib/google-drive/types'
import {
  getPreviewUrl,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isDocumentFile,
  formatFileSize,
} from '@/lib/google-drive/utils'
import { successToast, errorToast, toastUtils } from '@/lib/toast'

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: DriveFile | null
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
}: FilePreviewDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
        event.preventDefault()
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

  // Reset fullscreen when dialog closes
  useEffect(() => {
    if (!open) {
      setIsFullscreen(false)
    }
  }, [open])

  if (!file) return null

  const previewUrl = getPreviewUrl(file.id, file.mimeType, file.webContentLink)

  const handleDownload = async () => {
    try {
      await toastUtils.download(async () => {
        const link = document.createElement('a')
        link.href = `/api/drive/download/${file.id}`
        link.download = file.name
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, file.name)
    } catch (error) {
      errorToast.downloadFailed(file.name)
    }
  }

  const handleOpenInDrive = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
    }
  }

  const renderPreviewContent = () => {
    // Responsive preview dimensions based on screen size
    const getPreviewHeight = () => {
      if (isFullscreen) return 'h-screen'

      // Mobile: smaller height to accommodate header
      if (window.innerWidth < 640) return 'h-[45vh] min-h-[250px] max-h-[70vh]'
      // Tablet
      if (window.innerWidth < 1024) return 'h-[55vh] min-h-[350px] max-h-[75vh]'
      // Desktop
      return 'h-[65vh] min-h-[400px] max-h-[80vh]'
    }

    const previewHeight = getPreviewHeight()
    const previewClasses = isFullscreen
      ? 'w-full h-full'
      : 'w-full h-full border-0'
    const containerClasses = isFullscreen
      ? 'bg-white h-screen w-screen'
      : 'bg-white rounded-lg border overflow-hidden'

    // Universal Google Drive preview - handles all file types automatically
    return (
      <div className={`${containerClasses} ${previewHeight}`}>
        <iframe
          src={previewUrl}
          className={previewClasses}
          title={`Preview: ${file.name}`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          loading="lazy"
          style={{
            border: 'none',
            outline: 'none',
          }}
        />
      </div>
    )
  }

  // Render fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        {/* Fullscreen toolbar */}
        <div className="absolute top-0 right-0 left-0 z-10 bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="max-w-md truncate font-medium text-white">
                {file.name}
              </h2>
              <div className="hidden text-sm text-white/70 sm:block">
                {file.mimeType}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {file.webContentLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInDrive}
                className="text-white hover:bg-white/10"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Open in Drive</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/10"
              >
                <Minimize2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Fullscreen content */}
        <div className="h-full w-full pt-16">{renderPreviewContent()}</div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[95vh] w-[95vw] max-w-6xl overflow-hidden p-3 sm:p-4 md:p-6">
        <DialogHeader className="pb-2 sm:pb-3">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="flex-1 truncate pr-2 text-sm font-medium sm:text-base md:text-lg">
              {file.name}
            </DialogTitle>
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              {/* Fullscreen toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="hidden sm:flex"
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                Fullscreen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="h-8 w-8 p-0 sm:hidden"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {/* Download button */}
              {file.webContentLink && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="hidden sm:flex"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 w-8 p-0 sm:hidden"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
              {/* Open in Drive */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInDrive}
                className="hidden sm:flex"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Drive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInDrive}
                className="h-8 w-8 p-0 sm:hidden"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-1 flex-1 overflow-hidden sm:mt-2">
          {renderPreviewContent()}
        </div>

        {/* File info */}
        <div className="text-muted-foreground flex flex-col gap-1 border-t pt-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:text-sm">
          <span className="truncate">Type: {file.mimeType}</span>
          {file.size && (
            <span className="text-right">
              Size: {formatFileSize(file.size)}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
