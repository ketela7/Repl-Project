import React, { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: string;
  className?: string;
  containerClassName?: string;
  threshold?: number;
}

export function LazyImage({
  src,
  fallback,
  className,
  containerClassName,
  threshold = 0.1,
  alt = '',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    triggerOnce: true
  });

  useEffect(() => {
    if (isIntersecting && !imageSrc) {
      setImageSrc(src);
    }
  }, [isIntersecting, src, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
      setHasError(false);
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn('relative overflow-hidden', containerClassName)}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {(!isLoaded || hasError) && (
        <div className={cn(
          'absolute inset-0 bg-muted animate-pulse',
          'flex items-center justify-center',
          className
        )}>
          {hasError ? (
            <span className="text-xs text-muted-foreground">Failed to load</span>
          ) : (
            <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}