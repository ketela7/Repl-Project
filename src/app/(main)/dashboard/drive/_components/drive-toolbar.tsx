'use client'

import { Suspense, useMemo, useCallback, useState } from 'react'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Search,
  List,
  Grid3X3,
  Square,
  SquareCheck,
  X,
  CheckSquare,
  Download,
  Edit,
  FileText,
  Move,
  Copy,
  Share2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Calendar,
  Settings,
  ChevronDown,
  HardDrive,
  Folder,
  FileImage,
  Play,
  FileSpreadsheet,
  Presentation,
  FileVideo,
  FileAudio,
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
import { FileIcon } from '@/components/file-icon'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { FileCategoryBadges } from '@/components/file-category-badges'
import { successToast, infoToast } from '@/shared/utils'
import { BulkOperationsMenu } from './bulk-operations-menu'

// Types
interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  createdTime?: string
  ownedByMe?: boolean
  shared?: boolean
  trashed?: boolean
  type: 'file' | 'folder'
}

interface AdvancedFilters {
  sizeRange: {
    min?: number
    max?: number
    unit: 'B' | 'KB' | 'MB' | 'GB'
  }
  createdDateRange: {
    from?: Date
    to?: Date
  }
  modifiedDateRange: {
    from?: Date
    to?: Date
  }
  owner?: string
  sortBy: 'name' | 'modified' | 'created' | 'size'
  sortOrder: 'asc' | 'desc'
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
  onSearchChange: (query: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  viewMode: 'grid' | 'table'
  onViewModeChange: (mode: 'grid' | 'table') => void
  isSelectMode: boolean
  onSelectModeChange: (mode: boolean) => void
  selectedCount: number

  onSelectAll: () => void
  onRefresh: () => void
  refreshing: boolean
  onUpload: () => void
  onCreateFolder: () => void
  onBulkDelete: () => void
  onBulkMove: () => void
  onBulkCopy: () => void
  onBulkShare: () => void
  onFiltersOpen: () => void
  onMobileActionsOpen?: () => void
  filters: {
    activeView: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash'
    fileTypeFilter: string[]
    advancedFilters: AdvancedFilters
  }
  onFilterChange: (
    updates: Partial<{
      activeView: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash'
      fileTypeFilter: string[]
      advancedFilters: AdvancedFilters
    }>
  ) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  items: any[]
  setIsUploadDialogOpen: (open: boolean) => void
  setIsCreateFolderDialogOpen: (open: boolean) => void

  // Table columns
  visibleColumns: VisibleColumns
  setVisibleColumns: (
    columns: VisibleColumns | ((prev: VisibleColumns) => VisibleColumns)
  ) => void

  // Loading states
  loading: boolean
  isApplying?: boolean

  // Client-side filtering
  onClientSideFilter?: (filteredItems: any[]) => void
  onClearClientSideFilter?: () => void
}

// Enhanced client-side filtering function using comprehensive mimeType matching
const filterByMimeType = (items: any[], category: string) => {
  return items.filter((item) => {
    const mime = item.mimeType?.toLowerCase() || ''
    const name = item.name?.toLowerCase() || ''

    switch (category) {
      case 'Images':
        return (
          mime.startsWith('image/') ||
          mime.includes('jpeg') ||
          mime.includes('jpg') ||
          mime.includes('png') ||
          mime.includes('gif') ||
          mime.includes('bmp') ||
          mime.includes('svg') ||
          mime.includes('webp') ||
          mime.includes('tiff') ||
          mime.includes('ico') ||
          mime.includes('heic') ||
          mime.includes('heif') ||
          mime.includes('avif') ||
          name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.png') ||
          name.endsWith('.gif') ||
          name.endsWith('.bmp') ||
          name.endsWith('.svg') ||
          name.endsWith('.webp') ||
          name.endsWith('.tiff') ||
          name.endsWith('.ico')
        )

      case 'Videos':
        return (
          mime.startsWith('video/') ||
          mime.includes('mp4') ||
          mime.includes('avi') ||
          mime.includes('mov') ||
          mime.includes('wmv') ||
          mime.includes('webm') ||
          mime.includes('mkv') ||
          mime.includes('flv') ||
          mime.includes('m4v') ||
          mime.includes('3gp') ||
          mime.includes('quicktime') ||
          mime.includes('x-matroska') ||
          name.endsWith('.mp4') ||
          name.endsWith('.avi') ||
          name.endsWith('.mov') ||
          name.endsWith('.wmv') ||
          name.endsWith('.webm') ||
          name.endsWith('.mkv') ||
          name.endsWith('.flv') ||
          name.endsWith('.m4v') ||
          name.endsWith('.3gp')
        )

      case 'Documents':
        return (
          mime.includes('document') ||
          mime.includes('text') ||
          mime.includes('pdf') ||
          mime.includes('vnd.google-apps.document') ||
          mime.includes('msword') ||
          mime.includes('wordprocessingml') ||
          mime.includes('rtf') ||
          mime.includes('opendocument.text') ||
          mime.includes('plain') ||
          name.endsWith('.pdf') ||
          name.endsWith('.doc') ||
          name.endsWith('.docx') ||
          name.endsWith('.txt') ||
          name.endsWith('.rtf') ||
          name.endsWith('.odt')
        )

      case 'Spreadsheets':
        return (
          mime.includes('spreadsheet') ||
          mime.includes('excel') ||
          mime.includes('csv') ||
          mime.includes('vnd.google-apps.spreadsheet') ||
          mime.includes('ms-excel') ||
          mime.includes('spreadsheetml') ||
          mime.includes('opendocument.spreadsheet') ||
          name.endsWith('.xls') ||
          name.endsWith('.xlsx') ||
          name.endsWith('.csv') ||
          name.endsWith('.ods') ||
          name.endsWith('.tsv')
        )

      case 'Presentations':
        return (
          mime.includes('presentation') ||
          mime.includes('powerpoint') ||
          mime.includes('vnd.google-apps.presentation') ||
          mime.includes('ms-powerpoint') ||
          mime.includes('presentationml') ||
          mime.includes('opendocument.presentation') ||
          name.endsWith('.ppt') ||
          name.endsWith('.pptx') ||
          name.endsWith('.odp') ||
          name.endsWith('.key')
        )

      case 'Audio':
        return (
          mime.startsWith('audio/') ||
          mime.includes('mp3') ||
          mime.includes('wav') ||
          mime.includes('flac') ||
          mime.includes('aac') ||
          mime.includes('ogg') ||
          mime.includes('wma') ||
          mime.includes('m4a') ||
          mime.includes('opus') ||
          mime.includes('aiff') ||
          name.endsWith('.mp3') ||
          name.endsWith('.wav') ||
          name.endsWith('.flac') ||
          name.endsWith('.aac') ||
          name.endsWith('.ogg') ||
          name.endsWith('.wma') ||
          name.endsWith('.m4a') ||
          name.endsWith('.opus') ||
          name.endsWith('.aiff')
        )

      case 'Archives':
        return (
          mime.includes('zip') ||
          mime.includes('rar') ||
          mime.includes('tar') ||
          mime.includes('gz') ||
          mime.includes('7z') ||
          mime.includes('archive') ||
          mime.includes('bz2') ||
          mime.includes('xz') ||
          mime.includes('cab') ||
          mime.includes('deb') ||
          mime.includes('rpm') ||
          mime.includes('dmg') ||
          mime.includes('iso') ||
          mime.includes('apk') ||
          mime.includes('ipa') ||
          name.endsWith('.zip') ||
          name.endsWith('.rar') ||
          name.endsWith('.tar') ||
          name.endsWith('.gz') ||
          name.endsWith('.7z') ||
          name.endsWith('.bz2') ||
          name.endsWith('.xz') ||
          name.endsWith('.cab') ||
          name.endsWith('.deb') ||
          name.endsWith('.rpm') ||
          name.endsWith('.dmg') ||
          name.endsWith('.iso')
        )

      case 'Code':
        return (
          mime.includes('javascript') ||
          mime.includes('typescript') ||
          mime.includes('json') ||
          mime.includes('html') ||
          mime.includes('css') ||
          mime.includes('xml') ||
          mime.includes('python') ||
          mime.includes('java') ||
          mime.includes('php') ||
          mime.includes('ruby') ||
          mime.includes('perl') ||
          mime.includes('shell') ||
          name.endsWith('.js') ||
          name.endsWith('.ts') ||
          name.endsWith('.json') ||
          name.endsWith('.html') ||
          name.endsWith('.css') ||
          name.endsWith('.xml') ||
          name.endsWith('.py') ||
          name.endsWith('.java') ||
          name.endsWith('.php') ||
          name.endsWith('.rb') ||
          name.endsWith('.pl') ||
          name.endsWith('.sh') ||
          name.endsWith('.jsx') ||
          name.endsWith('.tsx') ||
          name.endsWith('.vue') ||
          name.endsWith('.scss') ||
          name.endsWith('.sass') ||
          name.endsWith('.less')
        )

      case 'Design':
        return (
          mime.includes('photoshop') ||
          mime.includes('illustrator') ||
          mime.includes('sketch') ||
          mime.includes('figma') ||
          mime.includes('adobe') ||
          mime.includes('x-xcf') ||
          mime.includes('postscript') ||
          mime.includes('indesign') ||
          name.endsWith('.psd') ||
          name.endsWith('.ai') ||
          name.endsWith('.sketch') ||
          name.endsWith('.fig') ||
          name.endsWith('.xcf') ||
          name.endsWith('.eps') ||
          name.endsWith('.indd') ||
          name.endsWith('.cr2') ||
          name.endsWith('.nef') ||
          name.endsWith('.dng') ||
          name.endsWith('.arw')
        )

      case 'Database':
        return (
          mime.includes('database') ||
          mime.includes('sql') ||
          mime.includes('sqlite') ||
          mime.includes('x-sqlite3') ||
          mime.includes('x-sql') ||
          name.endsWith('.db') ||
          name.endsWith('.sql') ||
          name.endsWith('.sqlite') ||
          name.endsWith('.sqlite3') ||
          name.endsWith('.mdb') ||
          name.endsWith('.accdb')
        )

      case 'Ebooks':
        return (
          mime.includes('epub') ||
          mime.includes('mobi') ||
          mime.includes('kindle') ||
          mime.includes('x-mobipocket') ||
          mime.includes('amazon.ebook') ||
          name.endsWith('.epub') ||
          name.endsWith('.mobi') ||
          name.endsWith('.azw') ||
          name.endsWith('.azw3') ||
          name.endsWith('.fb2') ||
          name.endsWith('.lit')
        )

      case 'Fonts':
        return (
          mime.includes('font') ||
          mime.includes('ttf') ||
          mime.includes('otf') ||
          mime.includes('woff') ||
          mime.includes('eot') ||
          mime.includes('x-font') ||
          name.endsWith('.ttf') ||
          name.endsWith('.otf') ||
          name.endsWith('.woff') ||
          name.endsWith('.woff2') ||
          name.endsWith('.eot') ||
          name.endsWith('.fon')
        )

      case 'Shortcuts':
        return mime === 'application/vnd.google-apps.shortcut'

      case 'Folders':
        return mime === 'application/vnd.google-apps.folder'

      default:
        return true
    }
  })
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
  onBulkDelete,
  onBulkMove,
  onBulkCopy,
  onBulkShare,
  onFiltersOpen,
  onMobileActionsOpen,
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  hasActiveFilters,
  items,
  visibleColumns,
  setVisibleColumns,
  onClientSideFilter,
  onClearClientSideFilter,
}: DriveToolbarProps) {
  const isMobile = useIsMobile()

  // Extract necessary props from filters
  const { activeView, fileTypeFilter, advancedFilters } = filters

  // Track active filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Memoize category counts to avoid repetitive filtering
  const categoryCounts = useMemo(() => {
    return {
      images: items.filter((f) => f.mimeType?.includes('image')).length,
      videos: items.filter((f) => f.mimeType?.includes('video')).length,
      documents: items.filter(
        (f) =>
          f.mimeType?.includes('document') ||
          f.mimeType?.includes('text') ||
          f.mimeType?.includes('pdf')
      ).length,
      spreadsheets: items.filter(
        (f) =>
          f.mimeType?.includes('spreadsheet') ||
          f.mimeType?.includes('excel') ||
          f.mimeType?.includes('csv')
      ).length,
      presentations: items.filter(
        (f) =>
          f.mimeType?.includes('presentation') ||
          f.mimeType?.includes('powerpoint')
      ).length,
      audio: items.filter((f) => f.mimeType?.startsWith('audio/')).length,
      archives: items.filter(
        (f) =>
          f.mimeType?.includes('zip') ||
          f.mimeType?.includes('rar') ||
          f.mimeType?.includes('tar') ||
          f.mimeType?.includes('gz') ||
          f.mimeType?.includes('7z')
      ).length,
      code: items.filter(
        (f) =>
          f.mimeType?.includes('javascript') ||
          f.mimeType?.includes('json') ||
          f.mimeType?.includes('html') ||
          f.mimeType?.includes('css') ||
          f.mimeType?.includes('xml')
      ).length,
      design: items.filter(
        (f) =>
          f.mimeType?.includes('photoshop') ||
          f.mimeType?.includes('illustrator') ||
          f.mimeType?.includes('sketch') ||
          f.mimeType?.includes('figma')
      ).length,
      database: items.filter(
        (f) =>
          f.mimeType?.includes('database') ||
          f.mimeType?.includes('sql') ||
          f.mimeType?.includes('sqlite')
      ).length,
      ebooks: items.filter(
        (f) =>
          f.mimeType?.includes('epub') ||
          f.mimeType?.includes('mobi') ||
          f.mimeType?.includes('kindle')
      ).length,
      fonts: items.filter(
        (f) =>
          f.mimeType?.includes('font') ||
          f.mimeType?.includes('ttf') ||
          f.mimeType?.includes('otf') ||
          f.mimeType?.includes('woff')
      ).length,
      shortcuts: items.filter(
        (f) => f.mimeType === 'application/vnd.google-apps.shortcut'
      ).length,
      folders: items.filter(
        (f) => f.mimeType === 'application/vnd.google-apps.folder'
      ).length,
    }
  }, [items])

  // Handle badge click for client-side filtering
  const handleCategoryClick = useCallback(
    (category: string) => {
      if (onClientSideFilter) {
        const filteredItems = filterByMimeType(items, category)
        onClientSideFilter(filteredItems)
        setActiveFilter(category)
        successToast.generic(
          `Filtered to ${filteredItems.length} ${category.toLowerCase()}`,
          {
            description: `Showing only ${category.toLowerCase()} from ${items.length} total items`,
          }
        )
      }
    },
    [items, onClientSideFilter]
  )

  // Handle clear filter
  const handleClearFilter = useCallback(() => {
    if (onClearClientSideFilter) {
      onClearClientSideFilter()
      setActiveFilter(null)
      infoToast.generic('Filter cleared', {
        description: `Showing all ${items.length} items`,
      })
    }
  }, [onClearClientSideFilter, items.length])

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
              const searchExpanded = document.querySelector(
                '#search-expanded'
              ) as HTMLElement
              if (searchExpanded) {
                searchExpanded.style.display =
                  searchExpanded.style.display === 'none' ? 'block' : 'none'
                if (searchExpanded.style.display === 'block') {
                  setTimeout(() => {
                    const input = searchExpanded.querySelector(
                      'input'
                    ) as HTMLInputElement
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
            onClick={() =>
              onViewModeChange(viewMode === 'grid' ? 'table' : 'grid')
            }
            className="h-8 px-2"
            title={`Switch to ${viewMode === 'grid' ? 'table' : 'grid'} view`}
          >
            {viewMode === 'grid' ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
          </Button>

          {/* Bulk Operations */}
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
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-xs"
                    >
                      {selectedCount}
                    </Badge>
                  )}
                  {(filters.activeView === 'trash' ||
                    searchQuery.includes('trashed:true')) && (
                    <Badge
                      variant="destructive"
                      className="ml-1 h-4 px-1 text-xs"
                    >
                      T
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem
                  onClick={() => onSelectModeChange(!isSelectMode)}
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

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSelectAll}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Select All ({selectedCount}/{items.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSelectAll}>
                  <Square className="mr-2 h-4 w-4" />
                  Clear Selection
                </DropdownMenuItem>

                {selectedCount > 0 && (
                  <>
                    {isMobile ? (
                      <DropdownMenuItem onClick={onMobileActionsOpen}>
                        <MoreVertical className="mr-2 h-4 w-4" />
                        More Actions
                      </DropdownMenuItem>
                    ) : (
                      <BulkOperationsMenu
                        selectedCount={selectedCount}
                        itemsLength={items.length}
                        onBulkDownload={onBulkDelete}
                        onBulkRename={onBulkMove}
                        onBulkExport={onBulkCopy}
                        onBulkMove={onBulkMove}
                        onBulkCopy={onBulkCopy}
                        onBulkShare={onBulkShare}
                        onBulkDelete={onBulkDelete}
                      />
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
                onFiltersOpen()
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
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1 text-xs md:ml-2"
                >
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
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-xs"
                    >
                      •
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <div className="p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Settings className="text-primary h-4 w-4" />
                    <h4 className="text-foreground text-sm font-semibold">
                      Filters
                    </h4>
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
                          variant={
                            filters.activeView === 'all' ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            console.log(
                              'Filter Debug - Toolbar click: All Files'
                            )
                            onFilterChange({ activeView: 'all' })
                          }}
                          className="justify-start text-xs"
                        >
                          All Files
                        </Button>
                        <Button
                          variant={
                            filters.activeView === 'my-drive'
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            console.log(
                              'Filter Debug - Toolbar click: My Drive'
                            )
                            onFilterChange({ activeView: 'my-drive' })
                          }}
                          className="justify-start text-xs"
                        >
                          My Drive
                        </Button>
                        <Button
                          variant={
                            filters.activeView === 'recent'
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            console.log('Filter Debug - Toolbar click: Recent')
                            onFilterChange({ activeView: 'recent' })
                          }}
                          className="justify-start text-xs"
                        >
                          Recent
                        </Button>
                        <Button
                          variant={
                            filters.activeView === 'trash'
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            console.log('Filter Debug - Toolbar click: Trash')
                            onFilterChange({ activeView: 'trash' })
                          }}
                          className="justify-start text-xs"
                        >
                          Trash
                        </Button>
                        <Button
                          variant={
                            filters.activeView === 'starred'
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            console.log('Filter Debug - Toolbar click: Starred')
                            onFilterChange({ activeView: 'starred' })
                          }}
                          className="justify-start text-xs"
                        >
                          Starred
                        </Button>
                        <Button
                          variant={
                            filters.activeView === 'shared'
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            onFilterChange({ activeView: 'shared' })
                          }
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
                            filters.fileTypeFilter.includes('folder')
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            const newTypes = filters.fileTypeFilter.includes(
                              'folder'
                            )
                              ? filters.fileTypeFilter.filter(
                                  (t) => t !== 'folder'
                                )
                              : [...filters.fileTypeFilter, 'folder']
                            onFilterChange({ fileTypeFilter: newTypes })
                          }}
                          className="justify-center p-2 text-xs"
                          title="Folders"
                        >
                          <Folder className="h-4 w-4" />
                        </Button>
                        {[
                          {
                            type: 'document',
                            mimeType: 'application/vnd.google-apps.document',
                            title: 'Documents',
                          },
                          {
                            type: 'spreadsheet',
                            mimeType: 'application/vnd.google-apps.spreadsheet',
                            title: 'Spreadsheets',
                          },
                          {
                            type: 'presentation',
                            mimeType:
                              'application/vnd.google-apps.presentation',
                            title: 'Presentations',
                          },
                          {
                            type: 'image',
                            mimeType: 'image/jpeg',
                            title: 'Images',
                          },
                          {
                            type: 'video',
                            mimeType: 'video/mp4',
                            title: 'Videos',
                          },
                          {
                            type: 'audio',
                            mimeType: 'audio/mp3',
                            title: 'Audio',
                          },
                          {
                            type: 'archive',
                            mimeType: 'application/zip',
                            title: 'Archives',
                          },
                          {
                            type: 'code',
                            mimeType: 'text/javascript',
                            title: 'Code Files',
                          },
                          {
                            type: 'shortcut',
                            mimeType: 'application/vnd.google-apps.shortcut',
                            title: 'Shortcuts',
                          },
                        ].map((filter) => {
                          return (
                            <Button
                              key={filter.type}
                              variant={
                                filters.fileTypeFilter.includes(filter.type)
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => {
                                const newTypes =
                                  filters.fileTypeFilter.includes(filter.type)
                                    ? filters.fileTypeFilter.filter(
                                        (t) => t !== filter.type
                                      )
                                    : [...filters.fileTypeFilter, filter.type]
                                console.log(
                                  'Filter Debug - File type click:',
                                  filter.type,
                                  'New types:',
                                  newTypes
                                )
                                onFilterChange({ fileTypeFilter: newTypes })
                              }}
                              className="justify-center p-2 text-xs"
                              title={filter.title}
                            >
                              <FileIcon
                                mimeType={filter.mimeType}
                                className="h-4 w-4"
                              />
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
                      <span className="text-sm font-semibold">
                        Sort Options
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 ml-2 space-y-2">
                      <div className="space-y-2">
                        <label className="text-muted-foreground text-xs font-medium">
                          Sort By
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={
                              filters.advancedFilters.sortBy === 'name'
                                ? 'default'
                                : 'outline'
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
                              filters.advancedFilters.sortBy === 'modified'
                                ? 'default'
                                : 'outline'
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
                              filters.advancedFilters.sortBy === 'created'
                                ? 'default'
                                : 'outline'
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
                              filters.advancedFilters.sortBy === 'size'
                                ? 'default'
                                : 'outline'
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
                              filters.advancedFilters.sortOrder === 'asc'
                                ? 'default'
                                : 'outline'
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
                              filters.advancedFilters.sortOrder === 'desc'
                                ? 'default'
                                : 'outline'
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
                      <span className="text-sm font-semibold">
                        Advanced Filters
                      </span>
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
                            onChange={(e) =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sizeRange: {
                                    ...filters.advancedFilters.sizeRange,
                                    min: parseInt(e.target.value) || undefined,
                                    unit:
                                      filters.advancedFilters.sizeRange?.unit ||
                                      'MB',
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
                            onChange={(e) =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sizeRange: {
                                    ...filters.advancedFilters.sizeRange,
                                    max: parseInt(e.target.value) || undefined,
                                    unit:
                                      filters.advancedFilters.sizeRange?.unit ||
                                      'MB',
                                  },
                                },
                              })
                            }
                            className="h-8 text-xs"
                          />
                          <select
                            value={
                              filters.advancedFilters.sizeRange?.unit || 'MB'
                            }
                            onChange={(e) =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  sizeRange: {
                                    ...filters.advancedFilters.sizeRange,
                                    unit: e.target.value as
                                      | 'B'
                                      | 'KB'
                                      | 'MB'
                                      | 'GB',
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
                                ?.toISOString()
                                .split('T')[0] || ''
                            }
                            onChange={(e) =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  createdDateRange: {
                                    ...filters.advancedFilters.createdDateRange,
                                    from: e.target.value
                                      ? new Date(e.target.value)
                                      : undefined,
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
                                ?.toISOString()
                                .split('T')[0] || ''
                            }
                            onChange={(e) =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  createdDateRange: {
                                    ...filters.advancedFilters.createdDateRange,
                                    to: e.target.value
                                      ? new Date(e.target.value)
                                      : undefined,
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
                                ?.toISOString()
                                .split('T')[0] || ''
                            }
                            onChange={(e) =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  modifiedDateRange: {
                                    ...filters.advancedFilters
                                      .modifiedDateRange,
                                    from: e.target.value
                                      ? new Date(e.target.value)
                                      : undefined,
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
                                ?.toISOString()
                                .split('T')[0] || ''
                            }
                            onChange={(e) =>
                              onFilterChange({
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  modifiedDateRange: {
                                    ...filters.advancedFilters
                                      .modifiedDateRange,
                                    to: e.target.value
                                      ? new Date(e.target.value)
                                      : undefined,
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
                          onChange={(e) =>
                            onFilterChange({
                              advancedFilters: {
                                ...filters.advancedFilters,
                                owner: e.target.value || undefined,
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

                {/* Images */}
                {categoryCounts.images > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-green-50 p-2 dark:bg-green-950/30">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Images</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Images' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Images'
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-green-500 text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Images')}
                    >
                      {categoryCounts.images}
                    </Badge>
                  </div>
                )}

                {/* Videos */}
                {categoryCounts.videos > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-red-50 p-2 dark:bg-red-950/30">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Videos</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Videos' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Videos'
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-red-500 text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Videos')}
                    >
                      {categoryCounts.videos}
                    </Badge>
                  </div>
                )}

                {/* Documents */}
                {categoryCounts.documents > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-orange-50 p-2 dark:bg-orange-950/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Documents</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Documents' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Documents'
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-orange-500 text-orange-700 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Documents')}
                    >
                      {categoryCounts.documents}
                    </Badge>
                  </div>
                )}

                {/* Spreadsheets */}
                {categoryCounts.spreadsheets > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-emerald-50 p-2 dark:bg-emerald-950/30">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">Spreadsheets</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Spreadsheets' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Spreadsheets'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-emerald-500 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Spreadsheets')}
                    >
                      {categoryCounts.spreadsheets}
                    </Badge>
                  </div>
                )}

                {/* Presentations */}
                {categoryCounts.presentations > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-amber-50 p-2 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2">
                      <Presentation className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Presentations</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Presentations' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Presentations'
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Presentations')}
                    >
                      {categoryCounts.presentations}
                    </Badge>
                  </div>
                )}

                {/* Audio */}
                {categoryCounts.audio > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-indigo-50 p-2 dark:bg-indigo-950/30">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm">Audio</span>
                    </div>
                    <Badge
                      variant={activeFilter === 'Audio' ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Audio'
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-indigo-500 text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Audio')}
                    >
                      {categoryCounts.audio}
                    </Badge>
                  </div>
                )}

                {/* Archives */}
                {categoryCounts.archives > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-gray-50 p-2 dark:bg-gray-950/30">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Archives</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Archives' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Archives'
                          ? 'border-gray-500 bg-gray-500 text-white'
                          : 'border-gray-500 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Archives')}
                    >
                      {categoryCounts.archives}
                    </Badge>
                  </div>
                )}

                {/* Code Files */}
                {categoryCounts.code > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-cyan-50 p-2 dark:bg-cyan-950/30">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm">Code Files</span>
                    </div>
                    <Badge
                      variant={activeFilter === 'Code' ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Code'
                          ? 'border-cyan-500 bg-cyan-500 text-white'
                          : 'border-cyan-500 text-cyan-700 hover:bg-cyan-100 dark:text-cyan-300 dark:hover:bg-cyan-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Code')}
                    >
                      {categoryCounts.code}
                    </Badge>
                  </div>
                )}

                {/* Design Files */}
                {categoryCounts.design > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-purple-50 p-2 dark:bg-purple-950/30">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Design Files</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Design' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Design'
                          ? 'border-purple-500 bg-purple-500 text-white'
                          : 'border-purple-500 text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Design')}
                    >
                      {categoryCounts.design}
                    </Badge>
                  </div>
                )}

                {/* Database Files */}
                {categoryCounts.database > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-teal-50 p-2 dark:bg-teal-950/30">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-teal-500" />
                      <span className="text-sm">Database Files</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Database' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Database'
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : 'border-teal-500 text-teal-700 hover:bg-teal-100 dark:text-teal-300 dark:hover:bg-teal-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Database')}
                    >
                      {categoryCounts.database}
                    </Badge>
                  </div>
                )}

                {/* E-books */}
                {categoryCounts.ebooks > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-rose-50 p-2 dark:bg-rose-950/30">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-rose-500" />
                      <span className="text-sm">E-books</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Ebooks' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Ebooks'
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-rose-500 text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Ebooks')}
                    >
                      {categoryCounts.ebooks}
                    </Badge>
                  </div>
                )}

                {/* Fonts */}
                {categoryCounts.fonts > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-stone-50 p-2 dark:bg-stone-950/30">
                    <div className="flex items-center gap-2">
                      <FileType className="h-4 w-4 text-stone-500" />
                      <span className="text-sm">Fonts</span>
                    </div>
                    <Badge
                      variant={activeFilter === 'Fonts' ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Fonts'
                          ? 'border-stone-500 bg-stone-500 text-white'
                          : 'border-stone-500 text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Fonts')}
                    >
                      {categoryCounts.fonts}
                    </Badge>
                  </div>
                )}

                {/* Shortcuts */}
                {categoryCounts.shortcuts > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-sky-50 p-2 dark:bg-sky-950/30">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-sky-500" />
                      <span className="text-sm">Shortcuts</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Shortcuts' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Shortcuts'
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-sky-500 text-sky-700 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Shortcuts')}
                    >
                      {categoryCounts.shortcuts}
                    </Badge>
                  </div>
                )}

                {/* Folders */}
                {categoryCounts.folders > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-blue-50 p-2 dark:bg-blue-950/30">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Folders</span>
                    </div>
                    <Badge
                      variant={
                        activeFilter === 'Folders' ? 'default' : 'outline'
                      }
                      className={`cursor-pointer transition-all ${
                        activeFilter === 'Folders'
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-blue-500 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50'
                      }`}
                      onClick={() => handleCategoryClick('Folders')}
                    >
                      {categoryCounts.folders}
                    </Badge>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* More (Settings) - Fixed position on the right */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex-shrink-0 px-2"
              onClick={() => console.log('More Settings Menu Button Clicked!')}
            >
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
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        setVisibleColumns((prev) => ({
                          ...prev,
                          name: !prev.name,
                        }))
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={visibleColumns.name}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns((prev) => ({
                            ...prev,
                            name: !!checked,
                          }))
                        }}
                      />
                      <span className="text-xs">Name</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        setVisibleColumns((prev) => ({
                          ...prev,
                          size: !prev.size,
                        }))
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={visibleColumns.size}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns((prev) => ({
                            ...prev,
                            size: !!checked,
                          }))
                        }}
                      />
                      <span className="text-xs">Size</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        setVisibleColumns((prev) => ({
                          ...prev,
                          mimeType: !prev.mimeType,
                        }))
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={visibleColumns.mimeType}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns((prev) => ({
                            ...prev,
                            mimeType: !!checked,
                          }))
                        }}
                      />
                      <span className="text-xs">MIME Type</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        setVisibleColumns((prev) => ({
                          ...prev,
                          owners: !prev.owners,
                        }))
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={visibleColumns.owners}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns((prev) => ({
                            ...prev,
                            owners: !!checked,
                          }))
                        }}
                      />
                      <span className="text-xs">Owner</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        setVisibleColumns((prev) => ({
                          ...prev,
                          createdTime: !prev.createdTime,
                        }))
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={visibleColumns.createdTime}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns((prev) => ({
                            ...prev,
                            createdTime: !!checked,
                          }))
                        }}
                      />
                      <span className="text-xs">Created</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        setVisibleColumns((prev) => ({
                          ...prev,
                          modifiedTime: !prev.modifiedTime,
                        }))
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={visibleColumns.modifiedTime}
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns((prev) => ({
                            ...prev,
                            modifiedTime: !!checked,
                          }))
                        }}
                      />
                      <span className="text-xs">Modified</span>
                    </DropdownMenuItem>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            <DropdownMenuSeparator />

            {/* Additional Actions */}
            <DropdownMenuItem onClick={onRefresh} disabled={refreshing}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
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
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit(e)}
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
                  const searchExpanded = document.querySelector(
                    '#search-expanded'
                  ) as HTMLElement
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
            onClick={(e) => onSearchSubmit(e)}
            disabled={!searchQuery.trim()}
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
    </div>
  )
}
