
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

const isImageMimeType = (mimeType: string): boolean => {
  return mimeType?.startsWith('image/') || false;
};

export function ThumbnailHover({ 
  children, 
  thumbnailLink, 
  fileName, 
  mimeType,
  className = ""
}: ThumbnailHoverProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Only show thumbnail for images with thumbnailLink
  if (!thumbnailLink || !isImageMimeType(mimeType)) {
    return <>{children}</>;
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className={`cursor-pointer transition-transform hover:scale-105 ${className}`}>
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
            {!imageError ? (
              <img
                src={thumbnailLink}
                alt={`Preview of ${fileName}`}
                className={`
                  w-full h-auto max-w-[320px] max-h-[240px] 
                  object-contain rounded-lg
                  transition-all duration-500 ease-out
                  ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `}
                style={{
                  minHeight: '140px',
                  minWidth: '220px',
                  maxWidth: '320px',
                  maxHeight: '240px'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-[220px] h-[140px] bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <div className="text-2xl opacity-60">🖼️</div>
                  <div className="text-xs font-medium">Preview unavailable</div>
                </div>
              </div>
            )}
            
            {/* Loading skeleton dengan animasi yang lebih smooth */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 w-[220px] h-[140px] bg-gradient-to-br from-muted/40 to-muted/60 rounded-lg animate-pulse flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-3 h-3 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-3 h-3 bg-primary/60 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            
            {/* Overlay gradient untuk efek profesional */}
            {imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-lg" />
            )}
          </div>
          
          {/* File info footer */}
          {imageLoaded && !imageError && (
            <div className="text-[10px] text-muted-foreground/70 text-center px-1 font-medium">
              Image Preview • {mimeType.split('/')[1]?.toUpperCase()}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
