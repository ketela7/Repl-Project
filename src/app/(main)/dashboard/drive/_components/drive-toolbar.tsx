"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
} from "lucide-react";
import { FileIcon } from "@/components/file-icon";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileCategoryBadges } from "@/components/file-category-badges";

// Types
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  createdTime?: string;
  ownedByMe?: boolean;
  shared?: boolean;
  trashed?: boolean;
  type: 'file' | 'folder';
}

interface AdvancedFilters {
  sizeRange: {
    min?: number;
    max?: number;
    unit: 'B' | 'KB' | 'MB' | 'GB';
  };
  createdDateRange: {
    from?: Date;
    to?: Date;
  };
  modifiedDateRange: {
    from?: Date;
    to?: Date;
  };
  owner?: string;
  sortBy: 'name' | 'modified' | 'created' | 'size';
  sortOrder: 'asc' | 'desc';
}

interface VisibleColumns {
  name: boolean;
  size: boolean;
  mimeType: boolean;
  owners: boolean;
  createdTime: boolean;
  modifiedTime: boolean;
}

interface DriveToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  isSelectMode: boolean;
  onSelectModeChange: (mode: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onUpload: () => void;
  onCreateFolder: () => void;
  onBulkDelete: () => void;
  onBulkMove: () => void;
  onBulkCopy: () => void;
  onBulkShare: () => void;
  onFiltersOpen: () => void;
  onMobileActionsOpen?: () => void;
  filters: {
    activeView: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash';
    fileTypeFilter: string[];
    advancedFilters: AdvancedFilters;
  };
  onFilterChange: (updates: Partial<{
    activeView: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash';
    fileTypeFilter: string[];
    advancedFilters: AdvancedFilters;
  }>) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  files: import("@/lib/google-drive/types").DriveFile[];
  folders: import("@/lib/google-drive/types").DriveFolder[];
  items: any[];
  setIsUploadDialogOpen: (open: boolean) => void;
  setIsCreateFolderDialogOpen: (open: boolean) => void;
  
  // Table columns
  visibleColumns: VisibleColumns;
  setVisibleColumns: (columns: VisibleColumns | ((prev: VisibleColumns) => VisibleColumns)) => void;
  
  // Loading states
  loading: boolean;
  
  // Client-side filtering
  onClientSideFilter?: (filteredFiles: DriveFile[], filteredFolders: DriveFile[]) => void;
}

// Client-side filtering function using mimeType
const filterByMimeType = (files: DriveFile[], folders: DriveFile[], category: string) => {
  const getCategoryFromMimeType = (mimeType: string): string => {
    const mime = mimeType.toLowerCase();
    
    // Video files
    if (mime.startsWith('video/') || mime.includes('mp4') || mime.includes('mov') || mime.includes('avi') || mime.includes('mkv') || mime.includes('webm')) return 'Videos';
    
    // Audio files
    if (mime.startsWith('audio/') || mime.includes('mp3') || mime.includes('wav') || mime.includes('flac') || mime.includes('aac') || mime.includes('ogg')) return 'Audio';
    
    // Image files
    if (mime.startsWith('image/') || mime.includes('jpeg') || mime.includes('jpg') || mime.includes('png') || mime.includes('gif') || mime.includes('bmp') || mime.includes('svg') || mime.includes('webp')) return 'Images';
    
    // Document files
    if (mime.includes('document') || mime.includes('pdf') || mime.includes('msword') || mime.includes('wordprocessingml') || mime.includes('rtf') || mime.includes('odt') || mime.includes('txt')) return 'Documents';
    
    // Spreadsheet files
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('sheet') || mime.includes('csv') || mime.includes('ods') || mime.includes('xlsx') || mime.includes('xls')) return 'Spreadsheets';
    
    // Presentation files
    if (mime.includes('presentation') || mime.includes('powerpoint') || mime.includes('ppt') || mime.includes('odp') || mime.includes('keynote') || mime.includes('pptx')) return 'Presentations';
    
    // Archive files
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('gz') || mime.includes('7z') || mime.includes('archive')) return 'Archives';
    
    // Code files
    if (mime.includes('javascript') || mime.includes('typescript') || mime.includes('json') || mime.includes('html') || mime.includes('css') || mime.includes('xml') || mime.includes('yaml') || mime.includes('python') || mime.includes('java')) return 'Code';
    
    // Google Drive specific
    if (mime.includes('vnd.google-apps.document')) return 'Documents';
    if (mime.includes('vnd.google-apps.spreadsheet')) return 'Spreadsheets';
    if (mime.includes('vnd.google-apps.presentation')) return 'Presentations';
    if (mime.includes('vnd.google-apps.shortcut')) return 'Shortcuts';
    
    return 'Others';
  };

  if (category === 'Folders') {
    return { filteredFiles: [], filteredFolders: folders };
  }

  const filteredFiles = files.filter(f => getCategoryFromMimeType(f.mimeType) === category);
  return { filteredFiles, filteredFolders: category === 'Folders' ? folders : [] };
};

export function DriveToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  viewMode,
  onViewModeChange,
  isSelectMode,
  onSelectModeChange,
  selectedCount,
  totalCount,
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
  files,
  folders,
  visibleColumns,
  setVisibleColumns,
  onClientSideFilter
}: DriveToolbarProps) {
  const isMobile = useIsMobile();
  
  // Extract necessary props from filters
  const { activeView, fileTypeFilter, advancedFilters } = filters;

  // Handle badge click for client-side filtering
  const handleCategoryClick = (category: string) => {
    if (onClientSideFilter) {
      const { filteredFiles, filteredFolders } = filterByMimeType(files, folders, category);
      onClientSideFilter(filteredFiles, filteredFolders);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm transition-transform duration-200 ease-in-out"
         id="drive-toolbar">
      <div className="flex items-center justify-between p-3 overflow-x-auto scrollbar-hide scroll-smooth"
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Main Menu - 5 Items - Horizontal Scrollable */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          
          {/* Search */}
          <Button
            variant={searchQuery ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              const searchExpanded = document.querySelector('#search-expanded') as HTMLElement;
              if (searchExpanded) {
                searchExpanded.style.display = searchExpanded.style.display === 'none' ? 'block' : 'none';
                if (searchExpanded.style.display === 'block') {
                  setTimeout(() => {
                    const input = searchExpanded.querySelector('input') as HTMLInputElement;
                    if (input) input.focus();
                  }, 100);
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
            {viewMode === 'grid' ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile Bulk Actions Button - Show when items are selected on mobile */}
          {isMobile && selectedCount > 0 && onMobileActionsOpen && (
            <Button
              variant="default"
              size="sm"
              onClick={onMobileActionsOpen}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MoreVertical className="h-4 w-4 mr-1" />
              Actions ({selectedCount})
            </Button>
          )}

          {/* Batch - Desktop dropdown interface */}
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isSelectMode ? 'default' : 'ghost'}
                  size="sm"
                  disabled={files.length === 0 && folders.length === 0}
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
              <DropdownMenuItem onClick={() => onSelectModeChange(!isSelectMode)}>
                {isSelectMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Exit Selection
                  </>
                ) : (
                  <>
                    <SquareCheck className="h-4 w-4 mr-2" />
                    Select Mode
                  </>
                )}
              </DropdownMenuItem>
              
              {isSelectMode && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSelectAll}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All ({files.length + folders.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSelectAll}>
                    <Square className="h-4 w-4 mr-2" />
                    Clear Selection
                  </DropdownMenuItem>
                  
                  {selectedCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        File Operations ({selectedCount} selected)
                      </div>
                      
                      {/* Download Selected - Smart visibility: only show if there are actual downloadable files (not folders) */}
                      <DropdownMenuItem onClick={onBulkDelete}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Selected
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={onBulkMove}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename Selected
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={onBulkCopy}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export Selected
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={onBulkMove}>
                        <Move className="h-4 w-4 mr-2" />
                        Move Selected
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={onBulkCopy}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Selected
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={onBulkShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Selected
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={onBulkDelete}
                        className="text-orange-600 dark:text-orange-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Move to Trash
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
              onClick={onFiltersOpen}
              className={`h-8 px-2 md:px-3 ${(filters.activeView !== 'all' || filters.fileTypeFilter.length > 0 || 
                filters.advancedFilters.sizeRange?.min || filters.advancedFilters.sizeRange?.max ||
                filters.advancedFilters.createdDateRange?.from || filters.advancedFilters.modifiedDateRange?.from ||
                filters.advancedFilters.owner) ? 'bg-primary/10 text-primary' : ''}`}
            >
              <Calendar className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Filter</span>
              {(activeView !== 'all' || fileTypeFilter.length > 0 || 
                advancedFilters.sizeRange?.min || advancedFilters.sizeRange?.max ||
                advancedFilters.createdDateRange?.from || advancedFilters.modifiedDateRange?.from ||
                advancedFilters.owner) && (
                <Badge variant="secondary" className="ml-1 md:ml-2 h-4 px-1 text-xs">
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
                  className={`h-8 px-2 ${(filters.activeView !== 'all' || filters.fileTypeFilter.length > 0 || 
                    filters.advancedFilters.sizeRange?.min || filters.advancedFilters.sizeRange?.max ||
                    filters.advancedFilters.createdDateRange?.from || filters.advancedFilters.modifiedDateRange?.from ||
                    filters.advancedFilters.owner) ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Calendar className="h-4 w-4" />
                  {(activeView !== 'all' || fileTypeFilter.length > 0 || 
                    advancedFilters.sizeRange?.min || advancedFilters.sizeRange?.max ||
                    advancedFilters.createdDateRange?.from || advancedFilters.modifiedDateRange?.from ||
                    advancedFilters.owner) && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      •
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm text-foreground">Filters</h4>
                  {(activeView !== 'all' || fileTypeFilter.length > 0 || 
                    advancedFilters.sizeRange?.min || advancedFilters.sizeRange?.max ||
                    advancedFilters.createdDateRange?.from || advancedFilters.modifiedDateRange?.from ||
                    advancedFilters.owner) && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                
                {/* Basic Filter */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
                    <span className="text-sm font-semibold">View Status</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 ml-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={filters.activeView === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onFilterChange({ activeView: 'all' })}
                        className="justify-start text-xs"
                      >
                        All Files
                      </Button>
                      <Button
                        variant={filters.activeView === 'my-drive' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onFilterChange({ activeView: 'my-drive' })}
                        className="justify-start text-xs"
                      >
                        My Drive
                      </Button>
                      <Button
                        variant={filters.activeView === 'recent' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onFilterChange({ activeView: 'recent' })}
                        className="justify-start text-xs"
                      >
                        Recent
                      </Button>
                      <Button
                        variant={filters.activeView === 'trash' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onFilterChange({ activeView: 'trash' })}
                        className="justify-start text-xs"
                      >
                        Trash
                      </Button>
                      <Button
                        variant={filters.activeView === 'starred' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onFilterChange({ activeView: 'starred' })}
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
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
                    <span className="text-sm font-semibold">File Types</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 ml-2 mt-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={filters.fileTypeFilter.includes('folder') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newTypes = filters.fileTypeFilter.includes('folder') 
                            ? filters.fileTypeFilter.filter(t => t !== 'folder')
                            : [...filters.fileTypeFilter, 'folder'];
                          onFilterChange({ fileTypeFilter: newTypes });
                        }}
                        className="justify-center text-xs p-2"
                        title="Folders"
                      >
                        <Folder className="h-4 w-4" />
                      </Button>
                      {[
                        { 
                          type: 'document', 
                          mimeType: 'application/vnd.google-apps.document', 
                          title: 'Documents' 
                        },
                        { 
                          type: 'spreadsheet', 
                          mimeType: 'application/vnd.google-apps.spreadsheet', 
                          title: 'Spreadsheets' 
                        },
                        { 
                          type: 'presentation', 
                          mimeType: 'application/vnd.google-apps.presentation', 
                          title: 'Presentations' 
                        },
                        { 
                          type: 'image', 
                          mimeType: 'image/jpeg', 
                          title: 'Images' 
                        },
                        { 
                          type: 'video', 
                          mimeType: 'video/mp4', 
                          title: 'Videos' 
                        },
                        { 
                          type: 'audio', 
                          mimeType: 'audio/mp3', 
                          title: 'Audio' 
                        },
                        { 
                          type: 'archive', 
                          mimeType: 'application/zip', 
                          title: 'Archives' 
                        },
                        { 
                          type: 'code', 
                          mimeType: 'text/javascript', 
                          title: 'Code Files' 
                        },
                        { 
                          type: 'shortcut', 
                          mimeType: 'application/vnd.google-apps.shortcut', 
                          title: 'Shortcuts' 
                        }
                      ].map((filter) => {
                        return (
                          <Button
                            key={filter.type}
                            variant={filters.fileTypeFilter.includes(filter.type) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              const newTypes = filters.fileTypeFilter.includes(filter.type) 
                                ? filters.fileTypeFilter.filter(t => t !== filter.type)
                                : [...filters.fileTypeFilter, filter.type];
                              onFilterChange({ fileTypeFilter: newTypes });
                            }}
                            className="justify-center text-xs p-2"
                            title={filter.title}
                          >
                            <FileIcon mimeType={filter.mimeType} className="h-4 w-4" />
                          </Button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-3" />

                {/* Sort Options */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
                    <span className="text-sm font-semibold">Sort Options</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 ml-2 mt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Sort By</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={filters.advancedFilters.sortBy === 'name' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ advancedFilters: { ...filters.advancedFilters, sortBy: 'name' } });
                          }}
                          className="justify-start text-xs"
                        >
                          Name
                        </Button>
                        <Button
                          variant={filters.advancedFilters.sortBy === 'modified' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ advancedFilters: { ...filters.advancedFilters, sortBy: 'modified' } });
                          }}
                          className="justify-start text-xs"
                        >
                          Modified
                        </Button>
                        <Button
                          variant={filters.advancedFilters.sortBy === 'created' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ advancedFilters: { ...filters.advancedFilters, sortBy: 'created' } });
                          }}
                          className="justify-start text-xs"
                        >
                          Created
                        </Button>
                        <Button
                          variant={filters.advancedFilters.sortBy === 'size' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ advancedFilters: { ...filters.advancedFilters, sortBy: 'size' } });
                          }}
                          className="justify-start text-xs"
                        >
                          Size
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={filters.advancedFilters.sortOrder === 'asc' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ advancedFilters: { ...filters.advancedFilters, sortOrder: 'asc' } });
                          }}
                          className="justify-start text-xs"
                        >
                          Ascending
                        </Button>
                        <Button
                          variant={filters.advancedFilters.sortOrder === 'desc' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onFilterChange({ advancedFilters: { ...filters.advancedFilters, sortOrder: 'desc' } });
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
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
                    <span className="text-sm font-semibold">Advanced Filters</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 ml-2 mt-3">
                    {/* Size Range */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">File Size Range</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.advancedFilters.sizeRange?.min || ''}
                          onChange={(e) => onFilterChange({ advancedFilters: {
                            ...filters.advancedFilters,
                            sizeRange: { ...filters.advancedFilters.sizeRange, min: parseInt(e.target.value) || undefined, unit: filters.advancedFilters.sizeRange?.unit || 'MB' }
                          }})}
                          className="text-xs h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.advancedFilters.sizeRange?.max || ''}
                          onChange={(e) => onFilterChange({ advancedFilters: {
                            ...filters.advancedFilters,
                            sizeRange: { ...filters.advancedFilters.sizeRange, max: parseInt(e.target.value) || undefined, unit: filters.advancedFilters.sizeRange?.unit || 'MB' }
                          }})}
                          className="text-xs h-8"
                        />
                        <select
                          value={filters.advancedFilters.sizeRange?.unit || 'MB'}
                          onChange={(e) => onFilterChange({ advancedFilters: {
                            ...filters.advancedFilters,
                            sizeRange: { ...filters.advancedFilters.sizeRange, unit: e.target.value as 'B' | 'KB' | 'MB' | 'GB' }
                          }})}
                          className="text-xs h-8 px-2 border rounded-md bg-background"
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
                      <label className="text-xs font-medium text-muted-foreground">Created Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={filters.advancedFilters.createdDateRange?.from?.toISOString().split('T')[0] || ''}
                          onChange={(e) => onFilterChange({ advancedFilters: {
                            ...filters.advancedFilters,
                            createdDateRange: { 
                              ...filters.advancedFilters.createdDateRange, 
                              from: e.target.value ? new Date(e.target.value) : undefined 
                            }
                          }})}
                          className="text-xs h-8"
                        />
                        <Input
                          type="date"
                          value={filters.advancedFilters.createdDateRange?.to?.toISOString().split('T')[0] || ''}
                          onChange={(e) => onFilterChange({ advancedFilters: {
                            ...filters.advancedFilters,
                            createdDateRange: { 
                              ...filters.advancedFilters.createdDateRange, 
                              to: e.target.value ? new Date(e.target.value) : undefined 
                            }
                          }})}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Modified Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={filters.advancedFilters.modifiedDateRange?.from?.toISOString().split('T')[0] || ''}
                          onChange={(e) => onFilterChange({ advancedFilters: {
                            ...filters.advancedFilters,
                            modifiedDateRange: { 
                              ...filters.advancedFilters.modifiedDateRange, 
                              from: e.target.value ? new Date(e.target.value) : undefined 
                            }
                          }})}
                          className="text-xs h-8"
                        />
                        <Input
                          type="date"
                          value={filters.advancedFilters.modifiedDateRange?.to?.toISOString().split('T')[0] || ''}
                          onChange={(e) => onFilterChange({ advancedFilters: {
                            ...filters.advancedFilters,
                            modifiedDateRange: { 
                              ...filters.advancedFilters.modifiedDateRange, 
                              to: e.target.value ? new Date(e.target.value) : undefined 
                            }
                          }})}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Owner Email</label>
                      <Input
                        type="email"
                        placeholder="Enter owner email"
                        value={filters.advancedFilters.owner || ''}
                        onChange={(e) => onFilterChange({ advancedFilters: {
                          ...filters.advancedFilters,
                          owner: e.target.value || undefined
                        }})}
                        className="text-xs h-8"
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
                {items.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {items.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-96 p-4">
              <div className="space-y-4">
                <div className="text-sm font-semibold border-b pb-2">File Categories (Click to Filter)</div>
                
                {/* File Category Badges Component */}
                <FileCategoryBadges
                  files={files}
                  folders={folders}
                  onCategoryClick={handleCategoryClick}
                  className="w-full"
                />
                
                {/* Reset Filter Button */}
                {onClientSideFilter && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onClientSideFilter(files, folders)}
                      className="w-full text-xs"
                    >
                      Show All Files ({items.length})
                    </Button>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* More (Settings) - Fixed position on the right */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 px-2">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* Quick Actions */}
            <DropdownMenuItem onClick={onUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Table Column Settings - Only show in table mode */}
            {viewMode === 'table' && (
              <>
                <DropdownMenuSeparator />
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
                    <span className="text-sm font-semibold">Table Columns</span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 ml-4">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        setVisibleColumns(prev => ({ ...prev, name: !prev.name }));
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox 
                        checked={visibleColumns.name} 
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns(prev => ({ ...prev, name: !!checked }));
                        }}
                      />
                      <span className="text-xs">Name</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        setVisibleColumns(prev => ({ ...prev, size: !prev.size }));
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox 
                        checked={visibleColumns.size} 
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns(prev => ({ ...prev, size: !!checked }));
                        }}
                      />
                      <span className="text-xs">Size</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        setVisibleColumns(prev => ({ ...prev, mimeType: !prev.mimeType }));
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox 
                        checked={visibleColumns.mimeType} 
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns(prev => ({ ...prev, mimeType: !!checked }));
                        }}
                      />
                      <span className="text-xs">MIME Type</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        setVisibleColumns(prev => ({ ...prev, owners: !prev.owners }));
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox 
                        checked={visibleColumns.owners} 
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns(prev => ({ ...prev, owners: !!checked }));
                        }}
                      />
                      <span className="text-xs">Owner</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        setVisibleColumns(prev => ({ ...prev, createdTime: !prev.createdTime }));
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox 
                        checked={visibleColumns.createdTime} 
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns(prev => ({ ...prev, createdTime: !!checked }));
                        }}
                      />
                      <span className="text-xs">Created</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        setVisibleColumns(prev => ({ ...prev, modifiedTime: !prev.modifiedTime }));
                      }}
                      className="cursor-pointer"
                    >
                      <Checkbox 
                        checked={visibleColumns.modifiedTime} 
                        className="mr-2 h-3 w-3"
                        onCheckedChange={(checked) => {
                          setVisibleColumns(prev => ({ ...prev, modifiedTime: !!checked }));
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
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Drive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Enhanced Search Bar - Expandable with better UX */}
      <div id="search-expanded" style={{ display: 'none' }} className="border-t bg-muted/30 p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit(e)}
              className="pl-10 pr-20 h-10"
              disabled={false}
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => {
                    onSearchChange('');
                    onRefresh();
                  }}
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={() => {
                  const searchExpanded = document.querySelector('#search-expanded') as HTMLElement;
                  if (searchExpanded) {
                    searchExpanded.style.display = 'none';
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
            className="px-4 h-10"
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
  );
}