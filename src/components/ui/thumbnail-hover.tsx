
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
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div className={className}>
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-auto p-3 max-w-xs shadow-lg border" 
        side="right" 
        align="start"
        sideOffset={15}
      >
        <div className="space-y-3">
          {/* File name header */}
          <div className="text-sm font-medium text-foreground truncate max-w-[280px]" title={fileName}>
            {fileName}
          </div>
          
          {/* Thumbnail container */}
          <div className="relative bg-muted/30 rounded-md overflow-hidden">
            {!imageError ? (
              <img
                src={thumbnailLink}
                alt={`Preview of ${fileName}`}
                className={`
                  w-full h-auto max-w-[280px] max-h-[200px] 
                  object-contain rounded-md
                  transition-opacity duration-300 ease-in-out
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                style={{
                  minHeight: '120px',
                  minWidth: '200px'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-[200px] h-[120px] bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">
                <div className="text-center">
                  <div className="text-lg mb-1">📷</div>
                  <div>Preview not available</div>
                </div>
              </div>
            )}
            
            {/* Loading skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 w-[200px] h-[120px] bg-muted rounded-md animate-pulse flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
