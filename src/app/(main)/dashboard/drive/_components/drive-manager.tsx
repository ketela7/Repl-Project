'use client'

import { useState, useEffect, useCallback, useMemo, useRef  } from 'react'
import { ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'

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
import { ItemsMoveDialog } from './items-move-dialog'
import { ItemsCopyDialog } from './items-copy-dialog'
import { ItemsShareDialog } from './items-share-dialog'
import { ItemsRenameDialog } from './items-rename-dialog'
import { ItemsTrashDialog } from './items-trash-dialog'
import { ItemsDeleteDialog } from './items-delete-dialog'
import { ItemsUntrashDialog } from './items-untrash-dialog'
import ItemsDownloadDialog from './items-download-dialog'
import ItemsExportDialog from './items-export-dialog'

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
  canExport?: boolean
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

  // Debug effect to track items changes
  useEffect(() => {
    // // // // // console.log('[DriveManager] Items state changed:', items.length, 'items')
    // // // // // console.log('[DriveManager] Current folder ID:', currentFolderId)
    if (items.length > 0) {
      // // // // // console.log('[DriveManager] First 3 items:', items.slice(0, 3).map(item => ({ name: item.name, id: item.id })))
    }
  }, [items, currentFolderId])
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
    move: false,
    copy: false,
    share: false,
    rename: false,
    trash: false,
    delete: false,
    untrash: false,
    download: false,
    export: false,
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
    setDialogs(prev => ({ ...prev, [dialogName]: true }))
  }

  const closeDialog = (dialogName: keyof typeof dialogs) => {
    setDialogs(prev => ({ ...prev, [dialogName]: false }))
  }

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters)
    setSearchQuery('')
    setTimeout(() => fetchFiles(currentFolderId || undefined, undefined), 0)
  }, [currentFolderId])

  const handleFilter = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
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
  const handleSort = (
    key: 'name' | 'id' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType' | 'owners',
  ) => {
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
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
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

      if (aValue === null || aValue === undefined || aValue === '' || aValue === '-')
        aValue = key === 'size' ? 0 : ''
      if (bValue === null || bValue === undefined || bValue === '' || bValue === '-')
        bValue = key === 'size' ? 0 : ''

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortConfig])
  // Sorting End

  // Selected items with details for operations - using getFileActions for consistency
  const selectedItemsWithDetails = useMemo(() => {
    return Array.from(selectedItems).map(itemId => {
      const item = items.find(i => i.id === itemId)
      const itemIsFolder = item?.mimeType === 'application/vnd.google-apps.folder'

      // Use getFileActions for consistent capability checking
      const actions = getFileActions(
        {
          capabilities: item?.capabilities,
          trashed: item?.trashed,
          mimeType: item?.mimeType,
          itemType: itemIsFolder ? 'folder' : 'file',
        },
        filters.activeView,
      )

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
        // Use actions from getFileActions for consistency
        canCopy: actions.canCopy,
        canDelete: actions.canDelete,
        canDownload: actions.canDownload,
        canTrash: actions.canTrash,
        canUntrash: actions.canUntrash,
        canRename: actions.canRename,
        canShare: actions.canShare,
        canMove: actions.canMove,
        canExport: actions.canExport,
      }
    })
  }, [selectedItems, items, filters.activeView])

  // API call function - Remove dependency on currentFolderId to prevent stale closures
  const fetchFiles = useCallback(
    async (folderId?: string, searchQuery?: string, pageToken?: string) => {
      let callId = ''
      try {
        // Handle null/undefined folderId properly
        const actualFolderId = folderId || null
        const activeView = filters.activeView
        const filterKey = JSON.stringify({
          view: activeView,
          types: filters.fileTypeFilter,
          sort: filters.advancedFilters.sortBy,
          order: filters.advancedFilters.sortOrder,
          size: filters.advancedFilters.sizeRange,
          created: filters.advancedFilters.createdDateRange,
          modified: filters.advancedFilters.modifiedDateRange,
          owner: filters.advancedFilters.owner,
        })

        callId = `${actualFolderId}-${searchQuery}-${pageToken}-${filterKey}`

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

        // Only add folderId if it's not null/undefined
        if (actualFolderId) params.append('folderId', actualFolderId)
        if (searchQuery) params.append('search', searchQuery)
        if (pageToken) params.append('pageToken', pageToken)
        if (filters.activeView && filters.activeView !== 'all')
          params.append('viewStatus', filters.activeView)
        if (filters.fileTypeFilter?.length > 0)
          params.append('fileType', filters.fileTypeFilter.join(','))
        if (filters.advancedFilters.createdDateRange?.from)
          params.append('createdAfter', filters.advancedFilters.createdDateRange.from.toISOString())
        if (filters.advancedFilters.createdDateRange?.to)
          params.append('createdBefore', filters.advancedFilters.createdDateRange.to.toISOString())
        if (filters.advancedFilters.modifiedDateRange?.from)
          params.append(
            'modifiedAfter',
            filters.advancedFilters.modifiedDateRange.from.toISOString(),
          )
        if (filters.advancedFilters.modifiedDateRange?.to)
          params.append(
            'modifiedBefore',
            filters.advancedFilters.modifiedDateRange.to.toISOString(),
          )
        if (filters.advancedFilters.owner?.trim())
          params.append('owner', filters.advancedFilters.owner.trim())

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

        // // // // // console.log('[DriveManager] Fetching files with params:', params.toString())
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
          itemType:
            item.mimeType === 'application/vnd.google-apps.folder'
              ? ('folder' as const)
              : ('file' as const),
        }))

        // // // // // console.log('[DriveManager] Received items:', newItems.length, 'items for folder:', folderId)
        // // // // // console.log('[DriveManager] Items preview:', newItems.slice(0, 3).map(item => ({ name: item.name, id: item.id })))
        setItems(prev => {
          const result = pageToken ? [...prev, ...newItems] : newItems
          // // // // // console.log('[DriveManager] Setting items to:', result.length, 'items')
          return result
        })

        setNextPageToken(data.nextPageToken || null)
        setHasAccess(true)
        setDriveAccessError(null)
      } catch (error: any) {
        if (
          error.message?.includes('Authentication') ||
          error.message?.includes('401') ||
          error.status === 401
        ) {
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
    [filters],
  )

  // Search submit handler
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)
    },
    [fetchFiles, currentFolderId, searchQuery],
  )

  // Effects for initial load and dependencies
  useEffect(() => {
    fetchFiles()
  }, [])

  // Navigation handlers
  const handleFolderClick = useCallback(
    (folderId: string) => {
      // // // // // console.log('[DriveManager] Navigating to folder:', folderId)

      // Force immediate state update
      setLoading(true)
      setCurrentFolderId(folderId)
      setSelectedItems(new Set())
      setItems([]) // Clear immediately
      setFilteredItems([]) // Clear filtered items too
      setNextPageToken(null)

      // Force a new fetch with the folder ID
      fetchFiles(folderId)
    },
    [fetchFiles],
  )

  const handleBackToParent = useCallback(() => {
    // // // // // console.log('[DriveManager] Navigating back to root')

    // Force immediate state update
    setLoading(true)
    setCurrentFolderId(null)
    setSelectedItems(new Set())
    setItems([]) // Clear immediately
    setFilteredItems([]) // Clear filtered items too
    setNextPageToken(null)

    // Force fetch root folder
    fetchFiles()
  }, [fetchFiles])

  const handleShortcutFile = useCallback(
    async (item: DriveItem) => {
      try {
        // Try to get shortcut details and open the target
        const response = await fetch(`/api/drive/files/details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileIds: [item.id],
            fields: 'shortcutDetails',
          }),
        })

        const data = await response.json()
        const targetId = data.results?.[0]?.shortcutDetails?.targetId
        const targetMimeType = data.results?.[0]?.shortcutDetails?.targetMimeType

        if (targetId && targetMimeType === 'application/vnd.google-apps.folder') {
          // Open folder
          handleFolderClick(targetId)
          return
        }

        throw new Error('Cannot open shortcut target')
      } catch {
        // Fallback: show preview
        setTimeout(() => {
          setSelectedFileForPreview(item as DriveFile)
          openDialog('preview')
        }, 50)
      }
    },
    [handleFolderClick, setSelectedFileForPreview, openDialog],
  )

  // Selection handlers
  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
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
    const hasMinSize = filters.advancedFilters.sizeRange?.min
    const hasMaxSize = filters.advancedFilters.sizeRange?.max

    // // // // // console.log('[DriveManager] Size filtering - items:', items.length, 'hasMinSize:', hasMinSize, 'hasMaxSize:', hasMaxSize)

    if (!hasMinSize && !hasMaxSize) {
      // // // // // console.log('[DriveManager] No size filters, returning all items:', items.length)
      return items
    }

    const filtered = items.filter(item => {
      if (item.mimeType === 'application/vnd.google-apps.folder') return true

      const sizeStr = (item as any).size
      let sizeBytes = 0
      if (
        sizeStr &&
        sizeStr !== '-' &&
        sizeStr !== 'undefined' &&
        sizeStr !== 'null' &&
        sizeStr.trim() !== ''
      ) {
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

    // // // // // console.log('[DriveManager] Size filtered items:', filtered.length)
    return filtered
  }, [items, filters.advancedFilters.sizeRange])

  const displayItems = useMemo(() => {
    // // // // // console.log('[DriveManager] Display items calculation - filteredItems:', filteredItems.length, 'sizeFilteredItems:', sizeFilteredItems.length)
    const result = filteredItems.length > 0 ? filteredItems : sizeFilteredItems
    // // // // // console.log('[DriveManager] Display items calculated:', result.length, 'items')
    return result
  }, [filteredItems, sizeFilteredItems])

  const sortedDisplayItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      if (!sortConfig) return 0

      const aValue = a[sortConfig.key as keyof typeof a]
      const bValue = b[sortConfig.key as keyof typeof b]

      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1

      const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    return sorted.map(item => {
      const isFolder = item.mimeType === 'application/vnd.google-apps.folder'
      const actions = getFileActions(
        {
          capabilities: item.capabilities,
          trashed: item.trashed,
          mimeType: item.mimeType,
          itemType: isFolder ? 'folder' : 'file',
        },
        filters.activeView,
      )

      return {
        ...item,
        isFolder,
        // Use all actions from getFileActions for consistency
        canDownload: actions.canDownload,
        canRename: actions.canRename,
        canMove: actions.canMove,
        canCopy: actions.canCopy,
        canDelete: actions.canDelete,
        canTrash: actions.canTrash,
        canUntrash: actions.canUntrash,
        canShare: actions.canShare,
        canExport: actions.canExport,
      }
    })
  }, [items, sortConfig, filters.activeView])

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === sortedDisplayItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(sortedDisplayItems.map(item => item.id)))
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
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <DriveToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={e => {
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
            onApplyFilters={() =>
              fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)
            }
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

          {/* Always show breadcrumb - for both root and sub-folders */}
          <FileBreadcrumb
            currentFolderId={currentFolderId}
            onNavigate={folderId => {
              // // // // // console.log('[DriveManager] Breadcrumb navigation called with folderId:', folderId)
              if (folderId) {
                // // // // // console.log('[DriveManager] Navigating to folder:', folderId)
                handleFolderClick(folderId)
              } else {
                // [icon home] Drive
                // // // // // console.log('[DriveManager] Navigating to root (My Drive)')
                setCurrentFolderId(null)
                fetchFiles(undefined, searchQuery.trim() || undefined)
              }
            }}
            onBackToRoot={() => {
              // // // // // console.log('[DriveManager] Back to root called')
              setCurrentFolderId(null)
              fetchFiles(undefined, searchQuery.trim() || undefined)
            }}
          />

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
                setVisibleColumns(prev => ({ ...prev, ...changes }))
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
                  // Handle shortcuts intelligently - try to open if possible, otherwise preview
                  if (item.mimeType === 'application/vnd.google-apps.shortcut') {
                    handleShortcutFile(item)
                  } else {
                    // Small delay to ensure cleanup is complete
                    setTimeout(() => {
                      setSelectedFileForPreview(item as DriveFile)
                      openDialog('preview')
                    }, 100)
                  }
                  break
                case 'details':
                  // Small delay to ensure cleanup is complete
                  setTimeout(() => {
                    setSelectedFileForDetails(item)
                    openDialog('details')
                  }, 100)
                  break
                case 'download':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('download'), 100)
                  break
                case 'share':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('share'), 100)
                  break
                case 'rename':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('rename'), 100)
                  break
                case 'move':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('move'), 100)
                  break
                case 'copy':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('copy'), 100)
                  break
                case 'trash':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('trash'), 100)
                  break
                case 'delete':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('delete'), 100)
                  break
                case 'untrash':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('untrash'), 100)
                  break
                case 'export':
                  setSelectedItems(new Set([item.id]))
                  setTimeout(() => openDialog('export'), 100)
                  break
              }
            }}
            timezone={timezone}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={!!nextPageToken}
            onLoadMore={() =>
              fetchFiles(
                currentFolderId || undefined,
                searchQuery.trim() || undefined,
                nextPageToken || undefined,
              )
            }
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

      {/* Individual Operation Dialogs */}
      {dialogs.move && selectedItems.size > 0 && (
        <ItemsMoveDialog
          isOpen={dialogs.move}
          onClose={() => {
            closeDialog('move')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('move')
            setSelectedItems(new Set())
            handleRefresh()
          }}
        />
      )}

      {dialogs.copy && selectedItems.size > 0 && (
        <ItemsCopyDialog
          isOpen={dialogs.copy}
          onClose={() => {
            closeDialog('copy')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('copy')
            setSelectedItems(new Set())
            handleRefresh()
          }}
        />
      )}

      {dialogs.share && selectedItems.size > 0 && (
        <ItemsShareDialog
          isOpen={dialogs.share}
          onClose={() => {
            closeDialog('share')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('share')
            setSelectedItems(new Set())
            handleRefresh()
          }}
        />
      )}

      {dialogs.rename && selectedItems.size > 0 && (
        <ItemsRenameDialog
          isOpen={dialogs.rename}
          onClose={() => {
            closeDialog('rename')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('rename')
            setSelectedItems(new Set())
            handleRefresh()
          }}
        />
      )}

      {dialogs.trash && selectedItems.size > 0 && (
        <ItemsTrashDialog
          isOpen={dialogs.trash}
          onClose={() => {
            closeDialog('trash')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('trash')
            setSelectedItems(new Set())
            handleRefresh()
          }}
        />
      )}

      {dialogs.delete && selectedItems.size > 0 && (
        <ItemsDeleteDialog
          isOpen={dialogs.delete}
          onClose={() => {
            closeDialog('delete')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('delete')
            setSelectedItems(new Set())
            handleRefresh()
          }}
        />
      )}

      {dialogs.untrash && selectedItems.size > 0 && (
        <ItemsUntrashDialog
          isOpen={dialogs.untrash}
          onClose={() => {
            closeDialog('untrash')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('untrash')
            setSelectedItems(new Set())
            handleRefresh()
          }}
        />
      )}

      {dialogs.download && selectedItems.size > 0 && (
        <ItemsDownloadDialog
          isOpen={dialogs.download}
          onClose={() => {
            closeDialog('download')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('download')
            setSelectedItems(new Set())
          }}
        />
      )}

      {dialogs.export && selectedItems.size > 0 && (
        <ItemsExportDialog
          isOpen={dialogs.export}
          onClose={() => {
            closeDialog('export')
            setSelectedItems(new Set())
          }}
          selectedItems={Array.from(selectedItems)}
          allItems={displayItems}
          onComplete={() => {
            closeDialog('export')
            setSelectedItems(new Set())
            handleRefresh()
          }}
        />
      )}

      {selectedFileForPreview && dialogs.preview && !dialogs.details && (
        <FilePreviewDialog
          open={dialogs.preview}
          onOpenChange={open => {
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
              <Progress
                value={(operationsProgress.current / operationsProgress.total) * 100}
                className="mt-2 w-64"
              />
              <div className="text-muted-foreground mt-1 text-xs">
                {operationsProgress.current} of {operationsProgress.total}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
