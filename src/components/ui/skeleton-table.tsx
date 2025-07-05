'use client'

import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

interface SkeletonRowProps {
  columns: number
  index: number
}

function SkeletonRow({ columns, index }: SkeletonRowProps) {
  // Staggered animation delay for smooth loading effect
  const delay = index * 50

  return (
    <TableRow className="animate-pulse">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <TableCell key={colIndex} className="py-3">
          <div
            className="flex items-center space-x-3"
            style={{ animationDelay: `${delay}ms` }}
          >
            {colIndex === 0 && (
              <>
                {/* File icon skeleton */}
                <Skeleton className="h-6 w-6 shrink-0" />
                {/* File name skeleton - varies width for realism */}
                <Skeleton 
                  className={cn(
                    "h-4",
                    index % 3 === 0 ? "w-32" : index % 3 === 1 ? "w-24" : "w-40"
                  )} 
                />
              </>
            )}
            {colIndex === 1 && (
              /* Size skeleton */
              <Skeleton className="h-4 w-16" />
            )}
            {colIndex === 2 && (
              /* Modified time skeleton */
              <Skeleton className="h-4 w-20" />
            )}
            {colIndex === 3 && (
              /* Owner skeleton */
              <Skeleton className="h-4 w-24" />
            )}
            {colIndex > 3 && (
              /* Generic column skeleton */
              <Skeleton className="h-4 w-16" />
            )}
          </div>
        </TableCell>
      ))}
    </TableRow>
  )
}

export function SkeletonTable({ 
  rows = 8, 
  columns = 4, 
  showHeader = true,
  className 
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonRow key={index} columns={columns} index={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Specialized skeleton for drive file listings
export function DriveTableSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonTable 
      rows={10}
      columns={4}
      showHeader={true}
      className={className}
    />
  )
}

// Skeleton for breadcrumb navigation
export function BreadcrumbSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-2 py-2", className)}>
      <Skeleton className="h-4 w-12" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-20" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

// Skeleton for sidebar folder tree
export function FolderTreeSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div 
          key={index} 
          className="flex items-center space-x-2 animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Skeleton className="h-4 w-4" />
          <Skeleton 
            className={cn(
              "h-4",
              index % 3 === 0 ? "w-24" : index % 3 === 1 ? "w-32" : "w-20"
            )} 
          />
        </div>
      ))}
    </div>
  )
}

// Skeleton for storage analytics cards
export function StorageCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div 
          key={index}
          className="rounded-lg border p-4 animate-pulse"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}