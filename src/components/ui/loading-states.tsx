/**
 * Centralized loading state components for consistent UX
 * Provides skeleton loaders and progress indicators
 */

import { cn } from "@/lib/utils"
import { Loader2, Search, FileIcon, FolderIcon } from "lucide-react"

interface LoadingStateProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Animated spinner for general loading states
 */
export function LoadingSpinner({ className, size = 'md' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  )
}

/**
 * File list skeleton loader
 */
export function FileListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
          </div>
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

/**
 * Grid view skeleton loader
 */
export function FileGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4", className)}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="h-12 w-12 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
        </div>
      ))}
    </div>
  )
}

/**
 * Search results loading state
 */
export function SearchLoadingSkeleton({ query }: { query: string }) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Search className="h-4 w-4 animate-pulse" />
        <span>Searching for "{query}"...</span>
      </div>
      <FileListSkeleton />
    </div>
  )
}

/**
 * Upload progress indicator
 */
export function UploadProgress({ 
  progress, 
  fileName,
  className 
}: { 
  progress: number
  fileName: string
  className?: string 
}) {
  return (
    <div className={cn("space-y-2 p-3 border rounded-lg", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate">{fileName}</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Bulk operation progress
 */
export function BulkOperationProgress({
  operation,
  completed,
  total,
  currentFile,
  className
}: {
  operation: string
  completed: number
  total: number
  currentFile?: string
  className?: string
}) {
  const progress = Math.round((completed / total) * 100)
  
  return (
    <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{operation}</h4>
        <span className="text-sm text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {currentFile && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoadingSpinner size="sm" />
          <span className="truncate">Processing: {currentFile}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Folder navigation loading
 */
export function FolderLoadingSkeleton({ folderName }: { folderName: string }) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <FolderIcon className="h-4 w-4" />
        <span>Loading {folderName}...</span>
        <LoadingSpinner size="sm" />
      </div>
      <FileListSkeleton />
    </div>
  )
}

/**
 * Authentication loading state
 */
export function AuthLoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4 p-8", className)}>
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">Authenticating...</p>
    </div>
  )
}

/**
 * API retry loading state
 */
export function ApiRetryLoadingState({ 
  attempt, 
  maxAttempts,
  operation 
}: { 
  attempt: number
  maxAttempts: number
  operation: string
}) {
  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
      <LoadingSpinner size="sm" />
      <span className="text-sm">
        Retrying {operation} (attempt {attempt}/{maxAttempts})...
      </span>
    </div>
  )
}

/**
 * Session refresh loading
 */
export function SessionRefreshingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <LoadingSpinner size="sm" />
      <span>Refreshing session...</span>
    </div>
  )
}

/**
 * File operation loading overlay
 */
export function FileOperationLoading({
  operation,
  fileName,
  isVisible
}: {
  operation: string
  fileName: string
  isVisible: boolean
}) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" className="mx-auto" />
          <div>
            <h3 className="font-semibold">{operation}</h3>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {fileName}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}