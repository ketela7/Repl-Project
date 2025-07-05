'use client'

import { useState, useEffect, useCallback, useMemo, useRef, useReducer } from 'react'
import { RefreshCw } from 'lucide-react'

import { DriveFile, DriveFolder } from '@/lib/google-drive/types'
import { getFileActions } from '@/lib/google-drive/utils'
import { errorToast } from '@/lib/utils'
import { toast } from 'sonner'

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
import { ItemsDownloadDialog } from './items-download-dialog'
import { ItemsExportDialog } from './items-export-dialog'

import { getSizeMultiplier } from '@/lib/google-drive/utils'

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

const initialFilters = {
  activeView: 'all' as 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash',
  fileTypeFilter: [] as string[],
  advancedFilters: {
    sizeRange: {
      unit: 'MB' as 'B' | 'KB' | 'MB' | 'GB',
    },
    sortBy: 'modified' as 'name' | 'modified' | 'created' | 'size',
    sortOrder: 'desc' as 'asc' | 'desc',
    createdDateRange: {},
    modifiedDateRange: {},
    pageSize: 50,
  } as any,
}

// Dialog state management dengan reducer untuk avoid race conditions
type DialogState = {
  upload: boolean
  createFolder: boolean
  details: boolean
  preview: boolean
  mobileFilters: boolean
  move: boolean
  copy: boolean
  share: boolean
  rename: boolean
  trash: boolean
  delete: boolean
  untrash: boolean
  download: boolean
  export: boolean
}

type DialogAction =
  | { type: 'OPEN_DIALOG'; dialog: keyof DialogState }
  | { type: 'CLOSE_DIALOG'; dialog: keyof DialogState }
  | { type: 'CLOSE_ALL_DIALOGS' }
  | { type: 'RESET_DIALOGS' }

const initialDialogState: DialogState = {
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
}

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'OPEN_DIALOG':
      return { ...state, [action.dialog]: true }
    case 'CLOSE_DIALOG':
      return { ...state, [action.dialog]: false }
    case 'CLOSE_ALL_DIALOGS':
      return initialDialogState
    case 'RESET_DIALOGS':
      return initialDialogState
    default:
      return state
  }
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const { timezone } = useTimezoneContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const filtersRef = useRef(initialFilters)
  const searchQueryRef = useRef('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Table state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    size: false,
    owners: false,
    mimeType: false,
    createdTime: false,
    modifiedTime: false,
  })

  // Dialog state dengan reducer untuk prevent race conditions
  const [dialogs, dispatchDialog] = useReducer(dialogReducer, initialDialogState)

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'id' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType' | 'owners'
    direction: 'asc' | 'desc'
  } | null>(null)

  // Selection state dengan ref untuk sync consistency
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const selectedItemsRef = useRef<Set<string>>(new Set())
  const isSelectModeRef = useRef(false)

  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | null>(null)
  const [selectedFileForDetails, setSelectedFileForDetails] = useState<DriveItem | null>(null)

  // Progress states
  const [operationsProgress] = useState<{
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
  const openDialog = (dialogName: keyof DialogState) => {
    dispatchDialog({ type: 'OPEN_DIALOG', dialog: dialogName })
  }

  const closeDialog = (dialogName: keyof DialogState) => {
    dispatchDialog({ type: 'CLOSE_DIALOG', dialog: dialogName })
  }

  const closeAllDialogs = () => {
    dispatchDialog({ type: 'CLOSE_ALL_DIALOGS' })
  }

  // Helper functions untuk sync selection state
  const updateSelectedItems = useCallback((newItems: Set<string>) => {
    setSelectedItems(newItems)
    selectedItemsRef.current = newItems
  }, [])

  const updateSelectMode = useCallback((mode: boolean) => {
    setIsSelectMode(mode)
    isSelectModeRef.current = mode
  }, [])

  // Handle search change - auto-search with debouncing
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    searchQueryRef.current = query
  }, [])

  // API call function - moved here to avoid hoisting issues
  const fetchFiles = useCallback(
    async (folderId?: string, searchQuery?: string, pageToken?: string) => {
      let callId = ''
      try {
        // Handle null/undefined folderId properly
        const actualFolderId = folderId || null
        console.log('🔍 fetchFiles called:', { folderId: actualFolderId, searchQuery, pageToken })
        // Gunakan filtersRef untuk mendapat filter state yang terbaru
        const currentFilters = filtersRef.current
        const filterKey = JSON.stringify({
          view: currentFilters.activeView,
          types: currentFilters.fileTypeFilter,
          sort: currentFilters.advancedFilters.sortBy,
          order: currentFilters.advancedFilters.sortOrder,
          size: currentFilters.advancedFilters.sizeRange,
          created: currentFilters.advancedFilters.createdDateRange,
          modified: currentFilters.advancedFilters.modifiedDateRange,
          owner: currentFilters.advancedFilters.owner,
        })

        callId = `${actualFolderId}-${searchQuery}-${pageToken}-${filterKey}`

        if (activeRequestsRef.current.has(callId)) return
        if (filterKey !== lastFiltersRef.current && pageToken) return
        lastFiltersRef.current = filterKey

        setLoading(!pageToken)
        setLoadingMore(!!pageToken)

        activeRequestsRef.current.add(callId)

        const params = new URLSearchParams({
          sortBy: currentFilters.advancedFilters.sortBy,
          sortOrder: currentFilters.advancedFilters.sortOrder,
        })

        // Only add folderId if it's not null/undefined
        if (actualFolderId) params.append('folderId', actualFolderId)
        if (searchQuery) params.append('search', searchQuery)
        if (pageToken) params.append('pageToken', pageToken)
        if (currentFilters.activeView && currentFilters.activeView !== 'all')
          params.append('viewStatus', currentFilters.activeView)
        if (currentFilters.fileTypeFilter?.length > 0)
          params.append('fileType', currentFilters.fileTypeFilter.join(','))
        if (currentFilters.advancedFilters.createdDateRange?.from)
          params.append(
            'createdAfter',
            (currentFilters.advancedFilters.createdDateRange.from as Date).toISOString(),
          )
        if (currentFilters.advancedFilters.createdDateRange?.to)
          params.append(
            'createdBefore',
            (currentFilters.advancedFilters.createdDateRange.to as Date).toISOString(),
          )
        if (currentFilters.advancedFilters.modifiedDateRange?.from)
          params.append(
            'modifiedAfter',
            (currentFilters.advancedFilters.modifiedDateRange.from as Date).toISOString(),
          )
        if (currentFilters.advancedFilters.modifiedDateRange?.to)
          params.append(
            'modifiedBefore',
            (currentFilters.advancedFilters.modifiedDateRange.to as Date).toISOString(),
          )
        if (
          currentFilters.advancedFilters.owner &&
          (currentFilters.advancedFilters.owner as string).trim()
        )
          params.append('owner', (currentFilters.advancedFilters.owner as string).trim())

        // Add size filtering parameters (Google Drive API specification - values in bytes)
        if (
          currentFilters.advancedFilters.sizeRange?.min &&
          currentFilters.advancedFilters.sizeRange.min > 0
        ) {
          const multiplier = getSizeMultiplier(currentFilters.advancedFilters.sizeRange.unit)
          const minBytes = Math.floor(currentFilters.advancedFilters.sizeRange.min * multiplier)
          params.append('sizeMin', String(minBytes))
        }
        if (
          currentFilters.advancedFilters.sizeRange?.max &&
          currentFilters.advancedFilters.sizeRange.max > 0
        ) {
          const multiplier = getSizeMultiplier(currentFilters.advancedFilters.sizeRange.unit)
          const maxBytes = Math.floor(currentFilters.advancedFilters.sizeRange.max * multiplier)
          params.append('sizeMax', String(maxBytes))
        }

        const response = await fetch(`/api/drive/files?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setError(null)
          setDriveAccessError(null)
          setNeedsReauth(false)

          if (pageToken) {
            setItems(prev => [...prev, ...data.items])
          } else {
            setItems(data.items)
          }

          setNextPageToken(data.nextPageToken || null)
          setRefreshing(false)
        } else {
          if (response.status === 401) {
            setDriveAccessError(data.error)
            setNeedsReauth(true)
          } else {
            setError(data.error)
          }
          setRefreshing(false)
        }
      } catch (error) {
        console.error('Error fetching files:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
        setRefreshing(false)
      } finally {
        activeRequestsRef.current.delete(callId)
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [], // Empty dependency array to prevent re-creation
  )

  // Debounced search effect - auto-search like destination selector
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQuery = searchQueryRef.current.trim()
      fetchFiles(currentFolderId || undefined, trimmedQuery || undefined)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, currentFolderId, fetchFiles])

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters)
    setSearchQuery('')
    searchQueryRef.current = ''
    // Also reset the filtersRef to ensure consistent state
    filtersRef.current = initialFilters
    // Clear the lastFiltersRef to force a fresh fetch
    lastFiltersRef.current = ''
    setTimeout(() => fetchFiles(currentFolderId || undefined, undefined), 300)
  }, [currentFolderId])

  const handleFilter = useCallback((newFilters: Partial<typeof filters>) => {
    // Update state untuk UI
    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        ...newFilters,
        advancedFilters: {
          ...prev.advancedFilters,
          ...newFilters.advancedFilters,
        },
      }

      // Update ref juga untuk immediate access
      filtersRef.current = updatedFilters
      return updatedFilters
    })
  }, [])

  // Check if any filters are active
  const hasActiveFilters: boolean =
    filters.activeView !== 'all' ||
    filters.fileTypeFilter.length > 0 ||
    (searchQuery as string).trim() !== '' ||
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

  // Selected items with details for operations - using getFileActions for consistency
  const selectedItemsWithDetails = useMemo(() => {
    return Array.from(selectedItems).map(itemId => {
      const item = items.find(i => i.id === itemId)
      const itemIsFolder = item?.mimeType === 'application/vnd.google-apps.folder'

      // Use getFileActions for consistent capability checking
      const actions = getFileActions({
        ...(item?.capabilities && { capabilities: item.capabilities }),
        ...(typeof item?.trashed === 'boolean' && { trashed: item.trashed }),
        ...(item?.mimeType && { mimeType: item.mimeType }),
        itemType: itemIsFolder ? 'folder' : 'file',
      })

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

  // Get selected items with all required data for dialogs
  const getSelectedItemsForDialog = () => {
    return Array.from(selectedItems)
      .map(id => displayItems.find(item => item.id === id))
      .filter((item): item is DriveItem => Boolean(item))
      .map(item => ({
        id: item.id,
        name: item.name || 'Unnamed',
        isFolder: Boolean(item.isFolder || item.mimeType === 'application/vnd.google-apps.folder'),
        mimeType: item.mimeType,
        // Include all capabilities needed by dialogs
        canMove: item.canMove || false,
        canCopy: item.canCopy || false,
        canTrash: item.canTrash || false,
        canDelete: item.canDelete || false,
        canUntrash: item.canUntrash || false,
        canRename: item.canRename || false,
        canShare: item.canShare || false,
        canDownload: item.canDownload || false,
        canExport: item.canExport || false,
      }))
  }

  // Initial load handled by debounced search useEffect above

  // Manual filter application function - only called when Apply Filter is clicked
  const applyFilters = useCallback(() => {
    // Gunakan filtersRef untuk mendapat filter state yang paling terbaru
    const currentFilters = filtersRef.current

    const filterKey = JSON.stringify({
      view: currentFilters.activeView,
      types: currentFilters.fileTypeFilter,
      sort: currentFilters.advancedFilters.sortBy,
      order: currentFilters.advancedFilters.sortOrder,
      size: currentFilters.advancedFilters.sizeRange,
      created: currentFilters.advancedFilters.createdDateRange,
      modified: currentFilters.advancedFilters.modifiedDateRange,
      owner: currentFilters.advancedFilters.owner,
    })

    // Update last applied filters and fetch data
    lastFiltersRef.current = filterKey
    fetchFiles(currentFolderId || undefined, (searchQuery as string).trim() || undefined)
  }, [currentFolderId, searchQuery, fetchFiles])

  // Navigation handlers
  const handleFolderClick = useCallback(
    (folderId: string) => {
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
  const handleSelectItem = useCallback(
    (itemId: string) => {
      const current = selectedItemsRef.current
      const newSet = new Set(current)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      updateSelectedItems(newSet)
    },
    [updateSelectedItems],
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    updateSelectedItems(new Set())
    fetchFiles(currentFolderId || undefined, (searchQuery as string).trim() || undefined)
  }, [fetchFiles, currentFolderId, searchQuery])

  const handleClientSideFilter = useCallback((filteredItems: any[]) => {
    setFilteredItems(filteredItems)
  }, [])

  const clearClientSideFilter = useCallback(() => {
    setFilteredItems([])
  }, [])

  const displayItems = useMemo(() => {
    // Use filteredItems if available (from client-side search), otherwise use items from backend (already filtered)
    return filteredItems.length > 0 ? filteredItems : items
  }, [filteredItems, items])

  const sortedDisplayItems = useMemo(() => {
    const sorted = [...displayItems].sort((a, b) => {
      if (!sortConfig) return 0

      let aValue: any
      let bValue: any

      // Handle special cases for complex fields
      if (sortConfig.key === 'owners') {
        // For owners, sort by the first owner's email address
        aValue = a.owners?.[0]?.emailAddress || ''
        bValue = b.owners?.[0]?.emailAddress || ''
      } else {
        // For other fields, use direct property access
        aValue = a[sortConfig.key as keyof typeof a]
        bValue = b[sortConfig.key as keyof typeof b]
      }

      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1

      const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    return sorted.map(item => {
      const isFolder = item.mimeType === 'application/vnd.google-apps.folder'
      const actions = getFileActions({
        capabilities: item.capabilities,
        trashed: Boolean(item.trashed),
        mimeType: item.mimeType,
        itemType: isFolder ? 'folder' : 'file',
      })

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
  }, [displayItems, sortConfig, filters.activeView])

  const handleSelectAll = useCallback(() => {
    const currentSelected = selectedItemsRef.current
    if (currentSelected.size === sortedDisplayItems.length) {
      updateSelectedItems(new Set())
    } else {
      updateSelectedItems(new Set(sortedDisplayItems.map(item => item.id)))
    }
  }, [sortedDisplayItems, updateSelectedItems])

  // Bulk operation completion handler removed as unused

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
            onSearchChange={handleSearchChange}
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
            onApplyFilters={applyFilters}
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
              if (folderId) {
                handleFolderClick(folderId)
              } else {
                // [icon home] Drive

                setCurrentFolderId(null)
                fetchFiles(undefined, (searchQuery as string).trim() || undefined)
              }
            }}
            onBackToRoot={() => {
              setCurrentFolderId(null)
              fetchFiles(undefined, (searchQuery as string).trim() || undefined)
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
                (searchQuery as string).trim() || undefined,
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
          selectedItems={getSelectedItemsForDialog()}
          onConfirm={() => {
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
          selectedItems={getSelectedItemsForDialog()}
          onConfirm={() => {
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
          onConfirm={() => {
            closeDialog('share')
            setSelectedItems(new Set())
            handleRefresh()
          }}
          selectedItems={getSelectedItemsForDialog()}
        />
      )}

      {dialogs.rename && selectedItems.size > 0 && (
        <ItemsRenameDialog
          isOpen={dialogs.rename}
          onClose={() => {
            closeDialog('rename')
            setSelectedItems(new Set())
          }}
          selectedItems={getSelectedItemsForDialog()}
          onConfirm={() => {
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
          selectedItems={getSelectedItemsForDialog()}
        />
      )}

      {dialogs.delete && selectedItems.size > 0 && (
        <ItemsDeleteDialog
          isOpen={dialogs.delete}
          onClose={() => {
            closeDialog('delete')
            setSelectedItems(new Set())
          }}
          selectedItems={getSelectedItemsForDialog()}
          onConfirm={() => {
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
          selectedItems={getSelectedItemsForDialog()}
        />
      )}

      {dialogs.download && selectedItems.size > 0 && (
        <ItemsDownloadDialog
          isOpen={dialogs.download}
          onClose={() => {
            closeDialog('download')
            setSelectedItems(new Set())
          }}
          selectedItems={getSelectedItemsForDialog()}
          onConfirm={() => {
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
          selectedItems={getSelectedItemsForDialog()}
          onConfirm={() => {
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

export default DriveManager
