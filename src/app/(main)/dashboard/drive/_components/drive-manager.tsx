'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Upload, FolderPlus, Search } from 'lucide-react';
import { DriveToolbar } from './drive-toolbar';
// Placeholder components for missing imports
const FileBreadcrumb = ({ currentFolder, onNavigate }: any) => (
  <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
    <span>Current folder: {currentFolder?.name || 'Root'}</span>
  </div>
);

const FileCategoryBadges = ({ files, folders, onCategoryClick }: any) => (
  <div className="flex flex-wrap gap-2 p-2">
    <Badge variant="outline">{files?.length || 0} files</Badge>
    <Badge variant="outline">{folders?.length || 0} folders</Badge>
  </div>
);

const FileList = ({ files, folders, viewMode, onPreview }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    {folders?.map((folder: any) => (
      <div key={folder.id} className="p-4 border rounded-lg">
        <div className="font-medium">{folder.name}</div>
        <div className="text-sm text-muted-foreground">Folder</div>
      </div>
    ))}
    {files?.map((file: any) => (
      <div key={file.id} className="p-4 border rounded-lg cursor-pointer" 
           onClick={() => onPreview?.(file)}>
        <div className="font-medium">{file.name}</div>
        <div className="text-sm text-muted-foreground">{file.mimeType}</div>
      </div>
    ))}
  </div>
);

const DriveGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
    ))}
  </div>
);

const DriveErrorDisplay = ({ error, onRetry, onReconnect }: any) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-red-500 mb-4">Error loading files</div>
    <p className="text-muted-foreground mb-4">{error?.message || 'Something went wrong'}</p>
    <div className="flex gap-2">
      <Button onClick={onRetry} variant="outline">Retry</Button>
      <Button onClick={onReconnect}>Reconnect</Button>
    </div>
  </div>
);
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { driveCache } from '@/lib/cache';
import { requestDeduplicator } from '@/lib/request-deduplication';

// Simple placeholder components for missing dialogs
const PlaceholderDialog = ({ isOpen, onClose, children }: any) => null;

// Available components
const FileUploadDialog = PlaceholderDialog;
const CreateFolderDialog = PlaceholderDialog;
const FileRenameDialog = PlaceholderDialog;
const FileMoveDialog = PlaceholderDialog;
const FileCopyDialog = PlaceholderDialog;
const PermanentDeleteDialog = PlaceholderDialog;
const FileDetailsDialog = PlaceholderDialog;
const FilePreviewDialog = PlaceholderDialog;
const BulkDeleteDialog = PlaceholderDialog;
const BulkMoveDialog = PlaceholderDialog;
const BulkExportDialog = PlaceholderDialog;
const BulkRenameDialog = PlaceholderDialog;
const BulkRestoreDialog = PlaceholderDialog;
const BulkPermanentDeleteDialog = PlaceholderDialog;
const BulkCopyDialog = PlaceholderDialog;
const BulkShareDialog = PlaceholderDialog;
const MobileActionsBottomSheet = PlaceholderDialog;
const FiltersDialog = PlaceholderDialog;

/**
 * Enhanced DriveManager component with Android-style sticky toolbar
 * Provides comprehensive file management with mobile-first design
 * 
 * Features:
 * - Android-style sticky toolbar with scroll detection
 * - Mobile-optimized touch interactions
 * - Advanced filtering and search capabilities
 * - Bulk operations with parallel processing
 * - Cross-platform responsive design
 */
export function DriveManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  
  // Data state
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<any>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Filter state
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  // Dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);
  
  // Bulk operation dialogs
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkMoveDialogOpen, setIsBulkMoveDialogOpen] = useState(false);
  const [isBulkExportDialogOpen, setIsBulkExportDialogOpen] = useState(false);
  const [isBulkRenameDialogOpen, setIsBulkRenameDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const [isBulkPermanentDeleteDialogOpen, setIsBulkPermanentDeleteDialogOpen] = useState(false);
  const [isBulkCopyDialogOpen, setIsBulkCopyDialogOpen] = useState(false);
  const [isBulkShareDialogOpen, setIsBulkShareDialogOpen] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);

  // Selected items for actions
  const [selectedFileForAction, setSelectedFileForAction] = useState<any>(null);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<any>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<any>(null);

  // Debounced search
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Load files from API
  const loadFiles = useCallback(async (options: any = {}) => {
    if (!session?.accessToken) return;

    try {
      setError(null);
      if (!options.silent) setLoading(true);

      const params = new URLSearchParams({
        viewStatus: activeView,
        parentId: currentFolderId,
        orderBy: `${sortBy} ${sortOrder}`,
        ...(debouncedSearchQuery && { query: debouncedSearchQuery }),
        ...(fileTypeFilter.length > 0 && { fileType: fileTypeFilter.join(',') }),
        ...(advancedFilters.sizeRange?.min && { minSize: advancedFilters.sizeRange.min.toString() }),
        ...(advancedFilters.sizeRange?.max && { maxSize: advancedFilters.sizeRange.max.toString() }),
        ...(advancedFilters.owner && { owner: advancedFilters.owner }),
        ...(advancedFilters.createdDateRange?.from && { 
          createdAfter: advancedFilters.createdDateRange.from.toISOString() 
        }),
        ...(advancedFilters.createdDateRange?.to && { 
          createdBefore: advancedFilters.createdDateRange.to.toISOString() 
        }),
        ...(advancedFilters.modifiedDateRange?.from && { 
          modifiedAfter: advancedFilters.modifiedDateRange.from.toISOString() 
        }),
        ...(advancedFilters.modifiedDateRange?.to && { 
          modifiedBefore: advancedFilters.modifiedDateRange.to.toISOString() 
        })
      });

      // Check cache first
      const cacheKey = driveCache.generateDriveKey({
        viewStatus: activeView,
        parentId: currentFolderId,
        query: debouncedSearchQuery,
        fileType: fileTypeFilter.join(','),
        orderBy: `${sortBy} ${sortOrder}`,
        userId: session?.user?.email || 'unknown'
      });

      const cachedData = driveCache.get<any>(cacheKey);
      if (cachedData && !options.forceRefresh) {
        setFiles(cachedData.files || []);
        setFolders(cachedData.folders || []);
        setCurrentFolder(cachedData.currentFolder);
        setLoading(false);
        return;
      }

      // Use request deduplication
      const data = await requestDeduplicator.deduplicate(
        cacheKey,
        async () => {
          const response = await fetch(`/api/drive/files?${params}`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response.json();
        }
      );

      if (data.error) {
        throw new Error(data.error);
      }

      setFiles(data.files || []);
      setFolders(data.folders || []);
      setCurrentFolder(data.currentFolder);

      // Cache the result
      driveCache.set(cacheKey, data, 5);

    } catch (error) {
      console.error('Failed to load files:', error);
      setError(error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    session?.accessToken,
    activeView,
    currentFolderId,
    sortBy,
    sortOrder,
    debouncedSearchQuery,
    fileTypeFilter,
    advancedFilters
  ]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFiles({ forceRefresh: true, silent: false });
  }, [loadFiles]);

  // Search handler
  const handleSearch = useCallback(() => {
    loadFiles({ forceRefresh: true });
  }, [loadFiles]);

  // View change handler
  const handleViewChange = useCallback((view: string) => {
    setActiveView(view);
    setSelectedItems(new Set());
    setIsSelectMode(false);
  }, []);

  // Folder navigation
  const handleFolderNavigate = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedItems(new Set());
    setIsSelectMode(false);
  }, []);

  // File type filter toggle
  const handleFileTypeToggle = useCallback((type: string) => {
    setFileTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveView('all');
    setFileTypeFilter([]);
    setAdvancedFilters({});
    setSearchQuery('');
  }, []);

  // Item selection
  const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    const allIds = [...files, ...folders].map(item => item.id);
    setSelectedItems(new Set(allIds));
  }, [files, folders]);

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Get selected items data
  const getSelectedItemsData = useCallback(() => {
    const allItems = [...files, ...folders];
    return Array.from(selectedItems).map(id => {
      const item = allItems.find(i => i.id === id);
      return item ? {
        ...item,
        type: item.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file'
      } : null;
    }).filter(Boolean);
  }, [selectedItems, files, folders]);

  // Handle item actions
  const handleItemAction = useCallback((action: string, item: any) => {
    setSelectedFileForAction(item);
    
    switch (action) {
      case 'rename':
        setIsRenameDialogOpen(true);
        break;
      case 'move':
        setIsMoveDialogOpen(true);
        break;
      case 'copy':
        setIsCopyDialogOpen(true);
        break;
      case 'delete':
        setSelectedItemForDelete(item);
        setIsPermanentDeleteDialogOpen(true);
        break;
      case 'details':
        setSelectedItemForDetails(item);
        setIsDetailsDialogOpen(true);
        break;
      case 'preview':
        setSelectedFileForPreview(item);
        setIsPreviewDialogOpen(true);
        break;
    }
  }, []);

  // Bulk download handler
  const handleBulkDownload = useCallback(async () => {
    const selectedData = getSelectedItemsData();
    const downloadableFiles = selectedData.filter(item => item.type === 'file');
    
    if (downloadableFiles.length === 0) {
      toast.error('No downloadable files selected');
      return;
    }

    toast.success(`Starting download of ${downloadableFiles.length} file(s)`);
    
    // Process downloads in parallel batches
    const batchSize = 3;
    for (let i = 0; i < downloadableFiles.length; i += batchSize) {
      const batch = downloadableFiles.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (file) => {
          try {
            const link = document.createElement('a');
            link.href = `https://drive.google.com/uc?export=download&id=${file.id}`;
            link.download = file.name;
            link.click();
          } catch (error) {
            console.error('Download failed for:', file.name, error);
          }
        })
      );
      
      // Small delay between batches
      if (i + batchSize < downloadableFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [getSelectedItemsData]);

  // Get file actions based on permissions
  const getFileActions = useCallback((file: any, view: string) => {
    const isOwner = file.ownedByMe === true;
    const isShared = file.shared;
    const isTrashed = file.trashed;
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

    return {
      canRename: isOwner && !isTrashed,
      canMove: isOwner && !isTrashed,
      canCopy: !isTrashed,
      canShare: !isTrashed,
      canDelete: isOwner && !isShared && !isTrashed,
      canRestore: isTrashed && isOwner,
      canPermanentDelete: isTrashed && isOwner,
      canDownload: !isFolder && !isTrashed,
      canPreview: !isFolder && !isTrashed
    };
  }, []);

  // Sorted files and folders
  const { sortedFiles, sortedFolders } = useMemo(() => {
    const sortFunction = (a: any, b: any) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle special cases
      if (sortBy === 'modifiedTime' || sortBy === 'createdTime') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortBy === 'size') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    };

    return {
      sortedFiles: [...files].sort(sortFunction),
      sortedFolders: [...folders].sort(sortFunction)
    };
  }, [files, folders, sortBy, sortOrder]);

  // Load files on mount and when dependencies change
  useEffect(() => {
    if (session?.accessToken) {
      loadFiles();
    }
  }, [loadFiles, session?.accessToken]);

  // Handle URL parameters
  useEffect(() => {
    const folder = searchParams.get('folder');
    const view = searchParams.get('view');
    const search = searchParams.get('search');

    if (folder && folder !== currentFolderId) {
      setCurrentFolderId(folder);
    }
    
    if (view && view !== activeView) {
      setActiveView(view);
    }
    
    if (search && search !== searchQuery) {
      setSearchQuery(search);
    }
  }, [searchParams, currentFolderId, activeView, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Android-style Sticky Toolbar */}
      <DriveToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefresh}
        onUpload={() => setIsUploadDialogOpen(true)}
        onCreateFolder={() => setIsCreateFolderDialogOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedItems.size}
        onBulkDownload={selectedItems.size > 0 ? handleBulkDownload : undefined}
        onBulkDelete={selectedItems.size > 0 ? () => setIsBulkDeleteDialogOpen(true) : undefined}
        onBulkShare={selectedItems.size > 0 ? () => setIsBulkShareDialogOpen(true) : undefined}
        onShowFilters={() => setIsFiltersDialogOpen(true)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(newSortBy, newSortOrder) => {
          setSortBy(newSortBy);
          setSortOrder(newSortOrder);
        }}
        isLoading={loading || refreshing}
      />

      {/* Enhanced Search Bar - Expandable */}
      <div id="search-expanded" style={{ display: 'none' }} className="px-2 sm:px-0 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        </div>
      </div>

      {/* File Breadcrumb Navigation */}
      <div className="px-2 sm:px-0">
        <FileBreadcrumb 
          currentFolder={currentFolder} 
          onNavigate={handleFolderNavigate} 
        />
      </div>

      {/* File Category Badges */}
      <div className="px-2 sm:px-0">
        <FileCategoryBadges 
          files={files} 
          folders={folders}
          onCategoryClick={(category: string) => {
            // Handle category filter
            console.log('Category clicked:', category);
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="px-2 sm:px-0 flex-1 min-h-0">
        {loading ? (
          <DriveGridSkeleton />
        ) : error ? (
          <DriveErrorDisplay 
            error={error} 
            onRetry={handleRefresh}
            onReconnect={() => window.location.reload()}
          />
        ) : (sortedFiles.length === 0 && sortedFolders.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery ? 
                `No files match "${searchQuery}". Try a different search term or clear filters.` :
                "This folder is empty. Upload files or create folders to get started."
              }
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              <Button variant="outline" onClick={() => setIsCreateFolderDialogOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        ) : (
          <FileList
            files={sortedFiles}
            folders={sortedFolders}
            viewMode={viewMode}
            selectedItems={selectedItems}
            isSelectMode={isSelectMode}
            onItemSelect={handleItemSelect}
            onItemAction={handleItemAction}
            onFolderNavigate={handleFolderNavigate}
            currentFolderId={currentFolderId}
            activeView={activeView}
            onPreview={(file: any) => {
              setSelectedFileForPreview(file);
              setIsPreviewDialogOpen(true);
            }}
          />
        )}
      </div>

      {/* Dialogs */}
      <Suspense fallback={null}>
        <FileUploadDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          onUploadComplete={() => {
            handleRefresh();
          }}
        />
        
        <CreateFolderDialog
          isOpen={isCreateFolderDialogOpen}
          onClose={() => setIsCreateFolderDialogOpen(false)}
          onCreateComplete={() => {
            handleRefresh();
          }}
          currentFolderId={currentFolderId}
        />

        <FileRenameDialog
          isOpen={isRenameDialogOpen}
          onClose={() => setIsRenameDialogOpen(false)}
          file={selectedFileForAction}
          onRenameComplete={() => {
            handleRefresh();
          }}
        />

        <FileMoveDialog
          isOpen={isMoveDialogOpen}
          onClose={() => setIsMoveDialogOpen(false)}
          file={selectedFileForAction}
          onMoveComplete={() => {
            handleRefresh();
          }}
          currentFolderId={currentFolderId}
        />

        <FileCopyDialog
          isOpen={isCopyDialogOpen}
          onClose={() => setIsCopyDialogOpen(false)}
          file={selectedFileForAction}
          onCopyComplete={() => {
            handleRefresh();
          }}
          currentFolderId={currentFolderId}
        />

        <PermanentDeleteDialog
          isOpen={isPermanentDeleteDialogOpen}
          onClose={() => setIsPermanentDeleteDialogOpen(false)}
          item={selectedItemForDelete}
          onDeleteComplete={() => {
            handleRefresh();
          }}
        />

        <FileDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          item={selectedItemForDetails}
        />

        <FilePreviewDialog
          isOpen={isPreviewDialogOpen}
          onClose={() => setIsPreviewDialogOpen(false)}
          file={selectedFileForPreview}
        />

        {/* Bulk Operations Dialogs */}
        <BulkDeleteDialog
          isOpen={isBulkDeleteDialogOpen}
          onClose={() => setIsBulkDeleteDialogOpen(false)}
          selectedItems={getSelectedItemsData()}
          onDeleteComplete={() => {
            handleRefresh();
            deselectAll();
            setIsSelectMode(false);
          }}
        />

        <BulkMoveDialog
          isOpen={isBulkMoveDialogOpen}
          onClose={() => setIsBulkMoveDialogOpen(false)}
          selectedItems={getSelectedItemsData()}
          onMoveComplete={() => {
            handleRefresh();
            deselectAll();
            setIsSelectMode(false);
          }}
          currentFolderId={currentFolderId}
        />

        <BulkExportDialog
          isOpen={isBulkExportDialogOpen}
          onClose={() => setIsBulkExportDialogOpen(false)}
          selectedItems={getSelectedItemsData()}
          onExportComplete={() => {
            deselectAll();
            setIsSelectMode(false);
          }}
        />

        <BulkRenameDialog
          isOpen={isBulkRenameDialogOpen}
          onClose={() => setIsBulkRenameDialogOpen(false)}
          selectedItems={getSelectedItemsData()}
          onRenameComplete={() => {
            handleRefresh();
            deselectAll();
            setIsSelectMode(false);
          }}
        />

        <BulkRestoreDialog
          isOpen={isBulkRestoreDialogOpen}
          onClose={() => setIsBulkRestoreDialogOpen(false)}
          selectedItems={getSelectedItemsData()}
          onRestoreComplete={() => {
            handleRefresh();
            deselectAll();
            setIsSelectMode(false);
          }}
        />

        <BulkPermanentDeleteDialog
          isOpen={isBulkPermanentDeleteDialogOpen}
          onClose={() => setIsBulkPermanentDeleteDialogOpen(false)}
          selectedItems={getSelectedItemsData()}
          onDeleteComplete={() => {
            handleRefresh();
            deselectAll();
            setIsSelectMode(false);
          }}
        />

        <BulkCopyDialog
          isOpen={isBulkCopyDialogOpen}
          onClose={() => setIsBulkCopyDialogOpen(false)}
          selectedItems={getSelectedItemsData()}
          onCopyComplete={() => {
            handleRefresh();
            deselectAll();
            setIsSelectMode(false);
          }}
          currentFolderId={currentFolderId}
        />

        <BulkShareDialog
          isOpen={isBulkShareDialogOpen}
          onClose={() => setIsBulkShareDialogOpen(false)}
          selectedItems={getSelectedItemsData()}
          onShareComplete={() => {
            deselectAll();
            setIsSelectMode(false);
          }}
        />

        {/* Mobile Bottom Sheets */}
        <MobileActionsBottomSheet
          open={isMobileActionsOpen}
          onOpenChange={setIsMobileActionsOpen}
          selectedItems={getSelectedItemsData()}
          onAction={(action: string) => {
            switch (action) {
              case 'download':
                handleBulkDownload();
                break;
              case 'rename':
                setIsBulkRenameDialogOpen(true);
                break;
              case 'move':
                setIsBulkMoveDialogOpen(true);
                break;
              case 'copy':
                setIsBulkCopyDialogOpen(true);
                break;
              case 'share':
                setIsBulkShareDialogOpen(true);
                break;
              case 'delete':
                setIsBulkDeleteDialogOpen(true);
                break;
              case 'permanent-delete':
                setIsBulkPermanentDeleteDialogOpen(true);
                break;
              case 'restore':
                setIsBulkRestoreDialogOpen(true);
                break;
              case 'export':
                setIsBulkExportDialogOpen(true);
                break;
            }
            setIsMobileActionsOpen(false);
          }}
          onClearSelection={() => {
            deselectAll();
            setIsSelectMode(false);
          }}
          activeView={activeView}
        />

        <FiltersDialog
          isOpen={isFiltersDialogOpen}
          onClose={() => setIsFiltersDialogOpen(false)}
          activeView={activeView}
          onViewChange={handleViewChange}
          fileTypeFilter={fileTypeFilter}
          onFileTypeFilterChange={setFileTypeFilter}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
          onClearFilters={clearAllFilters}
        />
      </Suspense>
    </div>
  );
}