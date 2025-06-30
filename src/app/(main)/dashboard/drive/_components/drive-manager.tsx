'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw } from 'lucide-react'

import { DriveFile, DriveFolder } from '@/lib/google-drive/types'
import { normalizeFileSize, getFileActions } from '@/lib/google-drive/utils'
import { errorToast } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useTimezoneContext } from '@/components/timezone-provider'
import { Progress } from '@/components/ui/progress'
import { DriveErrorDisplay } from '@/components/drive-error-display'
import { DrivePermissionRequired } from '@/components/drive-permission-required'

import { FileBreadcrumb } from './file-breadcrumb'
import { DriveGridSkeleton } from './drive-skeleton'
import { FileUploadDialog } from './file-upload-dialog'
import { CreateFolderDialog } from './create-folder-dialog'
import { FilePreviewDialog } from './file-preview-dialog'
import { FileDetailsDialog } from './file-details-dialog'
import { DriveToolbar } from './drive-toolbar'
import { DriveDataView } from './drive-data-view'

type DriveItem = (DriveFile | DriveFolder) & {
  itemType?: 'file' | 'folder'
  isFolder?: boolean
  canDownload?: boolean
  canRename?: boolean
  canShare?: boolean
  canTrash?: boolean
  canDelete?: boolean
  canUntrash?: boolean
  canMove?: boolean
  canCopy?: boolean
}
// Helper function to convert size units to bytes (Google Drive API requirement)
function getSizeMultiplier(unit: string): number {
  switch (unit) {
    case 'B':
      return 1
    case 'KB':
      return 1024
    case 'MB':
      return 1024 * 1024
    case 'GB':
      return 1024 * 1024 * 1024
    default:
      return 1024 * 1024 // Default to MB
  }
}

const initialFilters = {
  activeView: 'all' as 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash',
  fileTypeFilter: [] as string[],
  advancedFilters: {
    sizeRange: {
      unit: 'MB' as 'B' | 'KB' | 'MB' | 'GB',
      min: undefined,
      max: undefined,
    },
    sortBy: 'modified' as 'name' | 'modified' | 'created' | 'size',
    sortOrder: 'desc' as 'asc' | 'desc',
    createdDateRange: { from: undefined, to: undefined },
    modifiedDateRange: { from: undefined, to: undefined },
    owner: undefined,
    pageSize: 50,
  },
}

export function DriveManager() {
  // Core state
  const [items, setItems] = useState<DriveItem[]>([])
  const [filteredItems, setFilteredItems] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [driveAccessError, setDriveAccessError] = useState<any>(null)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [needsReauth, setNeedsReauth] = useState(false)

  // UI state
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const { timezone, isLoading: timezoneLoading } = useTimezoneContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState(initialFilters)

  // Table state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    size: false,
    owners: false,
    mimeType: false,
    createdTime: false,
    modifiedTime: false,
  })

  // Dialog state - consolidated
  const [dialogs, setDialogs] = useState({
    upload: false,
    createFolder: false,
    details: false,
    preview: false,
    mobileFilters: false,
  })

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'id' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType' | 'owners'
    direction: 'asc' | 'desc'
  } | null>(null)

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | null>(null)
  const [selectedFileForDetails, setSelectedFileForDetails] = useState<DriveItem | null>(null)

  // Progress states
  const [operationsProgress, setOperationsProgress] = useState<{
    isRunning: boolean
    current: number
    total: number
    operation: string
    type: 'bulk' | 'single'
  }>({ isRunning: false, current: 0, total: 0, operation: '', type: 'single' })

  // Refs for optimization
  const lastFiltersRef = useRef<string>('')
  const activeRequestsRef = useRef<Set<string>>(new Set())

  // Helper functions
  const openDialog = (dialogName: keyof typeof dialogs) => {
    setDialogs((prev) => ({ ...prev, [dialogName]: true }))
  }

  const closeDialog = (dialogName: keyof typeof dialogs) => {
    setDialogs((prev) => ({ ...prev, [dialogName]: false }))
  }

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters)
    setSearchQuery('')
    setTimeout(() => fetchFiles(currentFolderId || undefined, undefined), 0)
  }, [currentFolderId])

  const handleFilter = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      advancedFilters: {
        ...prev.advancedFilters,
        ...newFilters.advancedFilters,
      },
    }))
  }, [])

  // Check if any filters are active
  const hasActiveFilters: boolean =
    filters.activeView !== 'all' ||
    filters.fileTypeFilter.length > 0 ||
    searchQuery.trim() !== '' ||
    !!filters.advancedFilters.sizeRange.min ||
    !!filters.advancedFilters.sizeRange.max ||
    !!filters.advancedFilters.createdDateRange.from ||
    !!filters.advancedFilters.createdDateRange.to ||
    !!filters.advancedFilters.modifiedDateRange.from ||
    !!filters.advancedFilters.modifiedDateRange.to ||
    !!(filters.advancedFilters.owner && String(filters.advancedFilters.owner).trim())

  // Sorting Start
  const handleSort = (key: 'name' | 'id' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType' | 'owners') => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const sortedItems = useMemo(() => {
    if (!sortConfig) {
      return [...items].sort((a, b) => {
        const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder'
        const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder'
        if (aIsFolder && !bIsFolder) return -1
        if (!aIsFolder && bIsFolder) return 1
        return 0
      })
    }

    return [...items].sort((a, b) => {
      const { key, direction } = sortConfig
      let aValue: any, bValue: any
      const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder'
      const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder'

      switch (key) {
        case 'name':
          aValue = (a.name || '').toLowerCase()
          bValue = (b.name || '').toLowerCase()
          break
        case 'size':
          aValue = aIsFolder ? 0 : normalizeFileSize((a as any).size)
          bValue = bIsFolder ? 0 : normalizeFileSize((b as any).size)
          break
        case 'modifiedTime':
          aValue = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0
          bValue = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0
          break
        case 'createdTime':
          aValue = a.createdTime ? new Date(a.createdTime).getTime() : 0
          bValue = b.createdTime ? new Date(b.createdTime).getTime() : 0
          break
        case 'mimeType':
          aValue = aIsFolder ? 'folder' : (a.mimeType || '').toLowerCase()
          bValue = bIsFolder ? 'folder' : (b.mimeType || '').toLowerCase()
          break
        case 'owners':
          aValue = (a.owners?.[0]?.emailAddress || '').toLowerCase()
          bValue = (b.owners?.[0]?.emailAddress || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue === null || aValue === undefined || aValue === '' || aValue === '-') aValue = key === 'size' ? 0 : ''
      if (bValue === null || bValue === undefined || bValue === '' || bValue === '-') bValue = key === 'size' ? 0 : ''

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortConfig])
  // Sorting End

  // Selected items with details for operations
  const selectedItemsWithDetails = useMemo(() => {
    return Array.from(selectedItems).map((itemId) => {
      const item = items.find((i) => i.id === itemId)
      const itemIsFolder = item?.mimeType === 'application/vnd.google-apps.folder'

      return {
        id: itemId,
        name: item?.name || 'Unknown',
        mimeType: item?.mimeType || '',
        modifiedTime: item?.modifiedTime || '',
        createdTime: item?.createdTime || '',
        size: (item as any)?.size,
        owners: item?.owners || [],
        isTrashed: item?.trashed || false,
        isStarred: item?.starred || false,
        isShared: item?.shared || false,
        isFolder: itemIsFolder,
        canCopy: !item?.trashed && item?.capabilities?.canCopy,
        canDelete: item?.capabilities?.canDelete,
        canDownload: !item?.trashed && !itemIsFolder && item?.capabilities?.canDownload,
        canTrash: !item?.trashed && item?.capabilities?.canTrash,
        canUntrash: item?.trashed && item?.capabilities?.canUntrash,
        canRename: !item?.trashed && item?.capabilities?.canRename,
        canShare: !item?.trashed,
        canMove: !item?.trashed && item?.capabilities?.canMoveItemWithinDrive,
        canExport: !item?.trashed && !itemIsFolder,
      }
    })
  }, [selectedItems, items])

  // API call function
  const fetchFiles = useCallback(
    async (folderId?: string, searchQuery?: string, pageToken?: string) => {
      let callId = ''
      try {
        if (!folderId && folderId !== '') folderId = currentFolderId || undefined

        const filterKey = JSON.stringify({
          view: filters.activeView,
          types: filters.fileTypeFilter,
          sort: filters.advancedFilters.sortBy,
          order: filters.advancedFilters.sortOrder,
          size: filters.advancedFilters.sizeRange,
          created: filters.advancedFilters.createdDateRange,
          modified: filters.advancedFilters.modifiedDateRange,
          owner: filters.advancedFilters.owner,
        })

        callId = `${folderId}-${searchQuery}-${pageToken}-${filterKey}`

        if (activeRequestsRef.current.has(callId)) return
        if (filterKey !== lastFiltersRef.current && pageToken) return
        lastFiltersRef.current = filterKey

        setLoading(!pageToken)
        setLoadingMore(!!pageToken)

        activeRequestsRef.current.add(callId)

        const params = new URLSearchParams({
          sortBy: filters.advancedFilters.sortBy,
          sortOrder: filters.advancedFilters.sortOrder,
        })

        if (folderId) params.append('folderId', folderId)
        if (searchQuery) params.append('search', searchQuery)
        if (pageToken) params.append('pageToken', pageToken)
        if (filters.activeView && filters.activeView !== 'all') params.append('viewStatus', filters.activeView)
        if (filters.fileTypeFilter?.length > 0) params.append('fileType', filters.fileTypeFilter.join(','))
        if (filters.advancedFilters.createdDateRange?.from) params.append('createdAfter', filters.advancedFilters.createdDateRange.from.toISOString())
        if (filters.advancedFilters.createdDateRange?.to) params.append('createdBefore', filters.advancedFilters.createdDateRange.to.toISOString())
        if (filters.advancedFilters.modifiedDateRange?.from) params.append('modifiedAfter', filters.advancedFilters.modifiedDateRange.from.toISOString())
        if (filters.advancedFilters.modifiedDateRange?.to) params.append('modifiedBefore', filters.advancedFilters.modifiedDateRange.to.toISOString())
        if (filters.advancedFilters.owner?.trim()) params.append('owner', filters.advancedFilters.owner.trim())

        // Add size filtering parameters (Google Drive API specification - values in bytes)
        if (filters.advancedFilters.sizeRange?.min && filters.advancedFilters.sizeRange.min > 0) {
          const multiplier = getSizeMultiplier(filters.advancedFilters.sizeRange.unit)
          const minBytes = Math.floor(filters.advancedFilters.sizeRange.min * multiplier)
          params.append('sizeMin', String(minBytes))
        }
        if (filters.advancedFilters.sizeRange?.max && filters.advancedFilters.sizeRange.max > 0) {
          const multiplier = getSizeMultiplier(filters.advancedFilters.sizeRange.unit)
          const maxBytes = Math.floor(filters.advancedFilters.sizeRange.max * multiplier)
          params.append('sizeMax', String(maxBytes))
        }

        // Add pageSize parameter
        if (filters.advancedFilters.pageSize && filters.advancedFilters.pageSize !== 50) {
          params.append('pageSize', String(filters.advancedFilters.pageSize))
        }

        const response = await fetch(`/api/drive/files?${params}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          if (response.status === 401) {
            setNeedsReauth(true)
            throw new Error('Authentication required')
          }
          throw new Error(`Failed to fetch files: ${response.statusText}`)
        }

        const data = await response.json()
        if (data.error) throw new Error(data.error)

        const newItems = (data.files || data || []).map((item: any) => ({
          ...item,
          itemType: item.mimeType === 'application/vnd.google-apps.folder' ? ('folder' as const) : ('file' as const),
        }))

        setItems((prev) => (pageToken ? [...prev, ...newItems] : newItems))

        setNextPageToken(data.nextPageToken || null)
        setHasAccess(true)
        setDriveAccessError(null)
      } catch (error: any) {
        if (error.message?.includes('Authentication') || error.message?.includes('401') || error.status === 401) {
          setNeedsReauth(true)
          setDriveAccessError(error)
          window.location.href = '/auth/v1/login'
        } else {
          setDriveAccessError(error)
          errorToast.apiError('Failed to load files')
        }
        setHasAccess(false)
      } finally {
        setLoading(false)
        setLoadingMore(false)
        setRefreshing(false)
        if (callId) activeRequestsRef.current.delete(callId)
      }
    },
    [currentFolderId, filters]
  )

  // Search submit handler
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)
    },
    [fetchFiles, currentFolderId, searchQuery]
  )

  // Effects for initial load and dependencies
  useEffect(() => {
    fetchFiles()
  }, [])

  // Navigation handlers
  const handleFolderClick = useCallback(
    (folderId: string) => {
      setCurrentFolderId(folderId)
      setSelectedItems(new Set())
      fetchFiles(folderId)
    },
    [fetchFiles]
  )

  const handleBackToParent = useCallback(() => {
    setCurrentFolderId(null)
    setSelectedItems(new Set())
    fetchFiles()
  }, [fetchFiles])

  // Selection handlers
  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)
  }, [fetchFiles, currentFolderId, searchQuery])

  const handleClientSideFilter = useCallback((filteredItems: any[]) => {
    setFilteredItems(filteredItems)
  }, [])

  const clearClientSideFilter = useCallback(() => {
    setFilteredItems([])
  }, [])

  // Apply client-side size filtering
  const sizeFilteredItems = useMemo(() => {
    if (!filters.advancedFilters.sizeRange?.min && !filters.advancedFilters.sizeRange?.max) {
      return items
    }

    return items.filter((item) => {
      if (item.mimeType === 'application/vnd.google-apps.folder') return true

      const sizeStr = (item as any).size
      let sizeBytes = 0
      if (sizeStr && sizeStr !== '-' && sizeStr !== 'undefined' && sizeStr !== 'null' && sizeStr.trim() !== '') {
        const parsed = parseInt(sizeStr, 10)
        if (!isNaN(parsed)) {
          sizeBytes = parsed
        }
      }

      const sizeUnit = filters.advancedFilters.sizeRange?.unit || 'MB'
      const minSize = filters.advancedFilters.sizeRange?.min
      const maxSize = filters.advancedFilters.sizeRange?.max

      const getBytes = (size: number, unit: string) => {
        switch (unit.toUpperCase()) {
          case 'B':
            return size
          case 'KB':
            return size * 1024
          case 'MB':
            return size * 1024 * 1024
          case 'GB':
            return size * 1024 * 1024 * 1024
          default:
            return size * 1024 * 1024
        }
      }

      if (minSize !== undefined && sizeBytes < getBytes(minSize, sizeUnit)) return false
      if (maxSize !== undefined && sizeBytes > getBytes(maxSize, sizeUnit)) return false
      return true
    })
  }, [items, filters.advancedFilters.sizeRange])

  const displayItems = useMemo(() => {
    return filteredItems.length > 0 ? filteredItems : sizeFilteredItems
  }, [filteredItems, sizeFilteredItems])

  const sortedDisplayItems = useMemo(() => {
    const currentView = filters.activeView || 'all'
    const itemsToSort = [...displayItems].map((item) => {
      const isFolder = item.mimeType === 'application/vnd.google-apps.folder'
      const actions = getFileActions(
        {
          capabilities: item.capabilities,
          trashed: item.trashed,
          mimeType: item.mimeType,
          itemType: isFolder ? 'folder' : 'file',
        },
        currentView
      )

      return {
        ...item,
        isFolder,
        canDownload: actions.canDownload,
        canRename: actions.canRename,
        canMove: actions.canMove,
        canCopy: actions.canCopy,
        canShare: actions.canShare,
        canTrash: actions.canTrash,
        canDelete: actions.canPermanentDelete,
        canUntrash: actions.canUntrash,
      }
    })

    if (sortConfig && sortConfig.key) {
      itemsToSort.sort((a, b) => {
        let aValue: any, bValue: any

        switch (sortConfig.key) {
          case 'name':
            aValue = a.name?.toLowerCase() || ''
            bValue = b.name?.toLowerCase() || ''
            break
          case 'size':
            aValue = normalizeFileSize((a as any).size || '0 B')
            bValue = normalizeFileSize((b as any).size || '0 B')
            break
          case 'modifiedTime':
            aValue = new Date(a.modifiedTime || 0).getTime()
            bValue = new Date(b.modifiedTime || 0).getTime()
            break
          case 'createdTime':
            aValue = new Date((a as any).createdTime || 0).getTime()
            bValue = new Date((b as any).createdTime || 0).getTime()
            break
          case 'mimeType':
            aValue = a.isFolder ? 'folder' : (a.mimeType || '').toLowerCase()
            bValue = b.isFolder ? 'folder' : (b.mimeType || '').toLowerCase()
            break
          case 'owners':
            aValue = ((a as any).owners?.[0]?.displayName || (a as any).owners?.[0]?.emailAddress || '').toLowerCase()
            bValue = ((b as any).owners?.[0]?.displayName || (b as any).owners?.[0]?.emailAddress || '').toLowerCase()
            break
          default:
            return 0
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return itemsToSort
  }, [displayItems, sortConfig])

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === sortedDisplayItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(sortedDisplayItems.map((item) => item.id)))
    }
  }, [sortedDisplayItems, selectedItems.size])

  // Bulk operation completion handler
  const handleBulkOperationComplete = () => {
    setSelectedItems(new Set())
    handleRefresh()
  }

  if (loading) {
    return <DriveGridSkeleton />
  }

  if (hasAccess === false && driveAccessError) {
    if (needsReauth) {
      return <DrivePermissionRequired error={driveAccessError} onRetry={handleRefresh} />
    }
    return <DriveErrorDisplay error={driveAccessError} onRetry={handleRefresh} />
  }

  return (
    <div className="flex h-full flex-col">
      {/* Global Fixed Toolbar */}
      <DriveToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={(e) => {
              e.preventDefault()
              fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectMode={isSelectMode}
            onSelectModeChange={setIsSelectMode}
            selectedCount={selectedItems.size}
            onSelectAll={handleSelectAll}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onUpload={() => openDialog('upload')}
            onCreateFolder={() => openDialog('createFolder')}
            selectedItems={selectedItemsWithDetails}
            onDeselectAll={() => {
              setSelectedItems(new Set())
            }}
            onRefreshAfterOp={handleRefresh}
            filters={filters}
            onFilterChange={handleFilter as any}
            onApplyFilters={() => fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)}
            onClearFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            items={items}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            setIsUploadDialogOpen={() => openDialog('upload')}
            setIsCreateFolderDialogOpen={() => openDialog('createFolder')}
            loading={loading}
            onClientSideFilter={handleClientSideFilter}
            onClearClientSideFilter={clearClientSideFilter}
            isApplying={false}
          />

      {/* Content with padding to account for fixed toolbar */}
      <div className="pt-16 flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {currentFolderId && (
            <FileBreadcrumb currentFolderId={currentFolderId} onNavigate={(folderId) => (folderId ? handleFolderClick(folderId) : handleBackToParent())} onBackToRoot={handleBackToParent} />
          )}

          <DriveDataView
            items={sortedDisplayItems}
            viewMode={viewMode}
            isSelectMode={isSelectMode}
            selectedItems={selectedItems}
            visibleColumns={visibleColumns}
            sortConfig={sortConfig}
            onSelectItem={handleSelectItem}
            onSelectModeChange={setIsSelectMode}
            onFolderClick={handleFolderClick}
            onColumnsChange={(changes: any) => {
              if (changes.sortBy) {
                handleSort(changes.sortBy)
              } else {
                setVisibleColumns((prev) => ({ ...prev, ...changes }))
              }
            }}
            onItemAction={(action: string, item: DriveItem) => {
              // First close all dialogs to prevent interference
              closeDialog('preview')
              closeDialog('details')
              setSelectedFileForPreview(null)
              setSelectedFileForDetails(null)

              switch (action) {
                case 'preview':
                  // Small delay to ensure cleanup is complete
                  setTimeout(() => {
                    setSelectedFileForPreview(item as DriveFile)
                    openDialog('preview')
                  }, 50)
                  break
                case 'details':
                  // Small delay to ensure cleanup is complete
                  setTimeout(() => {
                    setSelectedFileForDetails(item)
                    openDialog('details')
                  }, 50)
                  break
                case 'download':
                case 'share':
                case 'rename':
                case 'move':
                case 'copy':
                case 'trash':
                case 'delete':
                case 'untrash':
                  // Individual actions now handled through bulk operations
                  setSelectedItems(new Set([item.id]))
                  break
              }
            }}
            timezone={timezone}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={!!nextPageToken}
            onLoadMore={() => fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined, nextPageToken || undefined)}
          />
        </div>
      </div>

      {/* All Dialogs */}
      <FileUploadDialog
        isOpen={dialogs.upload}
        onClose={() => closeDialog('upload')}
        currentFolderId={currentFolderId}
        onUploadComplete={() => {
          closeDialog('upload')
          handleRefresh()
        }}
      />

      <CreateFolderDialog
        isOpen={dialogs.createFolder}
        onClose={() => closeDialog('createFolder')}
        currentFolderId={currentFolderId}
        onFolderCreated={() => {
          closeDialog('createFolder')
          handleRefresh()
        }}
      />

      {/* Individual dialog operations removed - using bulk operations instead */}

      {selectedFileForPreview && dialogs.preview && !dialogs.details && (
        <FilePreviewDialog
          open={dialogs.preview}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog('preview')
              setSelectedFileForPreview(null)
            }
          }}
          file={selectedFileForPreview}
        />
      )}

      {selectedFileForDetails && dialogs.details && (
        <FileDetailsDialog
          isOpen={dialogs.details}
          onClose={() => {
            closeDialog('details')
            setSelectedFileForDetails(null)
          }}
          fileId={selectedFileForDetails.id}
          fileName={selectedFileForDetails.name}
          fileType={selectedFileForDetails.isFolder ? 'folder' : 'file'}
        />
      )}

      {/* Progress indicators */}
      {operationsProgress.isRunning && (
        <div className="bg-background fixed right-4 bottom-4 rounded-lg border p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            {operationsProgress.type === 'single' && <RefreshCw className="h-4 w-4 animate-spin" />}
            <div className="text-sm font-medium">{operationsProgress.operation}</div>
          </div>
          {operationsProgress.type === 'bulk' && operationsProgress.total > 0 && (
            <>
              <Progress value={(operationsProgress.current / operationsProgress.total) * 100} className="mt-2 w-64" />
              <div className="text-muted-foreground mt-1 text-xs">
                {operationsProgress.current} of {operationsProgress.total}
              </div>
            </>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
