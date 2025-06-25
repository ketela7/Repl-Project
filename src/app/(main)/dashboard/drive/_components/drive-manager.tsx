'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw } from 'lucide-react'
import { DriveFile, DriveFolder } from '@/lib/google-drive/types'
import { normalizeFileSize } from '@/lib/google-drive/utils'
import { successToast, errorToast, infoToast } from '@/shared/utils'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { useTimezoneContext } from '@/components/timezone-provider'
import { PerformanceMonitor } from './performance-monitor'
import { FileBreadcrumb } from './file-breadcrumb'
import { DriveConnectionCard } from './drive-connection-card'
import { DriveGridSkeleton } from './drive-skeleton'
import { Progress } from '@/components/ui/progress'
import { FileUploadDialog } from './file-upload-dialog'
import { CreateFolderDialog } from './create-folder-dialog'
import { FileRenameDialog } from './file-rename-dialog'
import { FileMoveDialog } from './file-move-dialog'
import { FileCopyDialog } from './file-copy-dialog'
import { PermanentDeleteDialog } from './permanent-delete-dialog'
import { FileDetailsDialog } from './file-details-dialog'
import { FilePreviewDialog } from './file-preview-dialog'
import { BulkDeleteDialog } from './bulk-delete-dialog'
import { BulkMoveDialog } from './bulk-move-dialog'
import { BulkCopyDialog } from './bulk-copy-dialog'
import { FileShareDialog } from './file-share-dialog'
import { BulkShareDialog } from './bulk-share-dialog'
import { FiltersDialog } from './filters-dialog'
import { DriveToolbar } from './drive-toolbar'
import { DriveDataView } from './drive-data-view'
import { DriveErrorDisplay } from '@/components/drive-error-display'
import { DrivePermissionRequired } from '@/components/drive-permission-required'


type DriveItem = (DriveFile | DriveFolder) & { itemType?: 'file' | 'folder' }

const isFolder = (item: DriveItem): boolean => {
  return item.mimeType === 'application/vnd.google-apps.folder'
}

const initialFilters = {
  activeView: 'all' as 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash',
  fileTypeFilter: [] as string[],
  advancedFilters: {
    sizeRange: { unit: 'MB' as 'B' | 'KB' | 'MB' | 'GB', min: undefined, max: undefined },
    sortBy: 'modified' as 'name' | 'modified' | 'created' | 'size',
    sortOrder: 'desc' as 'asc' | 'desc',
    createdDateRange: { from: undefined, to: undefined },
    modifiedDateRange: { from: undefined, to: undefined },
    owner: undefined,
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
    name: true, size: false, owners: false, mimeType: false,
    createdTime: false, modifiedTime: false,
  })

  // Dialog state - consolidated
  const [dialogs, setDialogs] = useState({
    upload: false, createFolder: false, rename: false, move: false, copy: false,
    permanentDelete: false, details: false, preview: false, delete: false, share: false,
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

  // Selected items for actions
  const [selectedFileForAction, setSelectedFileForAction] = useState<{
    id: string; name: string; parentId?: string
  } | null>(null)
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | null>(null)
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<{
    id: string; name: string; type: 'file' | 'folder'
  } | null>(null)
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<{
    id: string; name: string; type: 'file' | 'folder'
  } | null>(null)
  const [selectedItemForShare, setSelectedItemForShare] = useState<{
    id: string; name: string; type: 'file' | 'folder'
  } | null>(null)

  // Progress states
  const [bulkOperationProgress, setBulkOperationProgress] = useState<{
    isRunning: boolean; current: number; total: number; operation: string
  }>({ isRunning: false, current: 0, total: 0, operation: '' })

  const [singleOperationProgress, setSingleOperationProgress] = useState<{
    isRunning: boolean; operation: string
  }>({ isRunning: false, operation: '' })

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
      advancedFilters: { ...prev.advancedFilters, ...newFilters.advancedFilters },
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
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const sortedItems = useMemo(() => {
    if (!sortConfig) {
      return [...items].sort((a, b) => {
        const aIsFolder = isFolder(a)
        const bIsFolder = isFolder(b)
        if (aIsFolder && !bIsFolder) return -1
        if (!aIsFolder && bIsFolder) return 1
        return 0
      })
    }

    return [...items].sort((a, b) => {
      const { key, direction } = sortConfig
      let aValue: any, bValue: any

      switch (key) {
        case 'name':
          aValue = (a.name || '').toLowerCase()
          bValue = (b.name || '').toLowerCase()
          break
        case 'size':
          aValue = isFolder(a) ? 0 : normalizeFileSize((a as any).size)
          bValue = isFolder(b) ? 0 : normalizeFileSize((b as any).size)
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
          aValue = isFolder(a) ? 'folder' : (a.mimeType || '').toLowerCase()
          bValue = isFolder(b) ? 'folder' : (b.mimeType || '').toLowerCase()
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

  
  // Convert selected items for bulk operations
  const selectedItemsWithDetails = useMemo(() => {
    return Array.from(selectedItems).map((itemId) => {
      const item = items.find((i) => i.id === itemId)
      return {
        id: itemId,
        name: item?.name || 'Unknown',
        type: item && isFolder(item) ? ('folder' as const) : ('file' as const),
        mimeType: item?.mimeType || '',
        modifiedTime: item?.modifiedTime || '',
        size: (item as any)?.size,
        createdTime: item?.createdTime,
        ownedByMe: item?.ownedByMe,
        shared: item?.shared,
        trashed: item?.trashed,
      }
    })
  }, [selectedItems, items])

  // API call function
  const fetchFiles = useCallback(async (folderId?: string, searchQuery?: string, pageToken?: string) => {
    let callId = ''
    try {
      if (!folderId && folderId !== '') folderId = currentFolderId || undefined

      const filterKey = JSON.stringify({
        view: filters.activeView, types: filters.fileTypeFilter,
        sort: filters.advancedFilters.sortBy, order: filters.advancedFilters.sortOrder,
        size: filters.advancedFilters.sizeRange, created: filters.advancedFilters.createdDateRange,
        modified: filters.advancedFilters.modifiedDateRange, owner: filters.advancedFilters.owner,
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
        sortOrder: filters.advancedFilters.sortOrder
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
        itemType: item.mimeType === 'application/vnd.google-apps.folder' ? 'folder' as const : 'file' as const
      }))

      setItems(prev => pageToken ? [...prev, ...newItems] : newItems)

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
  }, [currentFolderId, filters])

  // Search submit handler
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)
  }, [fetchFiles, currentFolderId, searchQuery])

  // Effects for initial load and dependencies
  useEffect(() => {
    fetchFiles()
  }, [])

  
  {/*useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFiles(currentFolderId || undefined, undefined)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [filters, currentFolderId])*/}

  // Navigation handlers
  const handleFolderClick = useCallback((folderId: string) => {
    setCurrentFolderId(folderId)
    setSelectedItems(new Set())
    fetchFiles(folderId)
  }, [fetchFiles])

  const handleBackToParent = useCallback(() => {
    setCurrentFolderId(null)
    setSelectedItems(new Set())
    fetchFiles()
  }, [fetchFiles])

  // Selection handlers
  const handleSelectItem = useCallback((itemId: string) => {
    console.log('handleSelectItem called with:', itemId)
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
        console.log('Deselected item:', itemId)
      } else {
        newSet.add(itemId)
        console.log('Selected item:', itemId)
      }
      console.log('New selection set size:', newSet.size, 'items:', Array.from(newSet))
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
      if (isFolder(item)) return true

      const sizeStr = (item as any).size
      let sizeBytes = 0
      if (sizeStr && sizeStr !== '-' && sizeStr !== 'undefined' && 
          sizeStr !== 'null' && sizeStr.trim() !== '') {
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
          case 'B': return size
          case 'KB': return size * 1024
          case 'MB': return size * 1024 * 1024
          case 'GB': return size * 1024 * 1024 * 1024
          default: return size * 1024 * 1024
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
    const itemsToSort = [...displayItems]

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
            aValue = isFolder(a) ? 'folder' : (a.mimeType || '').toLowerCase()
            bValue = isFolder(b) ? 'folder' : (b.mimeType || '').toLowerCase()
            break
          case 'owners':
            aValue = ((a as any).owners?.[0]?.displayName || 
                     (a as any).owners?.[0]?.emailAddress || '').toLowerCase()
            bValue = ((b as any).owners?.[0]?.displayName || 
                     (b as any).owners?.[0]?.emailAddress || '').toLowerCase()
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
            onSearchSubmit={handleSearchSubmit}
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
            onBulkDelete={() => {}}
            onBulkMove={() => {}}
            onBulkCopy={() => {}}
            onBulkShare={() => {}}
            onFiltersOpen={() => openDialog('mobileFilters')}
            
            
            selectedItems={selectedItemsWithDetails}
            onDeselectAll={() => {
              setSelectedItems(new Set())
            }}
            onRefreshAfterBulkOp={handleRefresh}
            
            filters={filters}
            onFilterChange={handleFilter as any}
            onApplyFilters={() => fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)}
            onClearFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            items={items.map(item => ({
              ...item,
              type: isFolder(item) ? 'folder' as const : 'file' as const
            }))}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            setIsUploadDialogOpen={() => openDialog('upload')}
            setIsCreateFolderDialogOpen={() => openDialog('createFolder')}
            loading={loading}
            onClientSideFilter={handleClientSideFilter}
            onClearClientSideFilter={clearClientSideFilter}
            isApplying={false}
          />

          {currentFolderId && (
            <FileBreadcrumb
              currentFolderId={currentFolderId}
              onNavigate={(folderId) => folderId ? handleFolderClick(folderId) : handleBackToParent()}
              onBackToRoot={handleBackToParent}
            />
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
              switch (action) {
                case 'preview':
                  setSelectedFileForPreview(item as DriveFile)
                  openDialog('preview')
                  break
                case 'download':
                  window.open(`https://drive.google.com/uc?export=download&id=${item.id}`, '_blank')
                  break
                case 'share':
                  setSelectedItemForShare({
                    id: item.id, name: item.name,
                    type: isFolder(item) ? 'folder' : 'file',
                  })
                  openDialog('share')
                  break
                case 'rename':
                  setSelectedFileForAction({
                    id: item.id, name: item.name, parentId: item.parents?.[0],
                  })
                  openDialog('rename')
                  break
                case 'move':
                  setSelectedFileForAction({
                    id: item.id, name: item.name, parentId: item.parents?.[0],
                  })
                  openDialog('move')
                  break
                case 'copy':
                  setSelectedFileForAction({
                    id: item.id, name: item.name, parentId: item.parents?.[0],
                  })
                  openDialog('copy')
                  break
                case 'delete':
                  setSelectedItemForDelete({
                    id: item.id, name: item.name,
                    type: isFolder(item) ? 'folder' : 'file',
                  })
                  openDialog('delete')
                  break
                case 'details':
                  setSelectedItemForDetails({
                    id: item.id, name: item.name,
                    type: isFolder(item) ? 'folder' : 'file',
                  })
                  openDialog('details')
                  break
              }
            }}
            timezone={timezone}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={!!nextPageToken}
            onLoadMore={() => fetchFiles(
              currentFolderId || undefined,
              searchQuery.trim() || undefined,
              nextPageToken || undefined
            )}
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

      {selectedFileForAction && (
        <>
          <FileRenameDialog
            open={dialogs.rename}
            onOpenChange={(open) => {
              if (!open) {
                closeDialog('rename')
                setSelectedFileForAction(null)
              }
            }}
            fileId={selectedFileForAction.id}
            fileName={selectedFileForAction.name}
            onConfirm={async (newName: string) => {
              closeDialog('rename')
              setSelectedFileForAction(null)
              handleRefresh()
            }}
          />

          <FileMoveDialog
            isOpen={dialogs.move}
            onClose={() => {
              closeDialog('move')
              setSelectedFileForAction(null)
            }}
            fileName={selectedFileForAction.name}
            currentParentId={selectedFileForAction.parentId || null}
            onMove={async (newParentId: string) => {
              closeDialog('move')
              setSelectedFileForAction(null)
              handleRefresh()
            }}
          />

          <FileCopyDialog
            isOpen={dialogs.copy}
            onClose={() => {
              closeDialog('copy')
              setSelectedFileForAction(null)
            }}
            fileName={selectedFileForAction.name}
            currentParentId={selectedFileForAction.parentId || null}
            onCopy={async (newName: string, parentId: string) => {
              closeDialog('copy')
              setSelectedFileForAction(null)
              handleRefresh()
            }}
          />
        </>
      )}

      {selectedFileForPreview && (
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

      {selectedItemForDelete && (
        <PermanentDeleteDialog
          open={dialogs.delete}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog('delete')
              setSelectedItemForDelete(null)
            }
          }}
          itemId={selectedItemForDelete.id}
          itemName={selectedItemForDelete.name}
          itemType={selectedItemForDelete.type}
          onDeleted={() => {
            closeDialog('delete')
            setSelectedItemForDelete(null)
            handleRefresh()
          }}
        />
      )}

      {selectedItemForDetails && (
        <FileDetailsDialog
          isOpen={dialogs.details}
          onClose={() => {
            closeDialog('details')
            setSelectedItemForDetails(null)
          }}
          fileId={selectedItemForDetails.id}
          fileName={selectedItemForDetails.name}
          fileType={selectedItemForDetails.type}
        />
      )}

      {selectedItemForShare && (
        <FileShareDialog
          open={dialogs.share}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog('share')
              setSelectedItemForShare(null)
            }
          }}
          file={{
            id: selectedItemForShare.id,
            name: selectedItemForShare.name,
            mimeType: selectedItemForShare.type === 'folder'
              ? 'application/vnd.google-apps.folder'
              : 'application/octet-stream',
          }}
        />
      )}


      

      {/* Mobile Filters Dialog */}
      <FiltersDialog
        open={dialogs.mobileFilters}
        onOpenChange={(open) => {
          if (!open) closeDialog('mobileFilters')
        }}
        onFilterChange={handleFilter}
        onApplyFilters={() => fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined)}
        currentFilters={filters}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearAllFilters}
        isApplying={loading}
      />

      {/* Progress indicators */}
      {bulkOperationProgress.isRunning && (
        <div className="bg-background fixed right-4 bottom-4 rounded-lg border p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">{bulkOperationProgress.operation}</div>
          </div>
          <Progress
            value={(bulkOperationProgress.current / bulkOperationProgress.total) * 100}
            className="mt-2 w-64"
          />
          <div className="text-muted-foreground mt-1 text-xs">
            {bulkOperationProgress.current} of {bulkOperationProgress.total}
          </div>
        </div>
      )}

      {singleOperationProgress.isRunning && (
        <div className="bg-background fixed right-4 bottom-4 rounded-lg border p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <div className="text-sm font-medium">{singleOperationProgress.operation}</div>
          </div>
        </div>
      )}

      {/* <PerformanceMonitor /> */}
    </div>
  )
}