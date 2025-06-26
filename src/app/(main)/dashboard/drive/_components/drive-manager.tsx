'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { RefreshCw } from 'lucide-react'

import { DriveErrorBoundary } from '@/components/drive-error-boundary'
import { DrivePermissionRequired } from '@/components/drive-permission-required'
import { DriveErrorDisplay } from '@/components/drive-error-display'
import { DriveFile } from '@/lib/google-drive/types'
import { driveCache } from '@/lib/cache'
import { errorHandler } from '@/lib/enhanced-error-handler'
import { apiThrottle } from '@/lib/api-throttle'
import { successToast, errorToast } from '@/lib/toast'

import { DriveDataView } from './drive-data-view'
import { DriveToolbar } from './drive-toolbar'
import { FileBreadcrumb } from './file-breadcrumb'
import { DriveConnectionCard } from './drive-connection-card'
import { DriveGridSkeleton } from './drive-skeleton'
import { CreateFolderDialog } from './create-folder-dialog'
import { FileUploadDialog } from './file-upload-dialog'
import { BulkOperationsDialog } from './bulk-operations-dialog'
import { FileRenameDialog } from './file-rename-dialog'
import { FileDeleteDialog } from './file-delete-dialog'
import { FileDetailsDialog } from './file-details-dialog'
import { FileShareDialog } from './file-share-dialog'
import { FileCopyDialog } from './file-copy-dialog'
import { FileMoveDialog } from './file-move-dialog'
import { FilePreviewDialog } from './file-preview-dialog'
import { PermanentDeleteDialog } from './permanent-delete-dialog'
import { FiltersDialog } from './filters-dialog'

interface DriveManagerProps {
  className?: string
}

export function DriveManager({ className }: DriveManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  // Basic states
  const [files, setFiles] = useState<DriveFile[]>([])
  const [folders, setFolders] = useState<DriveFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolder, setCurrentFolder] = useState<string>('root')
  const [breadcrumbPath, setBreadcrumbPath] = useState<DriveFile[]>([])

  // Selection states
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  // Table column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    size: true,
    mimeType: false,
    owners: false,
    createdTime: false,
    modifiedTime: true,
  })

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [bulkOperationsOpen, setBulkOperationsOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false)
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false)

  // Current file for operations
  const [currentFile, setCurrentFile] = useState<DriveFile | null>(null)

  // Single operation progress
  const [singleOperationProgress, setSingleOperationProgress] = useState<{
    isVisible: boolean
    operation: string
  }>({
    isVisible: false,
    operation: '',
  })

  // Load files from API
  const loadFiles = useCallback(
    async (folderId: string = 'root', showLoading: boolean = true) => {
      try {
        if (showLoading) {
          setIsLoading(true)
        }
        setError(null)

        const params = new URLSearchParams({
          folderId,
          sortBy: 'modified',
          sortOrder: 'desc',
        })

        const response = await apiThrottle.throttleRequest(() =>
          fetch(`/api/drive/files?${params}`)
        )

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(`Failed to load files: ${errorData}`)
        }

        const data = await response.json()
        const allFiles = data.files || []

        // Separate files and folders
        const newFolders = allFiles.filter(
          (file: DriveFile) =>
            file.mimeType === 'application/vnd.google-apps.folder'
        )
        const newFiles = allFiles.filter(
          (file: DriveFile) =>
            file.mimeType !== 'application/vnd.google-apps.folder'
        )

        setFolders(newFolders)
        setFiles(newFiles)
        setCurrentFolder(folderId)

        // Load breadcrumb path
        if (folderId !== 'root') {
          await loadBreadcrumb(folderId)
        } else {
          setBreadcrumbPath([])
        }
      } catch (err: any) {
        const driveError = errorHandler.processError(err, 'loadFiles')
        setError(driveError)
        errorHandler.showErrorToast(driveError)
      } finally {
        setIsLoading(false)
        if (showLoading) {
          setRefreshing(false)
        }
      }
    },
    []
  )

  // Load breadcrumb path
  const loadBreadcrumb = useCallback(async (folderId: string) => {
    try {
      const response = await fetch(`/api/drive/files/${folderId}/details`)
      if (!response.ok) return

      const folderDetails = await response.json()
      const path: DriveFile[] = []

      // Build path by traversing parents
      let currentParent = folderDetails.parents?.[0]
      path.unshift(folderDetails)

      while (currentParent && currentParent !== 'root') {
        try {
          const parentResponse = await fetch(
            `/api/drive/files/${currentParent}/details`
          )
          if (parentResponse.ok) {
            const parentDetails = await parentResponse.json()
            path.unshift(parentDetails)
            currentParent = parentDetails.parents?.[0]
          } else {
            break
          }
        } catch {
          break
        }
      }

      setBreadcrumbPath(path)
    } catch (error) {
      // Breadcrumb loading is non-critical
      setBreadcrumbPath([])
    }
  }, [])

  // Handle folder navigation
  const handleFolderClick = useCallback(
    (folder: DriveFile) => {
      loadFiles(folder.id)
      setSelectedFiles(new Set())
      setIsSelectMode(false)
    },
    [loadFiles]
  )

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback(
    (folderId: string) => {
      loadFiles(folderId)
      setSelectedFiles(new Set())
      setIsSelectMode(false)
    },
    [loadFiles]
  )

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    driveCache.clear()
    loadFiles(currentFolder, false)
  }, [loadFiles, currentFolder])

  // Handle search
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (searchQuery.trim()) {
        // Implement search logic here
        loadFiles(currentFolder)
      }
    },
    [searchQuery, loadFiles, currentFolder]
  )

  // Selection handlers
  const handleSelectFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const allFileIds = [...files, ...folders].map((item) => item.id)
    setSelectedFiles(new Set(allFileIds))
  }, [files, folders])

  const handleClearSelection = useCallback(() => {
    setSelectedFiles(new Set())
    setIsSelectMode(false)
  }, [])

  // File operation handlers
  const handleFileRename = useCallback((file: DriveFile) => {
    setCurrentFile(file)
    setRenameDialogOpen(true)
  }, [])

  const handleFileDelete = useCallback((file: DriveFile) => {
    setCurrentFile(file)
    setDeleteDialogOpen(true)
  }, [])

  const handleFileDetails = useCallback((file: DriveFile) => {
    setCurrentFile(file)
    setDetailsDialogOpen(true)
  }, [])

  const handleFileShare = useCallback((file: DriveFile) => {
    setCurrentFile(file)
    setShareDialogOpen(true)
  }, [])

  const handleFileCopy = useCallback((file: DriveFile) => {
    setCurrentFile(file)
    setCopyDialogOpen(true)
  }, [])

  const handleFileMove = useCallback((file: DriveFile) => {
    setCurrentFile(file)
    setMoveDialogOpen(true)
  }, [])

  const handleFilePreview = useCallback((file: DriveFile) => {
    setCurrentFile(file)
    setPreviewDialogOpen(true)
  }, [])

  const handleFileDownload = useCallback(async (file: DriveFile) => {
    try {
      setSingleOperationProgress({
        isVisible: true,
        operation: `Downloading ${file.name}...`,
      })

      const link = document.createElement('a')
      link.href = `/api/drive/download/${file.id}`
      link.download = file.name
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      successToast.downloaded(file.name)
    } catch (error) {
      errorToast.downloadFailed(file.name)
    } finally {
      setSingleOperationProgress({ isVisible: false, operation: '' })
    }
  }, [])

  // Dialog handlers
  const handleCreateFolder = useCallback(() => {
    setCreateFolderOpen(true)
  }, [])

  const handleUpload = useCallback(() => {
    setUploadDialogOpen(true)
  }, [])

  const handleBulkOperations = useCallback(() => {
    setBulkOperationsOpen(true)
  }, [])

  // Success handlers for dialogs
  const handleOperationSuccess = useCallback(() => {
    loadFiles(currentFolder, false)
    setSelectedFiles(new Set())
  }, [loadFiles, currentFolder])

  // Initialize
  useEffect(() => {
    if (status === 'authenticated') {
      const folder = searchParams.get('folder') || 'root'
      loadFiles(folder)
    }
  }, [status, searchParams, loadFiles])

  // Memoized values
  const allItems = useMemo(() => [...folders, ...files], [folders, files])
  const selectedItems = useMemo(
    () => allItems.filter((item) => selectedFiles.has(item.id)),
    [allItems, selectedFiles]
  )

  // Render loading state
  if (status === 'loading' || isLoading) {
    return <DriveGridSkeleton />
  }

  // Render unauthenticated state
  if (status === 'unauthenticated') {
    return <DriveConnectionCard />
  }

  // Render error state
  if (error) {
    if (error.code === 'PERMISSION_DENIED' || error.code === 'UNAUTHORIZED') {
      return <DrivePermissionRequired error={error} onRetry={handleRefresh} />
    }
    return <DriveErrorDisplay error={error} onRetry={handleRefresh} />
  }

  return (
    <DriveErrorBoundary>
      <div className={`space-y-4 ${className || ''}`}>
        {/* Breadcrumb */}
        <FileBreadcrumb
          breadcrumbPath={breadcrumbPath}
          currentFolderId={currentFolder}
          onNavigate={handleBreadcrumbClick}
        />

        {/* Toolbar */}
        <DriveToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isSelectMode={isSelectMode}
          onSelectModeChange={setIsSelectMode}
          selectedCount={selectedFiles.size}
          onSelectAll={handleSelectAll}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onUpload={handleUpload}
          onCreateFolder={handleCreateFolder}
          onBulkOperations={handleBulkOperations}
          onBulkDelete={() => setDeleteDialogOpen(true)}
          onBulkMove={() => {}}
          onBulkCopy={() => {}}
          onBulkShare={() => {}}
          onClearSelection={handleClearSelection}
          items={allItems.map((item) => ({
            ...item,
            type:
              item.mimeType === 'application/vnd.google-apps.folder'
                ? ('folder' as const)
                : ('file' as const),
          }))}
          onFiltersOpen={() => setFiltersDialogOpen(true)}
          selectedItems={selectedItems.map((item) => ({
            ...item,
            type:
              item.mimeType === 'application/vnd.google-apps.folder'
                ? ('folder' as const)
                : ('file' as const),
          }))}
          onBulkDownload={() => {}}
          onBulkRename={() => {}}
          onBulkExport={() => {}}
          onDeselectAll={handleClearSelection}
          onRefreshAfterBulkOp={() => loadFiles(currentFolder, false)}
          filters={{
            activeView: 'all',
            fileTypeFilter: [],
            advancedFilters: {
              sizeRange: { unit: 'MB' as const },
              createdDateRange: {},
              modifiedDateRange: {},
              sortBy: 'modified' as const,
              sortOrder: 'desc' as const,
            },
          }}
          onFilterChange={() => {}}
          onApplyFilters={() => {}}
          onClearFilters={() => {}}
          hasActiveFilters={false}
          setIsUploadDialogOpen={setUploadDialogOpen}
          setIsCreateFolderDialogOpen={setCreateFolderOpen}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          loading={isLoading}
          onClientSideFilter={() => {}}
          onClearClientSideFilter={() => {}}
        />

        {/* Data View */}
        <DriveDataView
          items={allItems}
          viewMode={viewMode}
          isSelectMode={isSelectMode}
          selectedItems={selectedFiles}
          visibleColumns={visibleColumns}
          onSelectItem={handleSelectFile}
          onSelectModeChange={setIsSelectMode}
          onFolderClick={(folderId: string) => {
            const folder = folders.find((f) => f.id === folderId)
            if (folder) handleFolderClick(folder)
          }}
          onColumnsChange={(config) => {
            // Handle column configuration changes here if needed
          }}
          onItemAction={(action, item) => {
            switch (action) {
              case 'rename':
                handleFileRename(item)
                break
              case 'delete':
                handleFileDelete(item)
                break
              case 'details':
                handleFileDetails(item)
                break
              case 'share':
                handleFileShare(item)
                break
              case 'copy':
                handleFileCopy(item)
                break
              case 'move':
                handleFileMove(item)
                break
              case 'preview':
                handleFilePreview(item)
                break
              case 'download':
                handleFileDownload(item)
                break
            }
          }}
        />

        {/* Dialogs */}
        <CreateFolderDialog
          isOpen={createFolderOpen}
          onClose={() => setCreateFolderOpen(false)}
          parentFolderId={currentFolder}
          onSuccess={handleOperationSuccess}
        />

        <FileUploadDialog
          isOpen={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          parentFolderId={currentFolder}
          onSuccess={handleOperationSuccess}
        />

        <BulkOperationsDialog
          isOpen={bulkOperationsOpen}
          onClose={() => setBulkOperationsOpen(false)}
          selectedItems={selectedItems.map((item) => ({
            ...item,
            type:
              item.mimeType === 'application/vnd.google-apps.folder'
                ? ('folder' as const)
                : ('file' as const),
          }))}
          onRefreshAfterBulkOp={handleOperationSuccess}
        />

        <FileRenameDialog
          open={renameDialogOpen}
          onClose={() => setRenameDialogOpen(false)}
          selectedItem={currentFile}
          onSuccess={handleOperationSuccess}
        />

        <FileDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => setDeleteDialogOpen(open)}
          selectedItems={
            selectedFiles.size > 0
              ? selectedItems.map((item) => ({
                  ...item,
                  type:
                    item.mimeType === 'application/vnd.google-apps.folder'
                      ? ('folder' as const)
                      : ('file' as const),
                }))
              : currentFile
                ? [
                    {
                      ...currentFile,
                      type:
                        currentFile.mimeType ===
                        'application/vnd.google-apps.folder'
                          ? ('folder' as const)
                          : ('file' as const),
                    },
                  ]
                : []
          }
          onRefreshAfterBulkOp={handleOperationSuccess}
        />

        <FileDetailsDialog
          isOpen={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          selectedItem={currentFile}
        />

        <FileShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          selectedItem={currentFile}
        />

        <FileCopyDialog
          isOpen={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
          selectedItem={currentFile}
          onRefreshAfterBulkOp={handleOperationSuccess}
        />

        <FileMoveDialog
          isOpen={moveDialogOpen}
          onClose={() => setMoveDialogOpen(false)}
          selectedItem={currentFile}
          onRefreshAfterBulkOp={handleOperationSuccess}
        />

        <FilePreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          selectedItem={currentFile}
        />

        <PermanentDeleteDialog
          open={permanentDeleteOpen}
          onClose={() => setPermanentDeleteOpen(false)}
          selectedItems={
            selectedFiles.size > 0
              ? selectedItems.map((item) => ({
                  ...item,
                  type:
                    item.mimeType === 'application/vnd.google-apps.folder'
                      ? ('folder' as const)
                      : ('file' as const),
                }))
              : currentFile
                ? [
                    {
                      ...currentFile,
                      type:
                        currentFile.mimeType ===
                        'application/vnd.google-apps.folder'
                          ? ('folder' as const)
                          : ('file' as const),
                    },
                  ]
                : []
          }
          onRefreshAfterBulkOp={handleOperationSuccess}
        />

        <FiltersDialog
          open={filtersDialogOpen}
          onClose={() => setFiltersDialogOpen(false)}
        />

        {/* Single Operation Progress */}
        {singleOperationProgress.isVisible && (
          <div className="bg-background fixed right-4 bottom-4 rounded-lg border p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <div className="text-sm font-medium">
                {singleOperationProgress.operation}
              </div>
            </div>
          </div>
        )}
      </div>
    </DriveErrorBoundary>
  )
}
