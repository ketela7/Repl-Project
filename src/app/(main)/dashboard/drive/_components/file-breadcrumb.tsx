'use client'

import { useState, useEffect, Fragment } from 'react'
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

  const fetchFolderPath = async (folderId: string) => {
    try {
      // // // // // console.log('[Breadcrumb] Starting fetchFolderPath for:', folderId)
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/drive/files?fileId=${folderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      // // // // // console.log('[Breadcrumb] API Response status:', response.status)
      // // // // // console.log('[Breadcrumb] API Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        // // // // // console.error('[Breadcrumb] API Error response:', errorText)
        throw new Error(`Failed to fetch folder: ${response.status} - ${errorText}`)
      }

      const folder = await response.json()
      // // // // // console.log('[Breadcrumb] Initial folder data:', folder)
      // // // // // console.log('[Breadcrumb] Folder properties:', Object.keys(folder))
      // // // // // console.log('[Breadcrumb] Folder ID raw:', folder.id)
      // // // // // console.log('[Breadcrumb] Folder name:', folder.name)
      // // // // // console.log('[Breadcrumb] Folder parents:', folder.parents)

      // Use fileId if id is not available (common in Google Drive API responses)
      const actualId = folder.id || folderId
      // // // // // console.log('[Breadcrumb] Resolved folder ID:', actualId)

      // Validate folder data
      if (!actualId) {
        // // // // // console.error('[Breadcrumb] ERROR: Folder missing ID property!', folder)
        throw new Error('Invalid folder data: missing ID')
      }

      // Update folder object with correct ID
      folder.id = actualId

      const pathItems: BreadcrumbItemData[] = []
      let currentFolder = folder
      const visitedFolders = new Set<string>()

      // Add current folder first
      // // // // // console.log('[Breadcrumb] Adding current folder - ID:', currentFolder.id, 'Name:', currentFolder.name)
      pathItems.push({ id: currentFolder.id, name: currentFolder.name })
      visitedFolders.add(currentFolder.id)

      // Traverse up to root
      // // // // // console.log('[Breadcrumb] Starting parent traversal, current folder parents:', currentFolder.parents)

      while (
        currentFolder.parents &&
        currentFolder.parents.length > 0 &&
        currentFolder.parents[0] !== 'root'
      ) {
        const parentId = currentFolder.parents[0]
        // // // // // console.log('[Breadcrumb] Processing parent ID:', parentId)

        // Prevent infinite loops
        if (visitedFolders.has(parentId)) {
          // // // // // console.log('[Breadcrumb] Detected circular reference, breaking loop')
          break
        }
        try {
          // // // // // console.log('[Breadcrumb] Fetching parent with fileId:', parentId)

          const parentResponse = await fetch(`/api/drive/files?fileId=${parentId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!parentResponse.ok) {
            // // // // // console.log('[Breadcrumb] Parent response not ok:', parentResponse.status)
            break
          }

          const parentFolder = await parentResponse.json()
          // // // // // console.log('[Breadcrumb] Parent folder data:', parentFolder)
          // // // // // console.log('[Breadcrumb] Parent folder properties:', Object.keys(parentFolder))
          // // // // // console.log('[Breadcrumb] Parent folder ID raw:', parentFolder.id)
          // // // // // console.log('[Breadcrumb] Parent folder name:', parentFolder.name)

          // Use fileId if id is not available
          const actualParentId = parentFolder.id || parentId
          // // // // // console.log('[Breadcrumb] Resolved parent folder ID:', actualParentId)

          // Validate parent folder data
          if (!actualParentId) {
            // // // // // console.error('[Breadcrumb] ERROR: Parent folder missing ID!', parentFolder)
            break
          }

          // Update parent folder object with correct ID
          parentFolder.id = actualParentId

          // // // // // console.log('[Breadcrumb] Adding parent folder - ID:', parentFolder.id, 'Name:', parentFolder.name)
          pathItems.push({ id: parentFolder.id, name: parentFolder.name })
          visitedFolders.add(actualParentId)
          currentFolder = parentFolder
          // // // // // console.log('[Breadcrumb] Next parent will be:', currentFolder.parents ? currentFolder.parents[0] : 'none')
        } catch (err) {
          // // // // // console.error(`[Breadcrumb] Error fetching parent folder:${parentId}`, err)
          break
        }
      }

      // // // // // console.log('[Breadcrumb] Finished parent traversal, pathItems before reverse:', pathItems)

      // Reverse path items to show from root to current folder
      pathItems.reverse()
      // // // // // console.log('[Breadcrumb] Final items:', pathItems)
      setBreadcrumbItems(pathItems)
    } catch (error) {
      // Log error for debugging in development only
      // // // // // console.error(`Error fetching folder path: ${folderId}`, error)

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
                      // // // // // console.log('[Breadcrumb] Navigating to folder:', folder.name, 'ID:', folder.id)
                      // // // // // console.log('[Breadcrumb] Full folder object:', folder)
                      if (!folder.id) {
                        // // // // // console.error('[Breadcrumb] ERROR: Folder ID is null/undefined!', folder)
                        // // // // // console.error('[Breadcrumb] Cannot navigate without valid folder ID')
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
