'use client'

import React, { useMemo, useCallback, useState } from 'react'
import {
  Search,
  List,
  Grid3X3,
  Square,
  SquareCheck,
  X,
  CheckSquare,
  FileText,
  RefreshCw,
  Calendar,
  Settings,
  ChevronDown,
  HardDrive,
  Folder,
  FileImage,
  Play,
  FileSpreadsheet,
  Presentation,
  Archive,
  FileCode,
  Link,
  Upload,
  FolderPlus,
  ChevronUp,
  MoreVertical,
  Music,
  Palette,
  Database,
  BookOpen,
  FileType,
  EllipsisVertical,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FileIcon } from '@/components/file-icon'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { successToast } from '@/lib/utils'
import { 
  getCommonFileTypeCategories, 
  matchesFileType, 
  countFilesByCategory, 
  formatCategoryCount,
  FILE_TYPE_CATEGORIES 
} from '@/lib/mime-type-filter'

// Removed Suspense import - direct render untuk bulk operations
import { OperationsDialog } from './operations-dialog'
import { FiltersDialog } from './filters-dialog'

// Types
interface DriveItem {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  createdTime?: string
  ownedByMe?: boolean
  shared?: boolean
  trashed?: boolean
  itemType?: 'file' | 'folder'
}

interface AdvancedFilters {
  sizeRange?: {
    min?: number
    max?: number
    unit: 'B' | 'KB' | 'MB' | 'GB'
  }
  createdDateRange?: {
    from?: Date
    to?: Date
  }
  modifiedDateRange?: {
    from?: Date
    to?: Date
  }
  owner?: string
  sortBy?: 'name' | 'modified' | 'created' | 'size'
  sortOrder?: 'asc' | 'desc'
  pageSize?: number
}

interface VisibleColumns {
  name: boolean
  size: boolean
  mimeType: boolean
  owners: boolean
  createdTime: boolean
  modifiedTime: boolean
}

interface DriveToolbarProps {
  searchQuery: string
  onSearchChange: (_query: string) => void
  onSearchSubmit: (_e: React.FormEvent) => void
  viewMode: 'grid' | 'table'
  onViewModeChange: (_mode: 'grid' | 'table') => void
  isSelectMode: boolean
  onSelectModeChange: (_mode: boolean) => void
  selectedCount: number

  onSelectAll: () => void
  onRefresh: () => void
  refreshing: boolean
  onUpload: () => void
  onCreateFolder: () => void

  // Mobile Actions Dialog Props
  selectedItems: DriveItem[]
  onDeselectAll: () => void
  onRefreshAfterOp: () => void
  filters: {
    activeView: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash'
    fileTypeFilter: string[]
    advancedFilters: AdvancedFilters
  }
  onFilterChange: (
    _updates: Partial<{
      activeView: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash'
      fileTypeFilter: string[]
      advancedFilters: AdvancedFilters
    }>,
  ) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  items: DriveItem[]
  setIsUploadDialogOpen: (_open: boolean) => void
  setIsCreateFolderDialogOpen: (_open: boolean) => void

  // Table columns
  visibleColumns: VisibleColumns
  setVisibleColumns: (
    _columns: VisibleColumns | ((_prev: VisibleColumns) => VisibleColumns),
  ) => void

  // Loading states
  loading: boolean
  isApplying?: boolean

  // Client-side filtering
  onClientSideFilter?: (_filteredItems: DriveItem[]) => void
  onClearClientSideFilter?: () => void
}

// Enhanced client-side filtering function using comprehensive mimeType matching
// Client-side filtering using shared utility for consistency with backend
const filterByMimeType = (items: DriveItem[], category: string) => {
  // Use dynamic mapping dari FILE_TYPE_CATEGORIES untuk semua 27 kategori
  const categoryRecord = Object.values(FILE_TYPE_CATEGORIES).find(cat => cat.label === category)
  
  if (!categoryRecord) return items

  return items.filter((item: DriveItem) => 
    matchesFileType(item.mimeType || '', [categoryRecord.id])
  )
}

export function DriveToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  viewMode,
  onViewModeChange,
  isSelectMode,
  onSelectModeChange,
  selectedCount,
  onSelectAll,
  onRefresh,
  refreshing,
  onUpload,
  onCreateFolder,
  selectedItems,
  onDeselectAll,

  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  items,
  visibleColumns,
  setVisibleColumns,
  onClientSideFilter,
  onClearClientSideFilter,
}: DriveToolbarProps) {
  const isMobile = useIsMobile()

  // Optimized column handlers to prevent heavy re-renders
  const handleColumnToggle = useCallback(
    (column: keyof VisibleColumns) => {
      setVisibleColumns(prev => ({
        ...prev,
        [column]: !prev[column],
      }))
    },
    [setVisibleColumns],
  )

  // Actions Dialog State
  const [isOperationsOpen, setIsOperationsOpen] = useState(false)
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false)

  // Extract necessary props from filters
  const { activeView, fileTypeFilter, advancedFilters } = filters

  // Track active filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Memoize category counts using shared utility for consistency
  const categoryCounts = useMemo(() => {
    return countFilesByCategory(items.map(item => ({ mimeType: item.mimeType })))
  }, [items])

  // Handle badge click for client-side filtering
  const handleCategoryClick = useCallback(
    (category: string) => {
      if (onClientSideFilter) {
        const filteredItems = filterByMimeType(items, category)
        onClientSideFilter(filteredItems)
        setActiveFilter(category)
        successToast(`Filtered to ${filteredItems.length} ${category.toLowerCase()}`)
      }
    },
    [items, onClientSideFilter],
  )

  // Handle clear filter
  const handleClearFilter = useCallback(() => {
    if (onClearClientSideFilter) {
      onClearClientSideFilter()
      setActiveFilter(null)
      successToast('Filter cleared')
    }
  }, [onClearClientSideFilter])

  return (
    <div
      className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur transition-transform duration-200 ease-in-out"
      id="drive-toolbar"
    >
      <div
        className="scrollbar-hide flex items-center justify-between overflow-x-auto scroll-smooth p-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Main Menu - 5 Items - Horizontal Scrollable */}
        <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
          {/* Search */}
          <Button
            variant={searchQuery ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              const searchExpanded = document.querySelector('#search-expanded') as HTMLElement
              if (searchExpanded) {
                searchExpanded.style.display =
                  searchExpanded.style.display === 'none' ? 'block' : 'none'
                if (searchExpanded.style.display === 'block') {
                  setTimeout(() => {
                    const input = searchExpanded.querySelector('input') as HTMLInputElement
                    if (input) input.focus()
                  }, 100)
                }
              }
            }}
            className="h-8 px-2"
          >
            <Search className="h-4 w-4" />
            {searchQuery && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                •
              </Badge>
            )}
          </Button>

          {/* View Toggle - More prominent */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange(viewMode === 'grid' ? 'table' : 'grid')}
            className="h-8 px-2"
            title={`Switch to ${viewMode === 'grid' ? 'table' : 'grid'} view`}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>

          {/* Operations */}
          {selectedCount <= items.length && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isSelectMode ? 'default' : 'ghost'}
                  size="sm"
                  disabled={items.length === 0}
                  className="h-8 px-2"
                >
                  <Square className="h-4 w-4" />
                  {selectedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      {selectedCount}
                    </Badge>
                  )}
                  {(filters.activeView === 'trash' || searchQuery.includes('trashed:true')) && (
                    <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                      T
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem
                  onClick={() => {
                    ;(isSelectMode && onDeselectAll(), onSelectModeChange(!isSelectMode))
                  }}
                >
                  {isSelectMode ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Exit Selection
                    </>
                  ) : (
                    <>
                      <SquareCheck className="mr-2 h-4 w-4" />
                      Select Mode
                    </>
                  )}
                </DropdownMenuItem>

                {isSelectMode && (
                  <>
                    <DropdownMenuSeparator />
                    {selectedCount < items.length && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          onSelectAll()
                        }}
                      >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Select All ({selectedCount}/{items.length})
                      </DropdownMenuItem>
                    )}

                    {selectedCount > 0 && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDeselectAll()
                        }}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Clear Selection
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {selectedCount > 0 && (
                  <>
                    {isMobile ? (
                      <DropdownMenuItem
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsOperationsOpen(true)
                        }}
                      >
                        <MoreVertical className="mr-2 h-4 w-4" />
                        More Actions
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsOperationsOpen(true)
                          }}
                        >
                          <MoreVertical className="mr-2 h-4 w-4" />
                          Operations
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Filter - Mobile uses Bottom Sheet, Desktop uses Dropdown */}
          {isMobile ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsFiltersDialogOpen(true)
              }}
              className={`h-8 px-2 md:px-3 ${
                filters.activeView !== 'all' ||
                filters.fileTypeFilter.length > 0 ||
                filters.advancedFilters.sizeRange?.min ||
                filters.advancedFilters.sizeRange?.max ||
                filters.advancedFilters.createdDateRange?.from ||
                filters.advancedFilters.modifiedDateRange?.from ||
                filters.advancedFilters.owner
                  ? 'bg-primary/10 text-primary'
                  : ''
              }`}
            >
              <Calendar className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Filter</span>
              {(activeView !== 'all' ||
                fileTypeFilter.length > 0 ||
                advancedFilters.sizeRange?.min ||
                advancedFilters.sizeRange?.max ||
                advancedFilters.createdDateRange?.from ||
                advancedFilters.modifiedDateRange?.from ||
                advancedFilters.owner) && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs md:ml-2">
                  <span className="hidden md:inline">Active</span>
                  <span className="md:hidden">•</span>
                </Badge>
              )}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${
                    filters.activeView !== 'all' ||
                    filters.fileTypeFilter.length > 0 ||
                    filters.advancedFilters.sizeRange?.min ||
                    filters.advancedFilters.sizeRange?.max ||
                    filters.advancedFilters.createdDateRange?.from ||
                    filters.advancedFilters.modifiedDateRange?.from ||
                    filters.advancedFilters.owner
                      ? 'bg-primary/10 text-primary'
                      : ''
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {(activeView !== 'all' ||
                    fileTypeFilter.length > 0 ||
                    advancedFilters.sizeRange?.min ||
                    advancedFilters.sizeRange?.max ||
                    advancedFilters.createdDateRange?.from ||
                    advancedFilters.modifiedDateRange?.from ||
                    advancedFilters.owner) && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      •
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <div className="p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Settings className="text-primary h-4 w-4" />
                    <h4 className="text-foreground text-sm font-semibold">Filters</h4>
                    {(activeView !== 'all' ||
                      fileTypeFilter.length > 0 ||
                      advancedFilters.sizeRange?.min ||
                      advancedFilters.sizeRange?.max ||
                      advancedFilters.createdDateRange?.from ||
                      advancedFilters.modifiedDateRange?.from ||
                      advancedFilters.owner) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>

                  {/* Basic Filter */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="hover:bg-accent flex w-full items-center justify-between rounded-md p-2">
                      <span className="text-sm font-semibold">View Status</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 ml-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={filters.activeView === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ activeView: 'all' })
                          }}
                          className="justify-start text-xs"
                        >
                          All Files
                        </Button>
                        <Button
                          variant={filters.activeView === 'my-drive' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ activeView: 'my-drive' })
                          }}
                          className="justify-start text-xs"
                        >
                          My Drive
                        </Button>
                        <Button
                          variant={filters.activeView === 'recent' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ activeView: 'recent' })
                          }}
                          className="justify-start text-xs"
                        >
                          Recent
                        </Button>
                        <Button
                          variant={filters.activeView === 'trash' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ activeView: 'trash' })
                          }}
                          className="justify-start text-xs"
                        >
                          Trash
                        </Button>
                        <Button
                          variant={filters.activeView === 'starred' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ activeView: 'starred' })
                          }}
                          className="justify-start text-xs"
                        >
                          Starred
                        </Button>
                        <Button
                          variant={filters.activeView === 'shared' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onFilterChange({ activeView: 'shared' })}
                          className="justify-start text-xs"
                        >
                          Shared
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator className="my-3" />

                  {/* File Types */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="hover:bg-accent flex w-full items-center justify-between rounded-md p-2">
                      <span className="text-sm font-semibold">File Types</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 ml-2 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={
                            filters.fileTypeFilter.includes('folder') ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            const newTypes = filters.fileTypeFilter.includes('folder')
                              ? filters.fileTypeFilter.filter(t => t !== 'folder')
                              : [...filters.fileTypeFilter, 'folder']
                            onFilterChange({ fileTypeFilter: newTypes })
                          }}
                          className="justify-center p-2 text-xs"
                          title="Folders"
                        >
                          <Folder className="h-4 w-4" />
                        </Button>
                        {getCommonFileTypeCategories().slice(1).map(category => {
                          const filter = {
                            type: category.id,
                            mimeType: category.mimeTypes[0] || 'application/octet-stream',
                            title: category.label,
                          }
                          return (
                            <Button
                              key={filter.type}
                              variant={
                                filters.fileTypeFilter.includes(filter.type) ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => {
                                const newTypes = filters.fileTypeFilter.includes(filter.type)
                                  ? filters.fileTypeFilter.filter(t => t !== filter.type)
                                  : [...filters.fileTypeFilter, filter.type]

                                onFilterChange({ fileTypeFilter: newTypes })
                              }}
                              className="justify-center p-2 text-xs"
                              title={filter.title}
                            >
                              <FileIcon mimeType={filter.mimeType} className="h-4 w-4" />
                            </Button>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator className="my-3" />

                  {/* Sort Options */}
                  <Collapsible>
                    <CollapsibleTrigger className="hover:bg-accent flex w-full items-center justify-between rounded-md p-2">
                      <span className="text-sm font-semibold">Sort Options</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 ml-2 space-y-2">
                      <div className="space-y-2">
                        <label className="text-muted-foreground text-xs font-medium">Sort By</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={
                              filters.advancedFilters.sortBy === 'name' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sortBy: 'name',
                                },
                              })
                            }}
                            className="justify-start text-xs"
                          >
                            Name
                          </Button>
                          <Button
                            variant={
                              filters.advancedFilters.sortBy === 'modified' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sortBy: 'modified',
                                },
                              })
                            }}
                            className="justify-start text-xs"
                          >
                            Modified
                          </Button>
                          <Button
                            variant={
                              filters.advancedFilters.sortBy === 'created' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sortBy: 'created',
                                },
                              })
                            }}
                            className="justify-start text-xs"
                          >
                            Created
                          </Button>
                          <Button
                            variant={
                              filters.advancedFilters.sortBy === 'size' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sortBy: 'size',
                                },
                              })
                            }}
                            className="justify-start text-xs"
                          >
                            Size
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-muted-foreground text-xs font-medium">
                          Sort Order
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={
                              filters.advancedFilters.sortOrder === 'asc' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sortOrder: 'asc',
                                },
                              })
                            }}
                            className="justify-start text-xs"
                          >
                            Ascending
                          </Button>
                          <Button
                            variant={
                              filters.advancedFilters.sortOrder === 'desc' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sortOrder: 'desc',
                                },
                              })
                            }}
                            className="justify-start text-xs"
                          >
                            Descending
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator className="my-3" />

                  {/* Advanced Filters */}
                  <Collapsible>
                    <CollapsibleTrigger className="hover:bg-accent flex w-full items-center justify-between rounded-md p-2">
                      <span className="text-sm font-semibold">Advanced Filters</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 ml-2 space-y-4">
                      {/* Size Range */}
                      <div className="space-y-2">
                        <label className="text-muted-foreground text-xs font-medium">
                          File Size Range
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={filters.advancedFilters.sizeRange?.min || ''}
                            onChange={e =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sizeRange: {
                                    ...filters.advancedFilters.sizeRange,
                                    ...(parseInt(e.target.value) && {
                                      min: parseInt(e.target.value),
                                    }),
                                    unit: filters.advancedFilters.sizeRange?.unit || 'MB',
                                  },
                                },
                              })
                            }
                            className="h-8 text-xs"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={filters.advancedFilters.sizeRange?.max || ''}
                            onChange={e =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sizeRange: {
                                    ...filters.advancedFilters.sizeRange,
                                    ...(parseInt(e.target.value) && {
                                      max: parseInt(e.target.value),
                                    }),
                                    unit: filters.advancedFilters.sizeRange?.unit || 'MB',
                                  },
                                },
                              })
                            }
                            className="h-8 text-xs"
                          />
                          <select
                            value={filters.advancedFilters.sizeRange?.unit || 'MB'}
                            onChange={e =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sizeRange: {
                                    ...filters.advancedFilters.sizeRange,
                                    unit: e.target.value as 'B' | 'KB' | 'MB' | 'GB',
                                  },
                                },
                              })
                            }
                            className="bg-background h-8 rounded-md border px-2 text-xs"
                          >
                            <option value="B">B</option>
                            <option value="KB">KB</option>
                            <option value="MB">MB</option>
                            <option value="GB">GB</option>
                          </select>
                        </div>
                      </div>

                      {/* Date Ranges */}
                      <div className="space-y-2">
                        <label className="text-muted-foreground text-xs font-medium">
                          Created Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={
                              filters.advancedFilters.createdDateRange?.from
                                ? (filters.advancedFilters.createdDateRange.from as Date)
                                    .toISOString()
                                    .split('T')[0]
                                : ''
                            }
                            onChange={e =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  createdDateRange: {
                                    ...filters.advancedFilters.createdDateRange,
                                    ...(e.target.value ? { from: new Date(e.target.value) } : {}),
                                  },
                                },
                              })
                            }
                            className="h-8 text-xs"
                          />
                          <Input
                            type="date"
                            value={
                              filters.advancedFilters.createdDateRange?.to
                                ? (filters.advancedFilters.createdDateRange.to as Date)
                                    .toISOString()
                                    .split('T')[0]
                                : ''
                            }
                            onChange={e =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  createdDateRange: {
                                    ...filters.advancedFilters.createdDateRange,
                                    ...(e.target.value ? { to: new Date(e.target.value) } : {}),
                                  },
                                },
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-muted-foreground text-xs font-medium">
                          Modified Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={
                              filters.advancedFilters.modifiedDateRange?.from
                                ? (filters.advancedFilters.modifiedDateRange.from as Date)
                                    .toISOString()
                                    .split('T')[0]
                                : ''
                            }
                            onChange={e =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  modifiedDateRange: {
                                    ...filters.advancedFilters.modifiedDateRange,
                                    ...(e.target.value ? { from: new Date(e.target.value) } : {}),
                                  },
                                },
                              })
                            }
                            className="h-8 text-xs"
                          />
                          <Input
                            type="date"
                            value={
                              filters.advancedFilters.modifiedDateRange?.to
                                ? (filters.advancedFilters.modifiedDateRange.to as Date)
                                    .toISOString()
                                    .split('T')[0]
                                : ''
                            }
                            onChange={e =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  modifiedDateRange: {
                                    ...filters.advancedFilters.modifiedDateRange,
                                    ...(e.target.value ? { to: new Date(e.target.value) } : {}),
                                  },
                                },
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* Owner */}
                      <div className="space-y-2">
                        <label className="text-muted-foreground text-xs font-medium">
                          Owner Email
                        </label>
                        <Input
                          type="email"
                          placeholder="Enter owner email"
                          value={filters.advancedFilters.owner || ''}
                          onChange={e =>
                            onFilterChange({
                              advancedFilters: {
                                ...filters.advancedFilters,
                                ...(e.target.value && { owner: e.target.value }),
                              },
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Apply and Clear Filters */}
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={onApplyFilters}
                          className="flex-1 text-xs"
                        >
                          Apply Filters
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onClearFilters}
                          className="flex-1 text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* File Category Badges - Client-side filtering support */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3">
                <HardDrive className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Badge</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-80 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="text-sm font-semibold">File Statistics</div>
                  {activeFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilter}
                      className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear Filter
                    </Button>
                  )}
                </div>

                {/* Total Files */}
                <div className="bg-muted/50 flex items-center justify-between rounded-md p-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Total Items</span>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {items.length}
                  </Badge>
                </div>

                {/* Dynamic Badge Generation untuk Semua 27 Kategori */}
                {Object.values(FILE_TYPE_CATEGORIES).map((category) => {
                  const count = categoryCounts[category.id] || 0
                  if (count === 0) return null

                  const IconComponent = category.icon
                  const colorClass = category.color
                  const bgColorMap: Record<string, string> = {
                    'text-blue-600': 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50',
                    'text-blue-700': 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50',
                    'text-green-600': 'bg-green-50 dark:bg-green-950/30 border-green-500 text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/50',
                    'text-orange-600': 'bg-orange-50 dark:bg-orange-950/30 border-orange-500 text-orange-700 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50',
                    'text-purple-600': 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/50',
                    'text-red-600': 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/50',
                    'text-amber-600': 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50',
                    'text-slate-600': 'bg-slate-50 dark:bg-slate-950/30 border-slate-500 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/50',
                    'text-pink-600': 'bg-pink-50 dark:bg-pink-950/30 border-pink-500 text-pink-700 hover:bg-pink-100 dark:text-pink-300 dark:hover:bg-pink-900/50',
                    'text-indigo-600': 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-900/50',
                    'text-yellow-600': 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/50',
                    'text-gray-600': 'bg-gray-50 dark:bg-gray-950/30 border-gray-500 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900/50',
                    'text-blue-500': 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50',
                    'text-green-500': 'bg-green-50 dark:bg-green-950/30 border-green-500 text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/50',
                    'text-purple-500': 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/50',
                    'text-rose-600': 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/50',
                    'text-teal-600': 'bg-teal-50 dark:bg-teal-950/30 border-teal-500 text-teal-700 hover:bg-teal-100 dark:text-teal-300 dark:hover:bg-teal-900/50',
                    'text-stone-600': 'bg-stone-50 dark:bg-stone-950/30 border-stone-500 text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900/50',
                    'text-cyan-600': 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-500 text-cyan-700 hover:bg-cyan-100 dark:text-cyan-300 dark:hover:bg-cyan-900/50',
                    'text-sky-600': 'bg-sky-50 dark:bg-sky-950/30 border-sky-500 text-sky-700 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-900/50',
                    'text-gray-500': 'bg-gray-50 dark:bg-gray-950/30 border-gray-500 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900/50'
                  }
                  
                  const bgClass = bgColorMap[colorClass] || 'bg-gray-50 dark:bg-gray-950/30 border-gray-500 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900/50'
                  const isActive = activeFilter === category.label
                  const activeBgClass = bgClass.split(' ')[2] // extract border color like 'border-blue-500'
                  const activeColorClass = activeBgClass.replace('border-', 'bg-').replace('-500', '-500')

                  return (
                    <div key={category.id} className={`flex items-center justify-between rounded-md p-2 ${bgClass.split(' ').slice(0, 2).join(' ')}`}>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${colorClass.replace('text-', 'text-').replace('-600', '-500').replace('-700', '-500')}`} />
                        <span className="text-sm">{category.label}</span>
                      </div>
                      <Badge
                        variant={isActive ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all ${
                          isActive
                            ? `${activeColorClass} text-white`
                            : bgClass.split(' ').slice(2).join(' ')
                        }`}
                        onClick={() => handleCategoryClick(category.label)}
                      >
                        {count}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* More (Settings) - Fixed position on the right */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 flex-shrink-0 px-2" onClick={() => {}}>
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* Quick Actions */}
            <DropdownMenuItem onClick={onUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateFolder}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Table Column Settings - Only show in table mode */}
            {viewMode === 'table' && (
              <>
                <DropdownMenuSeparator />
                <Collapsible>
                  <CollapsibleTrigger className="hover:bg-accent flex w-full items-center justify-between rounded-md p-2">
                    <span className="text-sm font-semibold">Table Columns</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 space-y-1">
                    {/* Name Column */}
                    <div className="hover:bg-accent flex w-full cursor-pointer items-center rounded-md p-2">
                      <Checkbox
                        checked={visibleColumns.name}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={() => handleColumnToggle('name')}
                      />
                      <span className="text-xs">Name</span>
                    </div>

                    {/* Size Column */}
                    <div className="hover:bg-accent flex w-full cursor-pointer items-center rounded-md p-2">
                      <Checkbox
                        checked={visibleColumns.size}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={() => handleColumnToggle('size')}
                      />
                      <span className="text-xs">Size</span>
                    </div>

                    {/* MIME Type Column */}
                    <div className="hover:bg-accent flex w-full cursor-pointer items-center rounded-md p-2">
                      <Checkbox
                        checked={visibleColumns.mimeType}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={() => handleColumnToggle('mimeType')}
                      />
                      <span className="text-xs">MIME Type</span>
                    </div>

                    {/* Owner Column */}
                    <div className="hover:bg-accent flex w-full cursor-pointer items-center rounded-md p-2">
                      <Checkbox
                        checked={visibleColumns.owners}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={() => handleColumnToggle('owners')}
                      />
                      <span className="text-xs">Owner</span>
                    </div>

                    {/* Created Column */}
                    <div className="hover:bg-accent flex w-full cursor-pointer items-center rounded-md p-2">
                      <Checkbox
                        checked={visibleColumns.createdTime}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={() => handleColumnToggle('createdTime')}
                      />
                      <span className="text-xs">Created</span>
                    </div>

                    {/* Modified Column */}
                    <div className="hover:bg-accent flex w-full cursor-pointer items-center rounded-md p-2">
                      <Checkbox
                        checked={visibleColumns.modifiedTime}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={() => handleColumnToggle('modifiedTime')}
                      />
                      <span className="text-xs">Modified</span>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            <DropdownMenuSeparator />

            {/* Additional Actions */}
            <DropdownMenuItem onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Drive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Expanded - Hidden by default */}
      <div
        id="search-expanded"
        style={{ display: 'none' }}
        className="bg-muted/30 border-t p-3 md:p-4"
      >
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearchSubmit(e)}
              className="h-10 pr-20 pl-10"
              disabled={false}
            />
            <div className="absolute top-1/2 right-1 flex -translate-y-1/2 transform items-center gap-1">
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-muted h-8 w-8 p-0"
                  onClick={() => {
                    onSearchChange('')
                    onRefresh()
                  }}
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-muted h-8 w-8 p-0"
                onClick={() => {
                  const searchExpanded = document.querySelector('#search-expanded') as HTMLElement
                  if (searchExpanded) {
                    searchExpanded.style.display = 'none'
                  }
                }}
                title="Close search"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={e => onSearchSubmit(e)}
            disabled={!(searchQuery as string).trim()}
            className="h-10 px-4"
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Operations Dialog */}
      <OperationsDialog
        isOpen={isOperationsOpen}
        onClose={() => setIsOperationsOpen(false)}
        selectedItems={selectedItems}
      />

      {/* Filters Dialog */}
      <FiltersDialog
        open={isFiltersDialogOpen}
        onOpenChange={setIsFiltersDialogOpen}
        onFilterChange={onFilterChange}
        onApplyFilters={onApplyFilters}
        currentFilters={filters}
        hasActiveFilters={Boolean(
          filters.activeView !== 'all' ||
            filters.fileTypeFilter.length > 0 ||
            (filters.advancedFilters.sizeRange?.min && filters.advancedFilters.sizeRange.min > 0) ||
            (filters.advancedFilters.sizeRange?.max && filters.advancedFilters.sizeRange.max > 0) ||
            filters.advancedFilters.createdDateRange?.from ||
            filters.advancedFilters.modifiedDateRange?.from ||
            (filters.advancedFilters.owner && (filters.advancedFilters.owner as string).trim()) ||
            (filters.advancedFilters.pageSize && filters.advancedFilters.pageSize !== 50),
        )}
        onClearFilters={onClearFilters}
      />
    </div>
  )
}

export default DriveToolbar
