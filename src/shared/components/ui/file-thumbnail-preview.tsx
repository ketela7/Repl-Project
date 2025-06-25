'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Video, Image, FileText } from 'lucide-react'

interface FileThumbnailPreviewProps {
  children: React.ReactNode
  thumbnailLink?: string
  fileName: string
  mimeType: string
  className?: string
  modifiedTime?: string // Add modifiedTime to props
}

// Function to format the date with timezone support
function formatDriveFileDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone,
    })
  } catch (error) {
    return 'Invalid date'
  }
}

export function FileThumbnailPreview({
  children,
  thumbnailLink,
  fileName,
  mimeType,
  className = '',
  modifiedTime, // Destructure modifiedTime from props
}: FileThumbnailPreviewProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Don't show preview if no thumbnail available
  if (!thumbnailLink) {
    return <>{children}</>
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const previewWidth =
      window.innerWidth < 640 ? 280 : window.innerWidth < 768 ? 320 : 360
    const padding = 16

    let x = rect.right + 10
    let y = rect.top

    // Adjust position to keep preview within viewport
    if (x + previewWidth > window.innerWidth - padding) {
      x = rect.left - previewWidth - 10
    }
    if (x < padding) {
      x = padding
    }
    if (y + 200 > window.innerHeight - padding) {
      y = window.innerHeight - 200 - padding
    }
    if (y < padding) {
      y = padding
    }

    setPosition({ x, y })

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Show preview after short delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, 200)
  }

  const handleMouseLeave = () => {
    // Clear timeout and hide preview
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const previewWidth =
      window.innerWidth < 640 ? 280 : window.innerWidth < 768 ? 320 : 360
    const padding = 16

    let x = rect.right + 10
    let y = rect.top

    // Adjust position to keep preview within viewport
    if (x + previewWidth > window.innerWidth - padding) {
      x = rect.left - previewWidth - 10
    }
    if (x < padding) {
      x = padding
    }
    if (y + 200 > window.innerHeight - padding) {
      y = window.innerHeight - 200 - padding
    }
    if (y < padding) {
      y = padding
    }

    setPosition({ x, y })
    setIsVisible(true)

    // Auto hide after 4 seconds on mobile
    setTimeout(() => setIsVisible(false), 4000)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        className={`relative ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
      >
        {children}
      </div>

      {/* Thumbnail Preview Portal */}
      {isVisible && (
        <div
          ref={previewRef}
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div className="bg-background/95 border-border/50 animate-in fade-in-0 zoom-in-95 w-[280px] rounded-lg border-2 p-2 shadow-2xl backdrop-blur-sm duration-200 sm:w-[320px] sm:p-3 md:w-[360px]">
            {/* File name header */}
            <div
              className="text-foreground/90 mb-2 truncate text-xs font-semibold"
              title={fileName}
            >
              {fileName}
            </div>

            {/* Thumbnail container */}
            <div className="from-muted/20 to-muted/40 relative overflow-hidden rounded-lg bg-gradient-to-br shadow-inner">
              {!thumbnailError ? (
                <img
                  src={thumbnailLink}
                  alt={`Preview of ${fileName}`}
                  className={`h-auto w-full rounded-lg object-contain transition-all duration-300 ease-out ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'} `}
                  style={{
                    minHeight: '140px',
                    maxHeight: '200px',
                    aspectRatio: '16/10',
                  }}
                  onLoad={() => setThumbnailLoaded(true)}
                  onError={() => {
                    setThumbnailError(true)
                    setThumbnailLoaded(false)
                  }}
                  loading="lazy"
                />
              ) : (
                <div className="from-muted to-muted/60 text-muted-foreground flex h-[140px] w-full items-center justify-center rounded-lg bg-gradient-to-br">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto opacity-60">
                      {mimeType?.startsWith('video/') ? (
                        <Video className="h-6 w-6 sm:h-8 sm:w-8" />
                      ) : mimeType?.startsWith('image/') ? (
                        <Image className="h-6 w-6 sm:h-8 sm:w-8" />
                      ) : mimeType?.includes('pdf') ? (
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                      ) : mimeType?.includes('document') ? (
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                      ) : mimeType?.includes('presentation') ? (
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                      ) : mimeType?.includes('spreadsheet') ? (
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                      ) : (
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                      )}
                    </div>
                    <div className="text-xs font-medium">
                      Preview unavailable
                    </div>
                  </div>
                </div>
              )}

              {/* Loading animation */}
              {!thumbnailLoaded && !thumbnailError && (
                <div className="from-muted/40 to-muted/60 absolute inset-0 flex h-[140px] w-full items-center justify-center rounded-lg bg-gradient-to-br">
                  <div className="flex items-center space-x-1">
                    <div className="bg-primary/60 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]"></div>
                    <div className="bg-primary/60 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]"></div>
                    <div className="bg-primary/60 h-2 w-2 animate-bounce rounded-full"></div>
                  </div>
                </div>
              )}
            </div>

            {/* File type info */}
            {thumbnailLoaded && !thumbnailError && (
              <div className="text-muted-foreground/70 mt-2 text-center text-[10px] font-medium">
                {mimeType?.startsWith('image/')
                  ? 'Image Preview'
                  : mimeType?.startsWith('video/')
                    ? 'Video Preview'
                    : mimeType?.includes('pdf')
                      ? 'PDF Preview'
                      : mimeType?.includes('document')
                        ? 'Document Preview'
                        : mimeType?.includes('presentation')
                          ? 'Presentation Preview'
                          : mimeType?.includes('spreadsheet')
                            ? 'Spreadsheet Preview'
                            : 'File Preview'}
              </div>
            )}
            {modifiedTime && (
              <div className="text-muted-foreground/70 mt-2 text-center text-[10px] font-medium">
                Modified: {formatDriveFileDate(modifiedTime)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
