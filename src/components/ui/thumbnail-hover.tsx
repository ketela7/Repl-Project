
"use client";

import React, { useState } from 'react';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ThumbnailHoverProps {
  children: React.ReactNode;
  thumbnailLink?: string;
  fileName: string;
  mimeType: string;
  className?: string;
}

const hasThumbnailSupport = (mimeType: string): boolean => {
  // Check for file types that commonly have thumbnails in Google Drive
  return mimeType?.startsWith('image/') || 
         mimeType?.startsWith('video/') ||
         mimeType?.includes('pdf') ||
         mimeType?.includes('document') ||
         mimeType?.includes('presentation') ||
         mimeType?.includes('spreadsheet') ||
         mimeType?.includes('google-apps') ||
         false;
};

export function ThumbnailHover({ 
  children, 
  thumbnailLink, 
  fileName, 
  mimeType,
  className = ""
}: ThumbnailHoverProps) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Show thumbnail for any file that has thumbnailLink, regardless of type
  if (!thumbnailLink) {
    return <>{children}</>;
  }

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <div 
          className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
            // Auto close after 3 seconds on mobile
            setTimeout(() => setIsOpen(false), 3000);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-auto p-2 max-w-sm shadow-xl border-2 border-border/50 bg-background/95 backdrop-blur-sm" 
        side="right" 
        align="start"
        sideOffset={10}
        alignOffset={-10}
      >
        <div className="space-y-2">
          {/* File name header dengan styling lebih baik */}
          <div className="text-xs font-semibold text-foreground/90 truncate max-w-[320px] px-1" title={fileName}>
            {fileName}
          </div>
          
          {/* Thumbnail container dengan ukuran optimal cross-platform */}
          <div className="relative bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg overflow-hidden shadow-inner">
            {!thumbnailError ? (
              <img
                src={thumbnailLink}
                alt={`Thumbnail of ${fileName}`}
                className={`
                  w-full h-auto max-w-[320px] max-h-[240px] 
                  object-contain rounded-lg
                  transition-all duration-500 ease-out
                  ${thumbnailLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `}
                style={{
                  minHeight: '140px',
                  minWidth: '220px',
                  maxWidth: '320px',
                  maxHeight: '240px'
                }}
                onLoad={() => setThumbnailLoaded(true)}
                onError={() => {
                  setThumbnailError(true);
                  setThumbnailLoaded(false);
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-[220px] h-[140px] bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <div className="text-2xl opacity-60">
                    {mimeType?.startsWith('video/') ? '🎥' : 
                     mimeType?.startsWith('image/') ? '🖼️' :
                     mimeType?.includes('pdf') ? '📄' :
                     mimeType?.includes('document') ? '📝' :
                     mimeType?.includes('presentation') ? '📊' :
                     mimeType?.includes('spreadsheet') ? '📈' : '📁'}
                  </div>
                  <div className="text-xs font-medium">Thumbnail unavailable</div>
                </div>
              </div>
            )}
            
            {/* Loading skeleton dengan animasi yang lebih smooth */}
            {!thumbnailLoaded && !thumbnailError && (
              <div className="absolute inset-0 w-[220px] h-[140px] bg-gradient-to-br from-muted/40 to-muted/60 rounded-lg animate-pulse flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-3 h-3 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-3 h-3 bg-primary/60 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            
            {/* Overlay gradient untuk efek profesional */}
            {thumbnailLoaded && !thumbnailError && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-lg" />
            )}
          </div>
          
          {/* File info footer */}
          {thumbnailLoaded && !thumbnailError && (
            <div className="text-[10px] text-muted-foreground/70 text-center px-1 font-medium">
              Thumbnail Preview • {
                mimeType?.startsWith('image/') ? 'Image' :
                mimeType?.startsWith('video/') ? 'Video' :
                mimeType?.includes('pdf') ? 'PDF' :
                mimeType?.includes('document') ? 'Document' :
                mimeType?.includes('presentation') ? 'Presentation' :
                mimeType?.includes('spreadsheet') ? 'Spreadsheet' :
                mimeType?.split('/')[1]?.toUpperCase() || 'File'
              }
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
