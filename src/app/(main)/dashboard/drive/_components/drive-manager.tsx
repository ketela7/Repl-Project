"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FolderPlus, 
  Search, 
  MoreVertical,
  Download,
  Trash2,
  Share,
  Edit,
  Eye,
  RefreshCw,
  Move,
  Copy,
  X,
  AlertTriangle,
  Info,
  Grid3X3,
  List,
  Settings,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckSquare,
  Folder,
  Star
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { 
  Checkbox 
} from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

// Import from utils
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { 
  formatFileSize, 
  formatDriveFileDate, 
  isPreviewable, 
  getFileActions,
  normalizeFileSize,
  getSizeMultiplier,
  isFileSizeInRange
} from '@/lib/google-drive/utils';
import { formatFileTime, getRelativeTime } from '@/lib/timezone';
import { useTimezoneContext } from '@/components/timezone-provider';
import { FileIcon } from '@/components/file-icon';
import { successToast, errorToast, warningToast, infoToast, loadingToast, toastUtils } from '@/lib/toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Component imports
import { FileUploadDialog } from './file-upload-dialog';
import { CreateFolderDialog } from './create-folder-dialog';
import { FileRenameDialog } from './file-rename-dialog';
import { FileMoveDialog } from './file-move-dialog';
import { FileCopyDialog } from './file-copy-dialog';
import { FileBreadcrumb } from './file-breadcrumb';
import { DriveConnectionCard } from './drive-connection-card';
import { PermanentDeleteDialog } from './permanent-delete-dialog';
import { FileDetailsDialog } from './file-details-dialog';
import { FilePreviewDialog } from './file-preview-dialog';
import { DriveGridSkeleton } from './drive-skeleton';
import { BulkDeleteDialog } from './bulk-delete-dialog';
import { BulkMoveDialog } from './bulk-move-dialog';
import { BulkExportDialog } from './bulk-export-dialog';
import { BulkRenameDialog } from './bulk-rename-dialog';
import { BulkRestoreDialog } from './bulk-restore-dialog';
import { BulkPermanentDeleteDialog } from './bulk-permanent-delete-dialog';
import { BulkCopyDialog } from './bulk-copy-dialog';
import { DriveFiltersSidebar } from './drive-filters-sidebar';
import { FileThumbnailPreview } from '@/components/ui/file-thumbnail-preview';
import { FileShareDialog } from './file-share-dialog';
import { BulkShareDialog } from './bulk-share-dialog';
import { MobileActionsBottomSheet } from './mobile-actions-bottom-sheet';
import { FiltersDialog } from './filters-dialog';
import { DriveToolbar } from './drive-toolbar';
import { DriveDataView } from './drive-data-view';
import { DriveErrorDisplay } from '@/components/drive-error-display';
import { DrivePermissionRequired } from '@/components/drive-permission-required';
import { FileCategoryBadges } from '@/components/file-category-badges';

// Unified item type
type DriveItem = (DriveFile | DriveFolder) & {
  itemType?: 'file' | 'folder';
};

// Helper function to determine if item is folder
const isFolder = (item: DriveItem): boolean => {
  return item.mimeType === 'application/vnd.google-apps.folder';
};

export function DriveManager() {
  // Core state - unified items
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [driveAccessError, setDriveAccessError] = useState<any>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  // UI state
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { timezone, isLoading: timezoneLoading } = useTimezoneContext();

  // Search state - no debounce, only on submit
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state - consolidated
  const [filters, setFilters] = useState({
    activeView: 'all' as 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash',
    fileTypeFilter: [] as string[],
    advancedFilters: {
      sizeRange: { unit: 'MB' as 'B' | 'KB' | 'MB' | 'GB' },
      sortBy: 'modified' as 'name' | 'modified' | 'created' | 'size',
      sortOrder: 'desc' as 'asc' | 'desc'
    }
  });

  // Table state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    size: true,
    owners: false,
    mimeType: false,
    createdTime: false,
    modifiedTime: false,
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'id' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType' | 'owners';
    direction: 'asc' | 'desc';
  } | null>(null);

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Dialog states - consolidated
  const [dialogs, setDialogs] = useState({
    upload: false,
    createFolder: false,
    rename: false,
    move: false,
    copy: false,
    permanentDelete: false,
    details: false,
    preview: false,
    delete: false,
    share: false,
    bulkDelete: false,
    bulkMove: false,
    bulkCopy: false,
    bulkExport: false,
    bulkRename: false,
    bulkRestore: false,
    bulkPermanentDelete: false,
    bulkShare: false,
    mobileActions: false,
    mobileFilters: false
  });

  // Selected items for actions
  const [selectedFileForAction, setSelectedFileForAction] = useState<{ id: string; name: string; parentId?: string } | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | null>(null);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [selectedItemForShare, setSelectedItemForShare] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);

  // Progress states
  const [bulkOperationProgress, setBulkOperationProgress] = useState<{
    isRunning: boolean;
    current: number;
    total: number;
    operation: string;
  }>({ isRunning: false, current: 0, total: 0, operation: '' });

  const [singleOperationProgress, setSingleOperationProgress] = useState<{
    isRunning: boolean;
    operation: string;
  }>({ isRunning: false, operation: '' });

  // Refs for optimization
  const lastFetchCallRef = useRef<string>('');
  const fetchThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestsRef = useRef<Set<string>>(new Set());

  // Helper functions
  const openDialog = (dialogName: keyof typeof dialogs) => {
    setDialogs(prev => ({ ...prev, [dialogName]: true }));
  };

  const closeDialog = (dialogName: keyof typeof dialogs) => {
    setDialogs(prev => ({ ...prev, [dialogName]: false }));
  };

  const clearAllFilters = useCallback(() => {
    setFilters({
      activeView: 'all',
      fileTypeFilter: [],
      advancedFilters: {
        sizeRange: { unit: 'MB' },
        sortBy: 'modified',
        sortOrder: 'desc'
      }
    });
    setSearchQuery('');
    setTimeout(() => {
      fetchFiles(currentFolderId || undefined, undefined);
    }, 0);
  }, [currentFolderId]);

  const applyFilters = useCallback(() => {
    fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined);
  }, [currentFolderId, searchQuery, filters]);

  const handleFilter = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      advancedFilters: {
        ...prev.advancedFilters,
        ...newFilters.advancedFilters
      }
    }));
  }, []);

  // Check if any filters are active
  const hasActiveFilters = filters.activeView !== 'all' || 
                          filters.fileTypeFilter.length > 0 || 
                          searchQuery.trim() !== '' ||
                          (filters.advancedFilters.sizeRange?.min) ||
                          (filters.advancedFilters.sizeRange?.max) ||
                          (filters.advancedFilters.createdDateRange?.from) ||
                          (filters.advancedFilters.createdDateRange?.to) ||
                          (filters.advancedFilters.modifiedDateRange?.from) ||
                          (filters.advancedFilters.modifiedDateRange?.to) ||
                          (filters.advancedFilters.owner?.trim());

  // Sorting functionality
  const handleSort = (key: 'name' | 'id' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType' | 'owners') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  // Optimized sorting - single operation for all items
  const sortedItems = useMemo(() => {
    if (!sortConfig) {
      return [...items].sort((a, b) => {
        // Folders first, then files
        const aIsFolder = isFolder(a);
        const bIsFolder = isFolder(b);
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return 0;
      });
    }

    return [...items].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue: any, bValue: any;

      switch (key) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'id':
          aValue = (a.id || '').toLowerCase();
          bValue = (b.id || '').toLowerCase();
          break;
        case 'size':
          aValue = isFolder(a) ? 0 : normalizeFileSize(a.size);
          bValue = isFolder(b) ? 0 : normalizeFileSize(b.size);
          break;
        case 'modifiedTime':
          aValue = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
          bValue = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
          break;
        case 'createdTime':
          aValue = a.createdTime ? new Date(a.createdTime).getTime() : 0;
          bValue = b.createdTime ? new Date(b.createdTime).getTime() : 0;
          break;
        case 'mimeType':
          aValue = isFolder(a) ? 'folder' : (a.mimeType || '').toLowerCase();
          bValue = isFolder(b) ? 'folder' : (b.mimeType || '').toLowerCase();
          break;
        case 'owners':
          aValue = (a.owners?.[0]?.displayName || a.owners?.[0]?.emailAddress || '').toLowerCase();
          bValue = (b.owners?.[0]?.displayName || b.owners?.[0]?.emailAddress || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue === null || aValue === undefined || aValue === '' || aValue === '-') aValue = key === 'size' ? 0 : '';
      if (bValue === null || bValue === undefined || bValue === '' || bValue === '-') bValue = key === 'size' ? 0 : '';

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig]);

  // Derived data for backward compatibility
  const files = useMemo(() => sortedItems.filter(item => !isFolder(item)) as DriveFile[], [sortedItems]);
  const folders = useMemo(() => sortedItems.filter(item => isFolder(item)) as DriveFolder[], [sortedItems]);

  // Convert selected items for bulk operations
  const selectedItemsWithDetails = useMemo(() => {
    return Array.from(selectedItems).map(itemId => {
      const item = items.find(i => i.id === itemId);
      return {
        id: itemId,
        name: item?.name || 'Unknown',
        type: item && isFolder(item) ? 'folder' as const : 'file' as const,
        mimeType: item?.mimeType
      };
    });
  }, [selectedItems, items]);

  // API call function
  const fetchFiles = useCallback(async (folderId?: string, searchQuery?: string, pageToken?: string) => {
    try {
      if (!folderId && folderId !== '') folderId = currentFolderId || undefined;
      
      const callId = `${folderId || 'root'}-${searchQuery || ''}-${pageToken || ''}`;
      if (activeRequestsRef.current.has(callId)) {
        return;
      }

      if (!pageToken) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      activeRequestsRef.current.add(callId);

      const params = new URLSearchParams();
      if (folderId) params.append('folderId', folderId);
      if (searchQuery) params.append('search', searchQuery);
      if (pageToken) params.append('pageToken', pageToken);
      
      // Add filter params
      if (filters.activeView !== 'all') {
        params.append('viewStatus', filters.activeView);
      }
      if (filters.fileTypeFilter.length > 0) {
        params.append('fileType', filters.fileTypeFilter.join(','));
      }
      if (filters.advancedFilters.sortBy) {
        params.append('sortBy', filters.advancedFilters.sortBy);
      }
      if (filters.advancedFilters.sortOrder) {
        params.append('sortOrder', filters.advancedFilters.sortOrder);
      }

      const response = await fetch(`/api/drive/files?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsReauth(true);
          throw new Error('Authentication required');
        }
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Unify files and folders into items array
      const newItems: DriveItem[] = [
        ...(data.folders || []).map((folder: DriveFolder) => ({ ...folder, itemType: 'folder' as const })),
        ...(data.files || []).map((file: DriveFile) => ({ ...file, itemType: 'file' as const }))
      ];

      if (pageToken) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }

      setNextPageToken(data.nextPageToken || null);
      setHasAccess(true);
      setDriveAccessError(null);

    } catch (error: any) {
      console.error('Error fetching files:', error);
      
      if (error.message?.includes('Authentication') || error.message?.includes('401')) {
        setNeedsReauth(true);
        setDriveAccessError(error);
      } else {
        setDriveAccessError(error);
        errorToast.apiError('Failed to load files', error);
      }
      setHasAccess(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      activeRequestsRef.current.delete(`${folderId || 'root'}-${searchQuery || ''}-${pageToken || ''}`);
    }
  }, [currentFolderId, filters]);

  // Search submit handler - no debounce
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined);
  }, [fetchFiles, currentFolderId, searchQuery]);

  // Initial load and folder navigation
  useEffect(() => {
    fetchFiles();
  }, []);

  // Navigation handlers
  const handleFolderClick = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedItems(new Set());
    fetchFiles(folderId);
  }, [fetchFiles]);

  const handleBackToParent = useCallback(() => {
    setCurrentFolderId(null);
    setSelectedItems(new Set());
    fetchFiles();
  }, [fetchFiles]);

  // Selection handlers
  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  }, [items, selectedItems.size]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFiles(currentFolderId || undefined, searchQuery.trim() || undefined);
  }, [fetchFiles, currentFolderId, searchQuery]);

  if (loading && items.length === 0) {
    return <DriveGridSkeleton />;
  }

  if (hasAccess === false && driveAccessError) {
    if (needsReauth) {
      return <DrivePermissionRequired error={driveAccessError} onRetry={handleRefresh} />;
    }
    return <DriveErrorDisplay error={driveAccessError} onRetry={handleRefresh} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden">
        {!isMobile && (
          <DriveFiltersSidebar
            activeView={filters.activeView}
            fileTypeFilter={filters.fileTypeFilter}
            advancedFilters={filters.advancedFilters}
            onViewChange={(view) => handleFilter({ activeView: view })}
            onFileTypeFilterChange={(types) => handleFilter({ fileTypeFilter: types })}
            onAdvancedFiltersChange={(advanced) => handleFilter({ advancedFilters: advanced })}
            onClearFilters={clearAllFilters}
            onApplyFilters={applyFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <DriveToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectMode={isSelectMode}
            onSelectModeChange={setIsSelectMode}
            selectedCount={selectedItems.size}
            totalCount={items.length}
            onSelectAll={handleSelectAll}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onUpload={() => openDialog('upload')}
            onCreateFolder={() => openDialog('createFolder')}
            onBulkDelete={() => openDialog('bulkDelete')}
            onBulkMove={() => openDialog('bulkMove')}
            onBulkCopy={() => openDialog('bulkCopy')}
            onBulkShare={() => openDialog('bulkShare')}
            onFiltersOpen={() => openDialog('mobileFilters')}
            filters={filters}
            onFilterChange={handleFilter}
            onApplyFilters={applyFilters}
            onClearFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            files={files}
            folders={folders}
          />

          {currentFolderId && (
            <FileBreadcrumb
              currentFolderId={currentFolderId}
              onNavigate={(folderId) => folderId ? handleFolderClick(folderId) : handleBackToParent()}
              onBackToRoot={handleBackToParent}
            />
          )}

          <FileCategoryBadges
            files={files}
            folders={folders}
            onCategoryClick={(category) => {
              handleFilter({ fileTypeFilter: [category] });
              applyFilters();
            }}
            className="mb-4 px-4"
          />

          <DriveDataView
            items={sortedItems}
            viewMode={viewMode}
            isSelectMode={isSelectMode}
            selectedItems={selectedItems}
            visibleColumns={visibleColumns}
            sortConfig={sortConfig}
            onSelectItem={handleSelectItem}
            onFolderClick={handleFolderClick}
            onColumnsChange={setVisibleColumns}
            onItemAction={(action: string, item: DriveItem) => {
              switch (action) {
                case 'preview':
                  setSelectedFileForPreview(item as DriveFile);
                  openDialog('preview');
                  break;
                case 'download':
                  window.open(`https://drive.google.com/uc?export=download&id=${item.id}`, '_blank');
                  break;
                case 'share':
                  setSelectedItemForShare({ id: item.id, name: item.name, type: isFolder(item) ? 'folder' : 'file' });
                  openDialog('share');
                  break;
                case 'rename':
                  setSelectedFileForAction({ id: item.id, name: item.name, parentId: item.parents?.[0] });
                  openDialog('rename');
                  break;
                case 'move':
                  setSelectedFileForAction({ id: item.id, name: item.name, parentId: item.parents?.[0] });
                  openDialog('move');
                  break;
                case 'copy':
                  setSelectedFileForAction({ id: item.id, name: item.name, parentId: item.parents?.[0] });
                  openDialog('copy');
                  break;
                case 'delete':
                  setSelectedItemForDelete({ id: item.id, name: item.name, type: isFolder(item) ? 'folder' : 'file' });
                  openDialog('delete');
                  break;
                case 'details':
                  setSelectedItemForDetails({ id: item.id, name: item.name, type: isFolder(item) ? 'folder' : 'file' });
                  openDialog('details');
                  break;
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
          closeDialog('upload');
          handleRefresh();
        }}
      />

      <CreateFolderDialog
        isOpen={dialogs.createFolder}
        onClose={() => closeDialog('createFolder')}
        currentFolderId={currentFolderId}
        onFolderCreated={() => {
          closeDialog('createFolder');
          handleRefresh();
        }}
      />

      {selectedFileForAction && (
        <>
          <FileRenameDialog
            open={dialogs.rename}
            onOpenChange={(open) => {
              if (!open) {
                closeDialog('rename');
                setSelectedFileForAction(null);
              }
            }}
            fileId={selectedFileForAction.id}
            fileName={selectedFileForAction.name}
            onConfirm={async (newName: string) => {
              closeDialog('rename');
              setSelectedFileForAction(null);
              handleRefresh();
            }}
          />

          <FileMoveDialog
            isOpen={dialogs.move}
            onClose={() => {
              closeDialog('move');
              setSelectedFileForAction(null);
            }}
            fileName={selectedFileForAction.name}
            currentParentId={selectedFileForAction.parentId || null}
            onMove={async (newParentId: string) => {
              closeDialog('move');
              setSelectedFileForAction(null);
              handleRefresh();
            }}
          />

          <FileCopyDialog
            isOpen={dialogs.copy}
            onClose={() => {
              closeDialog('copy');
              setSelectedFileForAction(null);
            }}
            fileName={selectedFileForAction.name}
            currentParentId={selectedFileForAction.parentId || null}
            onCopy={async (newName: string, parentId: string) => {
              closeDialog('copy');
              setSelectedFileForAction(null);
              handleRefresh();
            }}
          />
        </>
      )}

      {selectedFileForPreview && (
        <FilePreviewDialog
          open={dialogs.preview}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog('preview');
              setSelectedFileForPreview(null);
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
              closeDialog('delete');
              setSelectedItemForDelete(null);
            }
          }}
          itemId={selectedItemForDelete.id}
          itemName={selectedItemForDelete.name}
          itemType={selectedItemForDelete.type}
          onDeleted={() => {
            closeDialog('delete');
            setSelectedItemForDelete(null);
            handleRefresh();
          }}
        />
      )}

      {selectedItemForDetails && (
        <FileDetailsDialog
          isOpen={dialogs.details}
          onClose={() => {
            closeDialog('details');
            setSelectedItemForDetails(null);
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
              closeDialog('share');
              setSelectedItemForShare(null);
            }
          }}
          file={{
            id: selectedItemForShare.id,
            name: selectedItemForShare.name,
            mimeType: selectedItemForShare.type === 'folder' ? 'application/vnd.google-apps.folder' : 'application/octet-stream'
          }}
        />
      )}

      {/* Bulk operation dialogs */}
      <BulkDeleteDialog
        isOpen={dialogs.bulkDelete}
        onClose={() => closeDialog('bulkDelete')}
        selectedItems={selectedItemsWithDetails}
        onConfirm={() => {
          closeDialog('bulkDelete');
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkMoveDialog
        isOpen={dialogs.bulkMove}
        onClose={() => closeDialog('bulkMove')}
        selectedItems={selectedItemsWithDetails}
        onConfirm={(targetFolderId: string) => {
          closeDialog('bulkMove');
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkCopyDialog
        isOpen={dialogs.bulkCopy}
        onClose={() => closeDialog('bulkCopy')}
        selectedItems={selectedItemsWithDetails}
        onConfirm={(targetFolderId: string) => {
          closeDialog('bulkCopy');
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkShareDialog
        open={dialogs.bulkShare}
        onOpenChange={(open) => {
          if (!open) closeDialog('bulkShare');
        }}
        selectedItems={selectedItemsWithDetails}
      />

      <BulkExportDialog
        isOpen={dialogs.bulkExport}
        onClose={() => closeDialog('bulkExport')}
        selectedItems={selectedItemsWithDetails}
        onConfirm={(format) => {
          closeDialog('bulkExport');
        }}
      />

      <BulkRenameDialog
        isOpen={dialogs.bulkRename}
        onClose={() => closeDialog('bulkRename')}
        selectedItems={selectedItemsWithDetails}
        onConfirm={() => {
          closeDialog('bulkRename');
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkRestoreDialog
        isOpen={dialogs.bulkRestore}
        onClose={() => closeDialog('bulkRestore')}
        selectedItems={selectedItemsWithDetails}
        onConfirm={() => {
          closeDialog('bulkRestore');
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkPermanentDeleteDialog
        isOpen={dialogs.bulkPermanentDelete}
        onClose={() => closeDialog('bulkPermanentDelete')}
        selectedItems={selectedItemsWithDetails}
        onConfirm={() => {
          closeDialog('bulkPermanentDelete');
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      {/* Mobile components */}
      <MobileActionsBottomSheet
        open={dialogs.mobileActions}
        onOpenChange={(open) => {
          if (!open) closeDialog('mobileActions');
        }}
        selectedItems={selectedItemsWithDetails}
        selectedCount={selectedItems.size}
        onBulkDelete={() => {
          closeDialog('mobileActions');
          openDialog('bulkDelete');
        }}
        onBulkMove={() => {
          closeDialog('mobileActions');
          openDialog('bulkMove');
        }}
        onBulkCopy={() => {
          closeDialog('mobileActions');
          openDialog('bulkCopy');
        }}
        onBulkShare={() => {
          closeDialog('mobileActions');
          openDialog('bulkShare');
        }}
        onBulkDownload={() => {
          closeDialog('mobileActions');
        }}
        onBulkRename={() => {
          closeDialog('mobileActions');
          openDialog('bulkRename');
        }}
        onBulkExport={() => {
          closeDialog('mobileActions');
          openDialog('bulkExport');
        }}
        onDeselectAll={() => {
          setSelectedItems(new Set());
          closeDialog('mobileActions');
        }}
      />

      <FiltersDialog
        open={dialogs.mobileFilters}
        onOpenChange={(open) => {
          if (!open) closeDialog('mobileFilters');
        }}
        currentFilters={filters}
        onFilterChange={handleFilter}
        onClearFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Progress indicators */}
      {bulkOperationProgress.isRunning && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">{bulkOperationProgress.operation}</div>
          </div>
          <Progress 
            value={(bulkOperationProgress.current / bulkOperationProgress.total) * 100} 
            className="w-64 mt-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {bulkOperationProgress.current} of {bulkOperationProgress.total}
          </div>
        </div>
      )}

      {singleOperationProgress.isRunning && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <div className="text-sm font-medium">{singleOperationProgress.operation}</div>
          </div>
        </div>
      )}
    </div>
  );
}