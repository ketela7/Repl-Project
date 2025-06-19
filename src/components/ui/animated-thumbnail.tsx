
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';
import { FileIcon } from '@/components/file-icon';
import { isImageFile, isVideoFile, isAudioFile, isDocumentFile } from '@/lib/google-drive/utils';
import { 
  Play, 
  Volume2, 
  FileText, 
  Image as ImageIcon,
  Film,
  Music
} from 'lucide-react';

interface AnimatedThumbnailProps {
  fileId: string;
  fileName: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  previewable?: boolean;
}

export function AnimatedThumbnail({
  fileId,
  fileName,
  mimeType,
  thumbnailLink,
  size = 'md',
  className,
  onClick,
  previewable = false
}: AnimatedThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (isIntersecting && thumbnailLink && !imageSrc) {
      setImageSrc(thumbnailLink);
    }
  }, [isIntersecting, thumbnailLink, imageSrc]);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const getFileTypeIcon = () => {
    if (isImageFile(mimeType)) return ImageIcon;
    if (isVideoFile(mimeType)) return Film;
    if (isAudioFile(mimeType)) return Music;
    if (isDocumentFile(mimeType)) return FileText;
    return FileText;
  };

  const getOverlayIcon = () => {
    if (isVideoFile(mimeType)) return Play;
    if (isAudioFile(mimeType)) return Volume2;
    return null;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const OverlayIcon = getOverlayIcon();
  const shouldShowThumbnail = thumbnailLink && isImageFile(mimeType) && !hasError;

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative group cursor-pointer transition-all duration-300 ease-out',
        'hover:scale-105 hover:shadow-lg',
        sizeClasses[size],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Main thumbnail/icon container */}
      <div className={cn(
        'relative w-full h-full rounded-lg overflow-hidden',
        'bg-gradient-to-br from-slate-50 to-slate-100',
        'dark:from-slate-800 dark:to-slate-900',
        'border border-slate-200 dark:border-slate-700',
        'transition-all duration-300 ease-out',
        isHovered && 'border-blue-300 dark:border-blue-600',
        'group-hover:shadow-md'
      )}>
        
        {/* Background pattern */}
        <div className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300',
          'bg-gradient-to-br from-blue-50/50 to-purple-50/50',
          'dark:from-blue-950/20 dark:to-purple-950/20',
          isHovered && 'opacity-100'
        )} />

        {shouldShowThumbnail ? (
          /* Image thumbnail */
          <>
            {imageSrc && (
              <img
                src={imageSrc}
                alt={fileName}
                className={cn(
                  'w-full h-full object-cover transition-all duration-300',
                  isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
                  isHovered && 'scale-110'
                )}
                onLoad={handleLoad}
                onError={handleError}
              />
            )}
            
            {/* Loading shimmer */}
            {!isLoaded && !hasError && imageSrc && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
          </>
        ) : (
          /* File icon fallback */
          <div className={cn(
            'w-full h-full flex items-center justify-center',
            'transition-transform duration-300',
            isHovered && 'scale-110'
          )}>
            <FileIcon 
              mimeType={mimeType} 
              className={cn(
                'transition-colors duration-300',
                size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10',
                isHovered && 'text-blue-600 dark:text-blue-400'
              )}
            />
          </div>
        )}

        {/* Media type overlay */}
        {OverlayIcon && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/40 backdrop-blur-sm',
            'opacity-0 transition-all duration-300',
            'group-hover:opacity-100'
          )}>
            <OverlayIcon className={cn(
              'text-white drop-shadow-lg',
              'transition-transform duration-300',
              'group-hover:scale-110',
              size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'
            )} />
          </div>
        )}

        {/* Previewable indicator */}
        {previewable && (
          <div className={cn(
            'absolute top-1 right-1',
            'w-2 h-2 rounded-full bg-green-500',
            'opacity-0 transition-all duration-300 delay-100',
            'group-hover:opacity-100 group-hover:scale-125',
            'shadow-lg shadow-green-500/50'
          )} />
        )}

        {/* Hover glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-lg',
          'bg-gradient-to-br from-blue-400/20 to-purple-400/20',
          'opacity-0 transition-opacity duration-300',
          isHovered && 'opacity-100'
        )} />
      </div>

      {/* Animated border */}
      <div className={cn(
        'absolute inset-0 rounded-lg',
        'bg-gradient-to-r from-blue-500 to-purple-500',
        'opacity-0 transition-opacity duration-300',
        'group-hover:opacity-20',
        '-z-10 blur-sm'
      )} />

      {/* Pulse animation for loading */}
      {!isLoaded && imageSrc && !hasError && (
        <div className="absolute inset-0 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
      )}
    </div>
  );
}
