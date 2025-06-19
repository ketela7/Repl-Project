"use client";

import React, { useState, useRef, useEffect } from 'react';

interface FileThumbnailPreviewProps {
  children: React.ReactNode;
  thumbnailLink?: string;
  fileName: string;
  mimeType: string;
  className?: string;
}

export function FileThumbnailPreview({ 
  children, 
  thumbnailLink, 
  fileName, 
  mimeType,
  className = ""
}: FileThumbnailPreviewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Don't show preview if no thumbnail available
  if (!thumbnailLink) {
    return <>{children}</>;
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.right + 10,
      y: rect.top
    });
    
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
    setPosition({
      x: Math.min(rect.right + 10, window.innerWidth - 320),
      y: rect.top
    });
    setIsVisible(true);
    
    // Auto hide after 3 seconds on mobile
    setTimeout(() => setIsVisible(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
            top: `${position.y}px`,
            transform: position.x > window.innerWidth / 2 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="bg-background/95 backdrop-blur-sm border-2 border-border/50 rounded-lg shadow-2xl p-3 max-w-sm animate-in fade-in-0 zoom-in-95 duration-200">
            {/* File name header */}
            <div className="text-xs font-semibold text-foreground/90 truncate max-w-[300px] mb-2" title={fileName}>
              {fileName}
            </div>
            
            {/* Thumbnail container */}
            <div className="relative bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg overflow-hidden shadow-inner">
              {!thumbnailError ? (
                <img
                  src={thumbnailLink}
                  alt={`Preview of ${fileName}`}
                  className={`
                    w-full h-auto max-w-[300px] max-h-[200px] 
                    object-contain rounded-lg
                    transition-all duration-300 ease-out
                    ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'}
                  `}
                  style={{
                    minHeight: '120px',
                    minWidth: '200px'
                  }}
                  onLoad={() => setThumbnailLoaded(true)}
                  onError={() => {
                    setThumbnailError(true);
                    setThumbnailLoaded(false);
                  }}
                  loading="lazy"
                />
              ) : (
                <div className="w-[200px] h-[120px] bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <div className="text-2xl opacity-60">
                      {mimeType?.startsWith('video/') ? '🎥' : 
                       mimeType?.startsWith('image/') ? '🖼️' :
                       mimeType?.includes('pdf') ? '📄' :
                       mimeType?.includes('document') ? '📝' :
                       mimeType?.includes('presentation') ? '📊' :
                       mimeType?.includes('spreadsheet') ? '📈' : '📁'}
                    </div>
                    <div className="text-xs font-medium">Preview unavailable</div>
                  </div>
                </div>
              )}
              
              {/* Loading animation */}
              {!thumbnailLoaded && !thumbnailError && (
                <div className="absolute inset-0 w-[200px] h-[120px] bg-gradient-to-br from-muted/40 to-muted/60 rounded-lg flex items-center justify-center">
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
          </div>
        </div>
      )}
    </>
  );
}