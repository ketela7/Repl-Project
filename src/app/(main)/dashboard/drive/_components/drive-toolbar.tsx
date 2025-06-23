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
  createdTime?: string;
  ownedByMe?: boolean;
  shared?: boolean;
  trashed?: boolean;
  type: 'file' | 'folder';
}

interface AdvancedFilters {
  sizeRange?: {
    min?: number;
    max?: number;
    unit: 'B' | 'KB' | 'MB' | 'GB';
  };
  createdDateRange?: {
    from?: Date;
    to?: Date;
  };
  modifiedDateRange?: {
    from?: Date;
    to?: Date;
  };
  owner?: string;
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
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchInput: (value: string) => void;
  handleSearch: () => void;
  setSubmittedSearchQuery: (query: string) => void;
  
  // View state
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  activeView: string;
  handleViewChange: (view: string) => void;
  
  // Selection state
  selectedItems: Set<string>;
  isSelectMode: boolean;
  toggleSelectMode: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedItemsData: () => any[];
  setIsMobileActionsOpen: (open: boolean) => void;
  
  // Filter state
  fileTypeFilter: string[];
  handleFileTypeToggle: (type: string) => void;
  advancedFilters: AdvancedFilters;
  setAdvancedFilters: (filters: AdvancedFilters | ((prev: AdvancedFilters) => AdvancedFilters)) => void;
  setIsMobileFiltersOpen: (open: boolean) => void;
  
  // File data
  sortedFiles: DriveFile[];
  sortedFolders: DriveFile[];
  files: DriveFile[];
  folders: DriveFile[];
  
  // Actions
  getFileActions: (file: DriveFile, view: string) => any;
  handleBulkDownload: () => void;
  handleRefresh: () => void;
  fetchFiles: (folderId?: string) => void;
  currentFolderId: string | null;
  
  // Dialog state
  setIsBulkRenameDialogOpen: (open: boolean) => void;
  setIsBulkExportDialogOpen: (open: boolean) => void;
  setIsBulkMoveDialogOpen: (open: boolean) => void;
  setIsBulkCopyDialogOpen: (open: boolean) => void;
  setIsBulkShareDialogOpen: (open: boolean) => void;
  setIsBulkRestoreDialogOpen: (open: boolean) => void;
  setIsBulkDeleteDialogOpen: (open: boolean) => void;
  setIsBulkPermanentDeleteDialogOpen: (open: boolean) => void;
  setIsUploadDialogOpen: (open: boolean) => void;
  setIsCreateFolderDialogOpen: (open: boolean) => void;
  
  // Table columns
  visibleColumns: VisibleColumns;
  setVisibleColumns: (columns: VisibleColumns | ((prev: VisibleColumns) => VisibleColumns)) => void;
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
}

export function DriveToolbar({
  searchQuery,
  setSearchQuery,
  handleSearchInput,
  handleSearch,
  setSubmittedSearchQuery,
  viewMode,
  setViewMode,
  activeView,
  handleViewChange,
  selectedItems,
  isSelectMode,
  toggleSelectMode,
  selectAll,
  deselectAll,
  getSelectedItemsData,
  setIsMobileActionsOpen,
  fileTypeFilter,
  handleFileTypeToggle,
  advancedFilters,
  setAdvancedFilters,
  setIsMobileFiltersOpen,
  sortedFiles,
  sortedFolders,
  files,
  folders,
  getFileActions,
  handleBulkDownload,
  handleRefresh,
  fetchFiles,
  currentFolderId,
  setIsBulkRenameDialogOpen,
  setIsBulkExportDialogOpen,
  setIsBulkMoveDialogOpen,
  setIsBulkCopyDialogOpen,
  setIsBulkShareDialogOpen,
  setIsBulkRestoreDialogOpen,
  setIsBulkDeleteDialogOpen,
  setIsBulkPermanentDeleteDialogOpen,
  setIsUploadDialogOpen,
  setIsCreateFolderDialogOpen,
  visibleColumns,
  setVisibleColumns,
  loading,
  refreshing,
}: DriveToolbarProps) {
  const isMobile = useIsMobile();

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm transition-transform duration-200 ease-in-out"
         id="drive-toolbar">
      <div className="flex items-center justify-between p-3 md:p-4 overflow-x-auto scrollbar-hide scroll-smooth"
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Main Menu - 5 Items - Horizontal Scrollable */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 min-w-0">
          
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
            className="h-8 px-2 md:px-3"
          >
            <Search className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Search</span>
            {searchQuery && (
              <Badge variant="secondary" className="ml-1 md:ml-2 h-4 px-1 text-xs">
                •
              </Badge>
            )}
          </Button>

          {/* View Toggle - More prominent */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="h-8 px-2 md:px-3"
            title={`Switch to ${viewMode === 'grid' ? 'table' : 'grid'} view`}
          >
            {viewMode === 'grid' ? (
              <List className="h-4 w-4 md:mr-2" />
            ) : (
              <Grid3X3 className="h-4 w-4 md:mr-2" />
            )}
            <span className="hidden md:inline">
              {viewMode === 'grid' ? 'Table' : 'Grid'}
            </span>
          </Button>

          {/* Batch - Mobile opens bottom sheet when items selected, Desktop uses dropdown */}
          {isMobile && selectedItems.size > 0 ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsMobileActionsOpen(true)}
              className="h-8 px-2 md:px-3"
            >
              <Square className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Actions</span>
              <Badge variant="secondary" className="ml-1 md:ml-2 h-4 px-1 text-xs">
                {selectedItems.size}
              </Badge>
              {(activeView === 'trash' || searchQuery.includes('trashed:true')) && (
                <Badge variant="destructive" className="ml-1 md:ml-2 h-4 px-1 text-xs">
                  <span className="hidden md:inline">Trash</span>
                  <span className="md:hidden">T</span>
                </Badge>
              )}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isSelectMode ? 'default' : 'ghost'}
                  size="sm"
                  disabled={sortedFiles.length === 0 && sortedFolders.length === 0}
                  className="h-8 px-2 md:px-3"
                >
                  <Square className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Batch</span>
                  {selectedItems.size > 0 && (
                    <Badge variant="secondary" className="ml-1 md:ml-2 h-4 px-1 text-xs">
                      {selectedItems.size}
                    </Badge>
                  )}
                  {(activeView === 'trash' || searchQuery.includes('trashed:true')) && (
                    <Badge variant="destructive" className="ml-1 md:ml-2 h-4 px-1 text-xs">
                      <span className="hidden md:inline">Trash Mode</span>
                      <span className="md:hidden">T</span>
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuItem onClick={toggleSelectMode}>
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
                  <DropdownMenuItem onClick={selectAll}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All ({folders.length + files.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={deselectAll}>
                    <Square className="h-4 w-4 mr-2" />
                    Clear Selection
                  </DropdownMenuItem>
                  
                  {selectedItems.size > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        File Operations ({selectedItems.size} selected)
                      </div>
                      
                      {/* Download Selected - Smart visibility: only show if there are actual downloadable files (not folders) */}
                      {(() => {
                        const selectedItems = getSelectedItemsData();
                        const downloadableFiles = selectedItems.filter(item => {
                          // Only files can be downloaded, not folders
                          return item.type === 'file' && 
                                 item.mimeType !== 'application/vnd.google-apps.folder';
                        });
                        
                        return downloadableFiles.length > 0 && (
                          <DropdownMenuItem onClick={handleBulkDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Selected ({downloadableFiles.length} file{downloadableFiles.length > 1 ? 's' : ''})
                          </DropdownMenuItem>
                        );
                      })()}
                      
                      {/* Rename Selected - Available if any item can be renamed */}
                      {getSelectedItemsData().some(item => {
                        const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
                        const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
                        return actions?.canRename;
                      }) && (
                        <DropdownMenuItem onClick={() => setIsBulkRenameDialogOpen(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename Selected
                        </DropdownMenuItem>
                      )}
                      
                      {/* Export Selected - Available if any Google Workspace file can be exported */}
                      {getSelectedItemsData().some(item => {
                        const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
                        return item.type === 'file' && 
                               item.mimeType && 
                               item.mimeType.startsWith('application/vnd.google-apps.') &&
                               !item.mimeType.includes('folder') &&
                               !item.mimeType.includes('shortcut');
                      }) && (
                        <DropdownMenuItem onClick={() => setIsBulkExportDialogOpen(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export Selected
                        </DropdownMenuItem>
                      )}
                      
                      {/* Move Selected - Available if any item can be moved */}
                      {getSelectedItemsData().some(item => {
                        const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
                        const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
                        return actions?.canMove;
                      }) && (
                        <DropdownMenuItem onClick={() => setIsBulkMoveDialogOpen(true)}>
                          <Move className="h-4 w-4 mr-2" />
                          Move Selected
                        </DropdownMenuItem>
                      )}
                      
                      {/* Copy Selected - Available if any item can be copied */}
                      {getSelectedItemsData().some(item => {
                        const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
                        const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
                        return actions?.canCopy;
                      }) && (
                        <DropdownMenuItem onClick={() => setIsBulkCopyDialogOpen(true)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Selected
                        </DropdownMenuItem>
                      )}
                      
                      {/* Share Selected - Available if any item can be shared */}
                      {getSelectedItemsData().some(item => {
                        const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
                        const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
                        return actions?.canShare;
                      }) && (
                        <DropdownMenuItem onClick={() => setIsBulkShareDialogOpen(true)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Selected
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                        Actions
                      </div>
                      
                      {/* Check if any selected item can be restored (only for trashed items) */}
                      {getSelectedItemsData().some(item => {
                        const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
                        const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
                        return actions?.canRestore;
                      }) && (
                        <DropdownMenuItem 
                          onClick={() => setIsBulkRestoreDialogOpen(true)}
                          className="text-green-600 dark:text-green-400"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Restore Selected
                        </DropdownMenuItem>
                      )}
                      
                      {/* Check if any selected item can be moved to trash - owner is me, not shared */}
                      {getSelectedItemsData().some(item => {
                        const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
                        if (!fileOrFolder) return false;
                        // Can trash if: owner is me, not shared, not already in trash
                        const isOwner = fileOrFolder.ownedByMe === true;
                        const isShared = fileOrFolder.shared;
                        const isTrashed = fileOrFolder.trashed;
                        return isOwner && !isShared && !isTrashed;
                      }) && (
                        <DropdownMenuItem 
                          onClick={() => setIsBulkDeleteDialogOpen(true)}
                          className="text-orange-600 dark:text-orange-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Move to Trash
                        </DropdownMenuItem>
                      )}
                      
                      {/* Check if any selected item can be permanently deleted */}
                      {getSelectedItemsData().some(item => {
                        const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
                        const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
                        return actions?.canPermanentDelete;
                      }) && (
                        <DropdownMenuItem 
                          onClick={() => setIsBulkPermanentDeleteDialogOpen(true)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Permanently Delete
                        </DropdownMenuItem>
                      )}
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
              onClick={() => setIsMobileFiltersOpen(true)}
              className={`h-8 px-2 md:px-3 ${(activeView !== 'all' || fileTypeFilter.length > 0 || 
                advancedFilters.sizeRange?.min || advancedFilters.sizeRange?.max ||
                advancedFilters.createdDateRange?.from || advancedFilters.modifiedDateRange?.from ||
                advancedFilters.owner) ? 'bg-primary/10 text-primary' : ''}`}
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
                  className={`h-8 px-2 md:px-3 ${(activeView !== 'all' || fileTypeFilter.length > 0 || 
                    advancedFilters.sizeRange?.min || advancedFilters.sizeRange?.max ||
                    advancedFilters.createdDateRange?.from || advancedFilters.modifiedDateRange?.from ||
                    advancedFilters.owner) ? 'bg-primary/10 text-primary' : ''}`}
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
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 md:w-96">
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
                        variant={activeView === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('all')}
                        className="justify-start text-xs"
                      >
                        All Files
                      </Button>
                      <Button
                        variant={activeView === 'my-drive' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('my-drive')}
                        className="justify-start text-xs"
                      >
                        My Drive
                      </Button>
                      <Button
                        variant={activeView === 'recent' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('recent')}
                        className="justify-start text-xs"
                      >
                        Recent
                      </Button>
                      <Button
                        variant={activeView === 'trash' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('trash')}
                        className="justify-start text-xs"
                      >
                        Trash
                      </Button>
                      <Button
                        variant={activeView === 'starred' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('starred')}
                        className="justify-start text-xs"
                      >
                        Starred
                      </Button>
                      <Button
                        variant={activeView === 'shared' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('shared')}
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
                        variant={fileTypeFilter.includes('folder') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFileTypeToggle('folder')}
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
                            variant={fileTypeFilter.includes(filter.type) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFileTypeToggle(filter.type)}
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
                          value={advancedFilters.sizeRange?.min || ''}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            sizeRange: { ...prev.sizeRange, min: parseInt(e.target.value) || undefined, unit: prev.sizeRange?.unit || 'MB' }
                          }))}
                          className="text-xs h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={advancedFilters.sizeRange?.max || ''}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            sizeRange: { ...prev.sizeRange, max: parseInt(e.target.value) || undefined, unit: prev.sizeRange?.unit || 'MB' }
                          }))}
                          className="text-xs h-8"
                        />
                        <select
                          value={advancedFilters.sizeRange?.unit || 'MB'}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            sizeRange: { ...prev.sizeRange, unit: e.target.value as 'B' | 'KB' | 'MB' | 'GB' }
                          }))}
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
                          value={advancedFilters.createdDateRange?.from?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            createdDateRange: { 
                              ...prev.createdDateRange, 
                              from: e.target.value ? new Date(e.target.value) : undefined 
                            }
                          }))}
                          className="text-xs h-8"
                        />
                        <Input
                          type="date"
                          value={advancedFilters.createdDateRange?.to?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            createdDateRange: { 
                              ...prev.createdDateRange, 
                              to: e.target.value ? new Date(e.target.value) : undefined 
                            }
                          }))}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Modified Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={advancedFilters.modifiedDateRange?.from?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            modifiedDateRange: { 
                              ...prev.modifiedDateRange, 
                              from: e.target.value ? new Date(e.target.value) : undefined 
                            }
                          }))}
                          className="text-xs h-8"
                        />
                        <Input
                          type="date"
                          value={advancedFilters.modifiedDateRange?.to?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            modifiedDateRange: { 
                              ...prev.modifiedDateRange, 
                              to: e.target.value ? new Date(e.target.value) : undefined 
                            }
                          }))}
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
                        value={advancedFilters.owner || ''}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          owner: e.target.value || undefined
                        }))}
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Clear Filters */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdvancedFilters({ sizeRange: { unit: 'MB' } })}
                        className="flex-1 text-xs"
                      >
                        Clear Advanced
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleViewChange('all');
                          handleFileTypeToggle.length && fileTypeFilter.forEach(type => handleFileTypeToggle(type));
                          setAdvancedFilters({ sizeRange: { unit: 'MB' } });
                          setSearchQuery('');
                        }}
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

          {/* Badge - Floating Panel Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3">
                <HardDrive className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Badge</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-80 p-4">
              <div className="space-y-4">
                <div className="text-sm font-semibold border-b pb-2">File Statistics</div>
                
                {/* Total Files */}
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Total Items</span>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {sortedFiles.length + sortedFolders.length}
                  </Badge>
                </div>

                {/* Folders */}
                {sortedFolders.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Folders</span>
                    </div>
                    <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-300">
                      {sortedFolders.length}
                    </Badge>
                  </div>
                )}

                {/* Images */}
                {sortedFiles.filter(f => f.mimeType?.includes('image')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Images</span>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">
                      {sortedFiles.filter(f => f.mimeType?.includes('image')).length}
                    </Badge>
                  </div>
                )}

                {/* Videos */}
                {sortedFiles.filter(f => f.mimeType?.includes('video')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Videos</span>
                    </div>
                    <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-300">
                      {sortedFiles.filter(f => f.mimeType?.includes('video')).length}
                    </Badge>
                  </div>
                )}

                {/* Documents */}
                {sortedFiles.filter(f => f.mimeType?.includes('document') || f.mimeType?.includes('text') || f.mimeType?.includes('pdf')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Documents</span>
                    </div>
                    <Badge variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-300">
                      {sortedFiles.filter(f => f.mimeType?.includes('document') || f.mimeType?.includes('text') || f.mimeType?.includes('pdf')).length}
                    </Badge>
                  </div>
                )}

                {/* Spreadsheets */}
                {sortedFiles.filter(f => f.mimeType?.includes('spreadsheet') || f.mimeType?.includes('excel') || f.mimeType?.includes('csv')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Spreadsheets</span>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">
                      {sortedFiles.filter(f => f.mimeType?.includes('spreadsheet') || f.mimeType?.includes('excel') || f.mimeType?.includes('csv')).length}
                    </Badge>
                  </div>
                )}

                {/* Presentations */}
                {sortedFiles.filter(f => f.mimeType?.includes('presentation') || f.mimeType?.includes('powerpoint')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <Presentation className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Presentations</span>
                    </div>
                    <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">
                      {sortedFiles.filter(f => f.mimeType?.includes('presentation') || f.mimeType?.includes('powerpoint')).length}
                    </Badge>
                  </div>
                )}

                {/* Videos */}
                {sortedFiles.filter(f => f.mimeType?.startsWith('video/')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileVideo className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Videos</span>
                    </div>
                    <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-300">
                      {sortedFiles.filter(f => f.mimeType?.startsWith('video/')).length}
                    </Badge>
                  </div>
                )}

                {/* Audio */}
                {sortedFiles.filter(f => f.mimeType?.startsWith('audio/')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileAudio className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm">Audio</span>
                    </div>
                    <Badge variant="outline" className="border-indigo-500 text-indigo-700 dark:text-indigo-300">
                      {sortedFiles.filter(f => f.mimeType?.startsWith('audio/')).length}
                    </Badge>
                  </div>
                )}

                {/* Archives */}
                {sortedFiles.filter(f => f.mimeType?.includes('zip') || f.mimeType?.includes('rar') || f.mimeType?.includes('tar') || f.mimeType?.includes('gz') || f.mimeType?.includes('7z')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Archives</span>
                    </div>
                    <Badge variant="outline" className="border-gray-500 text-gray-700 dark:text-gray-300">
                      {sortedFiles.filter(f => f.mimeType?.includes('zip') || f.mimeType?.includes('rar') || f.mimeType?.includes('tar') || f.mimeType?.includes('gz') || f.mimeType?.includes('7z')).length}
                    </Badge>
                  </div>
                )}

                {/* Code Files */}
                {sortedFiles.filter(f => f.mimeType?.includes('javascript') || f.mimeType?.includes('json') || f.mimeType?.includes('html') || f.mimeType?.includes('css') || f.mimeType?.includes('xml')).length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">Code Files</span>
                    </div>
                    <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-300">
                      {sortedFiles.filter(f => f.mimeType?.includes('javascript') || f.mimeType?.includes('json') || f.mimeType?.includes('html') || f.mimeType?.includes('css') || f.mimeType?.includes('xml')).length}
                    </Badge>
                  </div>
                )}

                {/* Shortcuts */}
                {sortedFiles.filter(f => f.mimeType === 'application/vnd.google-apps.shortcut').length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Shortcuts</span>
                    </div>
                    <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-300">
                      {sortedFiles.filter(f => f.mimeType === 'application/vnd.google-apps.shortcut').length}
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
            <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 px-2 md:px-3">
              <Settings className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* Quick Actions */}
            <DropdownMenuItem onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsCreateFolderDialogOpen(true)}>
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
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, name: !prev.name }))}>
                      <Checkbox checked={visibleColumns.name} className="mr-2 h-3 w-3" />
                      <span className="text-xs">Name</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, size: !prev.size }))}>
                      <Checkbox checked={visibleColumns.size} className="mr-2 h-3 w-3" />
                      <span className="text-xs">Size</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, mimeType: !prev.mimeType }))}>
                      <Checkbox checked={visibleColumns.mimeType} className="mr-2 h-3 w-3" />
                      <span className="text-xs">MIME Type</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, owners: !prev.owners }))}>
                      <Checkbox checked={visibleColumns.owners} className="mr-2 h-3 w-3" />
                      <span className="text-xs">Owner</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, createdTime: !prev.createdTime }))}>
                      <Checkbox checked={visibleColumns.createdTime} className="mr-2 h-3 w-3" />
                      <span className="text-xs">Created</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, modifiedTime: !prev.modifiedTime }))}>
                      <Checkbox checked={visibleColumns.modifiedTime} className="mr-2 h-3 w-3" />
                      <span className="text-xs">Modified</span>
                    </DropdownMenuItem>

                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
            
            <DropdownMenuSeparator />
            
            {/* Additional Actions */}
            <DropdownMenuItem onClick={handleRefresh} disabled={refreshing}>
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
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-20 h-10"
              disabled={loading}
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => {
                    setSearchQuery('');
                    setSubmittedSearchQuery('');
                    fetchFiles(currentFolderId || undefined);
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
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-4 h-10"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Search</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}