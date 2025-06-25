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
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItemData[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFolderPath = async (folderId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/drive/files/${folderId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch folder: ${response.status}`)
      }

      const folder = await response.json()
      const items: BreadcrumbItemData[] = [{ id: folder.id, name: folder.name }]

      // Build path by traversing parent folders
      let currentParent = folder.parents?.[0]
      let depth = 0
      const maxDepth = 10 // Prevent infinite loops

      while (currentParent && currentParent !== 'root' && depth < maxDepth) {
        try {
          const parentResponse = await fetch(
            `/api/drive/files/${currentParent}`
          )
          if (!parentResponse.ok) break

          const parentFolder = await parentResponse.json()
          items.unshift({ id: parentFolder.id, name: parentFolder.name })
          currentParent = parentFolder.parents?.[0]
          depth++
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
          }
          break
        }
      }

      setBreadcrumbItems(items)
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
      }
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
              onClick={(e) => {
                e.preventDefault()
                onNavigate(null)
              }}
              className={`hover:text-primary flex items-center gap-2 whitespace-nowrap transition-colors ${
                !currentFolderId ? 'text-primary font-medium' : ''
              }`}
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">My Drive</span>
              <span className="sm:hidden">Drive</span>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Folder Breadcrumb Items */}
          {breadcrumbItems.map((folder, index) => (
            <Fragment key={folder.id}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {index === breadcrumbItems.length - 1 ? (
                  <BreadcrumbPage className="flex max-w-[120px] items-center gap-2 whitespace-nowrap sm:max-w-[200px] md:max-w-none">
                    <Folder className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-primary truncate font-medium">
                      {folder.name}
                    </span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
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
