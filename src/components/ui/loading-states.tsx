"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-muted border-t-primary", sizeClasses[size], className)} />
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  showProgress?: boolean;
  className?: string;
}

export function LoadingCard({ 
  title = "Loading", 
  description = "Please wait...", 
  showProgress = false,
  className 
}: LoadingCardProps) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="text-center space-y-4 max-w-sm mx-auto">
        <div className="relative">
          <LoadingSpinner size="lg" />
          {showProgress && (
            <div className="absolute inset-0 animate-pulse rounded-full border-4 border-primary/20" />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {showProgress && (
          <div className="w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{width: '60%'}} />
          </div>
        )}
      </div>
    </div>
  );
}

interface FileLoadingSkeletonProps {
  count?: number;
  view?: "grid" | "list";
}

export function FileLoadingSkeleton({ count = 6, view = "grid" }: FileLoadingSkeletonProps) {
  if (view === "list") {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="h-12 w-12 bg-muted rounded animate-pulse mx-auto" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DriveLoadingStateProps {
  message?: string;
  submessage?: string;
}

export function DriveLoadingState({ 
  message = "Loading Google Drive", 
  submessage = "Fetching your files..." 
}: DriveLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full border-4 border-primary/20" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-foreground">{message}</h3>
        <p className="text-muted-foreground">{submessage}</p>
      </div>
      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse" style={{width: '70%'}} />
      </div>
    </div>
  );
}