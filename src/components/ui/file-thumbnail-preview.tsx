"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Video, Image, FileText } from 'lucide-react';
import { Thumbnail } from '@/components/responsive-image';

interface FileThumbnailPreviewProps {
  children: React.ReactNode;
  thumbnailLink?: string;
  fileName: string;
  mimeType: string;
  className?: string;
  modifiedTime?: string; // Add modifiedTime to props
}

// Function to format the date with timezone support
function formatDriveFileDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone,
    });
  } catch {
    return 'Invalid date';
  }
}

export function FileThumbnailPreview({
  children,
  thumbnailLink,
  fileName,
  mimeType,
  className = "",
  modifiedTime // Destructure modifiedTime from props
}: FileThumbnailPreviewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Cleanup effect - must be unconditional
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Don't show preview if no thumbnail available
  if (!thumbnailLink) {
    return <>{children}</>;
  }

  // Thumbnail information tracked for debugging

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const previewWidth = window.innerWidth < 640 ? 280 : window.innerWidth < 768 ? 320 : 360;
    const padding = 16;
    
    let x = rect.right + 10;
    let y = rect.top;
    
    // Adjust position to keep preview within viewport
    if (x + previewWidth > window.innerWidth - padding) {
      x = rect.left - previewWidth - 10;
    }
    if (x < padding) {
      x = padding;
    }
    if (y + 200 > window.innerHeight - padding) {
      y = window.innerHeight - 200 - padding;
    }
    if (y < padding) {
      y = padding;
    }
    
    setPosition({ x, y });

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show preview after short delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    // Clear timeout and hide preview
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const previewWidth = window.innerWidth < 640 ? 280 : window.innerWidth < 768 ? 320 : 360;
    const padding = 16;
    
    let x = rect.right + 10;
    let y = rect.top;
    
    // Adjust position to keep preview within viewport
    if (x + previewWidth > window.innerWidth - padding) {
      x = rect.left - previewWidth - 10;
    }
    if (x < padding) {
      x = padding;
    }
    if (y + 200 > window.innerHeight - padding) {
      y = window.innerHeight - 200 - padding;
    }
    if (y < padding) {
      y = padding;
    }
    
    setPosition({ x, y });
    setIsVisible(true);

    // Auto hide after 4 seconds on mobile
    setTimeout(() => setIsVisible(false), 4000);
  };

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
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          <div className="bg-background/95 backdrop-blur-sm border-2 border-border/50 rounded-lg shadow-2xl p-2 sm:p-3 w-[280px] sm:w-[320px] md:w-[360px] animate-in fade-in-0 zoom-in-95 duration-200">
            {/* File name header */}
            <div className="text-xs font-semibold text-foreground/90 truncate mb-2" title={fileName}>
              {fileName}
            </div>

            {/* Thumbnail container */}
            <div className="relative bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg overflow-hidden shadow-inner">
              {!thumbnailError ? (
                <Thumbnail
                  src={thumbnailLink}
                  alt={`Preview of ${fileName}`}
                  className={`
                    w-full h-auto
                    object-contain rounded-lg
                    transition-all duration-300 ease-out
                    ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'}
                  `}
                  onLoad={() => setThumbnailLoaded(true)}
                  onError={() => {
                    console.warn('Thumbnail load error:', {
                      fileName,
                      thumbnailLink,
                    });
                    setThumbnailError(true);
                    setThumbnailLoaded(false);
                  }}
                />
              ) : (
                <div className="w-full h-[140px] bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <div className="opacity-60 mx-auto">
                      {mimeType?.startsWith('video/') ? (
                        <Video className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
                       ) : mimeType?.startsWith('image/') ? (
                        <Image className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
                       ) : (
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
                       )}
                    </div>
                    <div className="text-xs font-medium">Preview unavailable</div>
                  </div>
                </div>
              )}

              {/* Loading animation */}
              {!thumbnailLoaded && !thumbnailError && (
                <div className="absolute inset-0 w-full h-[140px] bg-gradient-to-br from-muted/40 to-muted/60 rounded-lg flex items-center justify-center">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>

            {/* File type info */}
            {thumbnailLoaded && !thumbnailError && (
              <div className="text-[10px] text-muted-foreground/70 text-center mt-2 font-medium">
                {mimeType?.startsWith('image/') ? 'Image Preview' :
                 mimeType?.startsWith('video/') ? 'Video Preview' :
                 mimeType?.includes('pdf') ? 'PDF Preview' :
                 mimeType?.includes('document') ? 'Document Preview' :
                 mimeType?.includes('presentation') ? 'Presentation Preview' :
                 mimeType?.includes('spreadsheet') ? 'Spreadsheet Preview' :
                 'File Preview'}
              </div>
            )}
             {modifiedTime && (
              <div className="text-[10px] text-muted-foreground/70 text-center mt-2 font-medium">
                Modified: {formatDriveFileDate(modifiedTime)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}