'use client';

import React from 'react';
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
  Calendar,
  Settings,
  ChevronDown,
  HardDrive,
  Folder,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  FileCode,
  Link,
  Upload,
  FolderPlus,
  ChevronUp,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";
import { FileIcon } from "@/components/file-icon";
import { useIsMobile } from "@/hooks/use-mobile";

// Types
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  parents?: string[];
  owners?: Array<{ displayName: string; emailAddress: string }>;
  createdTime?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  parents?: string[];
  owners?: Array<{ displayName: string; emailAddress: string }>;
  createdTime?: string;
}

interface AdvancedFilters {
  sizeRange: {
    min?: string;
    max?: string;
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
  setIsUploadDialogOpen: (open: boolean) => void;
  setIsCreateFolderDialogOpen: (open: boolean) => void;
  
  // Table columns
  visibleColumns: VisibleColumns;
  setVisibleColumns: (columns: VisibleColumns | ((prev: VisibleColumns) => VisibleColumns)) => void;
  
  // Loading states
  loading: boolean;
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
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  hasActiveFilters,
  files,
  folders,
  visibleColumns,
  setVisibleColumns
}: DriveToolbarProps) {
  const isMobile = useIsMobile();
  
  // Extract necessary props from filters
  const { activeView, fileTypeFilter, advancedFilters } = filters;

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm transition-transform duration-200 ease-in-out"
         id="drive-toolbar">
      <div className="flex items-center justify-between p-3 overflow-x-auto scrollbar-hide scroll-smooth"
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Main Menu - Mobile-style buttons */}
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

          {/* View Toggle */}
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

          {/* Batch Operations */}
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
                    Select All ({folders.length + files.length})
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

          {/* Filter */}
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
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* FileCategoryBadges - Floating Panel Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 px-2"
                title="File Categories"
              >
                <HardDrive className="h-4 w-4" />
                {(files.length > 0 || folders.length > 0) && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {files.length + folders.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm text-foreground">File Categories</h4>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {files.length + folders.length} items
                  </Badge>
                </div>
                
                {/* Folders */}
                {folders.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md mb-2">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Folders</span>
                    </div>
                    <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-300">
                      {folders.length}
                    </Badge>
                  </div>
                )}

                {/* Documents */}
                {files.filter(f => f.mimeType?.includes('document') || f.mimeType?.includes('pdf') || f.mimeType?.includes('text')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-md mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Documents</span>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">
                      {files.filter(f => f.mimeType?.includes('document') || f.mimeType?.includes('pdf') || f.mimeType?.includes('text')).length}
                    </Badge>
                  </div>
                )}

                {/* Images */}
                {files.filter(f => f.mimeType?.startsWith('image/')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950/30 rounded-md mb-2">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Images</span>
                    </div>
                    <Badge variant="outline" className="border-purple-500 text-purple-700 dark:text-purple-300">
                      {files.filter(f => f.mimeType?.startsWith('image/')).length}
                    </Badge>
                  </div>
                )}

                {/* Shortcuts */}
                {files.filter(f => f.mimeType === 'application/vnd.google-apps.shortcut').length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md mb-2">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Shortcuts</span>
                    </div>
                    <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-300">
                      {files.filter(f => f.mimeType === 'application/vnd.google-apps.shortcut').length}
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
      <div id="search-expanded" style={{ display: 'none' }} className="border-t bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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