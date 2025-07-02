'use client'

import { useState, useEffect } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DriveFile } from '@/lib/google-drive/types'
import { getPreviewUrl } from '@/lib/google-drive/utils'

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: DriveFile | null
}

export function FilePreviewDialog({ open, onOpenChange, file }: FilePreviewDialogProps) {
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

  const previewUrl = getPreviewUrl(file.id)

  const renderPreviewContent = () => {
    // Optimized iframe sizing that matches container perfectly
    if (isFullscreen) {
      return (
        <div className="absolute inset-0 bg-white">
          <iframe
            src={previewUrl}
            className="h-full w-full"
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

    // Normal dialog view with perfect edge spacing
    return (
      <div className="h-[75vh] max-h-[80vh] min-h-[400px] w-full overflow-hidden rounded-lg border bg-white">
        <iframe
          src={previewUrl}
          className="h-full w-full"
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

  // Render fullscreen overlay - clean minimal design
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        {/* Minimal floating controls - moved to top-left */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="h-10 w-10 rounded-full bg-black/50 p-0 text-white backdrop-blur-sm hover:bg-white/20"
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 rounded-full bg-black/50 p-0 text-white backdrop-blur-sm hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Fullscreen content */}
        {renderPreviewContent()}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[95vh] w-[95vw] max-w-6xl overflow-hidden p-4 md:p-6">
        {/* Minimal header with clean controls - moved to top-left */}
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Fullscreen toggle - moved to left */}
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <DialogTitle className="flex-1 truncate text-center text-base font-medium md:text-lg">
              {file.name}
            </DialogTitle>
            <div className="w-8"></div> {/* Spacer for balance */}
          </div>
        </DialogHeader>

        {/* Clean preview content with perfect container spacing */}
        <div className="flex-1 overflow-hidden">{renderPreviewContent()}</div>
      </DialogContent>
    </Dialog>
  )
}

export default FilePreviewDialog
