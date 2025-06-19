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
        <div className={className}>
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-auto p-2 max-w-sm" 
        side="right" 
        align="start"
        sideOffset={10}
      >
        <div className="space-y-2">
          <div className="text-sm font-medium truncate" title={fileName}>
            {fileName}
          </div>
          <div className="relative">
            {!imageError ? (
              <img
                src={thumbnailLink}
                alt={`Thumbnail of ${fileName}`}
                className={`max-w-full max-h-48 rounded border transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-48 h-32 bg-muted rounded border flex items-center justify-center text-muted-foreground text-sm">
                Preview not available
              </div>
            )}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 w-48 h-32 bg-muted rounded border animate-pulse" />
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}