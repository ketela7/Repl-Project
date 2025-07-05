'use client'

import { useState, useEffect, Fragment, useRef } from 'react'
import { Home, Folder, ChevronRight, Loader2 } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { BreadcrumbSkeleton } from '@/components/ui/skeleton-table'

interface BreadcrumbItemData {
  id: string
  name: string
}

interface FileBreadcrumbProps {
  currentFolderId: string | null
  onNavigate: (folderId: string | null) => void
  onBackToRoot?: () => void
  loading?: boolean
}

export function FileBreadcrumb({
  currentFolderId,
  onNavigate,
  loading: externalLoading,
}: FileBreadcrumbProps) {
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItemData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchFolderPath = async (folderId: string) => {
    // Cancel previous request untuk prevent race condition
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/drive/files?fileId=${folderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()

        throw new Error(`Failed to fetch folder: ${response.status} - ${errorText}`)
      }

      const folder = await response.json()

      // Use fileId if id is not available (common in Google Drive API responses)
      const actualId = folder.id || folderId

      // Validate folder data
      if (!actualId) {
        throw new Error('Invalid folder data: missing ID')
      }

      // Update folder object with correct ID
      folder.id = actualId

      const pathItems: BreadcrumbItemData[] = []
      let currentFolder = folder
      const visitedFolders = new Set<string>()

      // Add current folder first

      pathItems.push({ id: currentFolder.id, name: currentFolder.name })
      visitedFolders.add(currentFolder.id)

      // Traverse up to root

      while (
        currentFolder.parents &&
        currentFolder.parents.length > 0 &&
        currentFolder.parents[0] !== 'root'
      ) {
        const parentId = currentFolder.parents[0]

        // Prevent infinite loops
        if (visitedFolders.has(parentId)) {
          break
        }
        try {
          const parentResponse = await fetch(`/api/drive/files?fileId=${parentId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!parentResponse.ok) {
            break
          }

          const parentFolder = await parentResponse.json()

          // Use fileId if id is not available
          const actualParentId = parentFolder.id || parentId

          // Validate parent folder data
          if (!actualParentId) {
            break
          }

          // Update parent folder object with correct ID
          parentFolder.id = actualParentId

          pathItems.push({ id: parentFolder.id, name: parentFolder.name })
          visitedFolders.add(actualParentId)
          currentFolder = parentFolder
        } catch (err) {
          break
        }
      }

      // Reverse path items to show from root to current folder
      pathItems.reverse()

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) return

      setBreadcrumbItems(pathItems)
    } catch (error: unknown) {
      // Check if abort error (bukan real error)
      if (error instanceof Error && error.name === 'AbortError') return

      // Log error for debugging in development only

      setError('Failed to load folder path')
      setBreadcrumbItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentFolderId) {
      fetchFolderPath(currentFolderId)
    } else {
      setBreadcrumbItems([])
      setError(null)
    }
  }, [currentFolderId])

  const isLoading = loading || externalLoading

  // Show skeleton while loading folder path
  if (isLoading && currentFolderId && breadcrumbItems.length === 0) {
    return (
      <div className="bg-muted/30 flex items-center gap-2 overflow-x-auto rounded-lg border px-2 py-3">
        <BreadcrumbSkeleton />
      </div>
    )
  }

  return (
    <div className="bg-muted/30 flex items-center gap-2 overflow-x-auto rounded-lg border px-2 py-3">
      <Breadcrumb>
        <BreadcrumbList className="min-w-0 flex-nowrap">
          {/* Root Drive Link */}
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              onClick={e => {
                e.preventDefault()
                onNavigate(null)
              }}
              className={`hover:text-primary flex items-center gap-2 whitespace-nowrap transition-colors ${!currentFolderId ? 'text-primary font-medium' : ''}`}
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">My Drive</span>
              <span className="sm:hidden">Drive</span>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Folder Breadcrumb Items */}
          {breadcrumbItems.map((folder, index) => (
            <Fragment key={`breadcrumb-${folder.id}-${index}`}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {index === breadcrumbItems.length - 1 ? (
                  <BreadcrumbPage className="flex max-w-[120px] items-center gap-2 whitespace-nowrap sm:max-w-[200px] md:max-w-none">
                    <Folder className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-primary truncate font-medium">{folder.name}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    onClick={e => {
                      e.preventDefault()

                      if (!folder.id) {
                        return
                      }
                      onNavigate(folder.id)
                    }}
                    className="hover:text-primary flex max-w-[120px] items-center gap-2 whitespace-nowrap transition-colors sm:max-w-[200px] md:max-w-none"
                  >
                    <Folder className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-muted-foreground ml-2 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="hidden text-xs sm:inline">Loading...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-destructive ml-2 flex items-center gap-1">
          <span className="text-xs">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => currentFolderId && fetchFolderPath(currentFolderId)}
            className="h-6 px-2 text-xs"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}

export default FileBreadcrumb
