'use client'

/**
 * Responsive Image component using Next.js Image with performance optimizations
 * Includes lazy loading, blur placeholder, and responsive sizing
 */

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  onLoad?: (() => void) | undefined
  onError?: (() => void) | undefined
}

function ResponsiveImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div
        className={cn('flex items-center justify-center bg-gray-100 text-gray-400', className)}
        style={{ width, height }}
      >
        <span className="text-sm">Image failed to load</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-200"
          style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        {...(fill ? { fill: true } : { width: width || 200, height: height || 200 })}
        sizes={fill ? sizes : undefined}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX//2Q=="
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          fill ? 'object-cover' : '',
        )}
      />
    </div>
  )
}

// Avatar-specific responsive image
export function Avatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      sizes="(max-width: 768px) 64px, 40px"
      priority={false}
    />
  )
}

// File thumbnail responsive image
export function Thumbnail({
  src,
  alt,
  className,
  onLoad,
  onError,
  width = 320,
  height = 200,
}: {
  src: string
  alt: string
  className?: string
  onLoad?: () => void
  onError?: () => void
  width?: number
  height?: number
}) {
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('rounded-lg', className)}
      sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, 360px"
      priority={false}
      onLoad={onLoad || (() => {})}
      onError={onError || (() => {})}
    />
  )
}

export default ResponsiveImage
