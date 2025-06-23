'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  Search,
  Filter,
  Grid3x3,
  List,
  Upload,
  FolderPlus,
  MoreVertical,
  Eye,
  Download,
  Edit,
  Move,
  Copy,
  Share,
  Info,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Home,
  Folder,
  Star,
  Clock,
  Users,
  Settings,
  X,
  Check,
  ArrowUpDown,
  SlidersHorizontal,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Code,
  Link,
  Calendar,
  Database,
  FileIcon as LucideFileIcon,
  Plus,
  Minus
} from "lucide-react";

// Table Components  
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Dropdown Menu Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Toggle Group Components
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

// Refactored components
import { DriveToolbar } from './drive-toolbar';
import { DriveDataView } from './drive-data-view';

// Feature Components
import { BreadcrumbNavigation } from './breadcrumb-navigation';
import { DriveGridSkeleton } from './drive-grid-skeleton';
import { FileUploadDialog } from './file-upload-dialog';
import { CreateFolderDialog } from './create-folder-dialog';
import { FileRenameDialog } from './file-rename-dialog';
import { FileDeleteDialog } from './file-delete-dialog';
import { FileDetailsDialog } from './file-details-dialog';
import { FileShareDialog } from './file-share-dialog';
import { FilePreviewDialog } from './file-preview-dialog';
import { BulkDeleteDialog } from './bulk-delete-dialog';
import { BulkPermanentDeleteDialog } from './bulk-permanent-delete-dialog';
import { BulkRestoreDialog } from './bulk-restore-dialog';
import { BulkRenameDialog } from './bulk-rename-dialog';
import { BulkExportDialog } from './bulk-export-dialog';
import { BulkMoveDialog } from './bulk-move-dialog';
import { BulkCopyDialog } from './bulk-copy-dialog';
import { BulkShareDialog } from './bulk-share-dialog';
import { MobileActionsBottomSheet } from './mobile-actions-bottom-sheet';
import { FiltersDialog } from './filters-dialog';

import { DriveErrorDisplay } from '@/components/drive-error-display';
import { DrivePermissionRequired } from '@/components/drive-permission-required';
import { FileIcon } from '@/components/file-icon';
import { FileThumbnailPreview } from './file-thumbnail-preview';

// Hooks and Utilities
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTimezone } from '@/hooks/use-timezone';
import { formatFileSize, formatFileTime, isPreviewable } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { driveCache } from '@/lib/cache';
import { requestDeduplicator } from '@/lib/request-deduplication';

// Types
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  createdTime: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
  parents?: string[];
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  trashed?: boolean;
  starred?: boolean;
  shared?: boolean;
  capabilities?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    canRename?: boolean;
    canCopy?: boolean;
    canMoveToTrash?: boolean;
    canRemoveChildren?: boolean;
  };
}

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  createdTime: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
  parents?: string[];
  trashed?: boolean;
  starred?: boolean;
  shared?: boolean;
  capabilities?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    canRename?: boolean;
    canCopy?: boolean;
    canMoveToTrash?: boolean;
    canAddChildren?: boolean;
    canRemoveChildren?: boolean;
  };
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
  id: boolean;
  size: boolean;
  mimeType: boolean;
  owners: boolean;
  createdTime: boolean;
  modifiedTime: boolean;
}

export function DriveManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const timezone = useTimezone();

  // Core state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeView, setActiveView] = useState<"all" | "my-drive" | "shared" | "starred" | "recent" | "trash">('my-drive');
  const [sortBy, setSortBy] = useState<'name' | 'modifiedTime' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkPermanentDeleteDialogOpen, setIsBulkPermanentDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const [isBulkRenameDialogOpen, setIsBulkRenameDialogOpen] = useState(false);
  const [isBulkExportDialogOpen, setIsBulkExportDialogOpen] = useState(false);
  const [isBulkMoveDialogOpen, setIsBulkMoveDialogOpen] = useState(false);
  const [isBulkCopyDialogOpen, setIsBulkCopyDialogOpen] = useState(false);
  const [isBulkShareDialogOpen, setIsBulkShareDialogOpen] = useState(false);

  // Mobile state
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Selected file state for dialogs
  const [selectedFileForRename, setSelectedFileForRename] = useState<DriveFile | DriveFolder | null>(null);
  const [selectedFileForDelete, setSelectedFileForDelete] = useState<DriveFile | DriveFolder | null>(null);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState<DriveFile | DriveFolder | null>(null);
  const [selectedFileForShare, setSelectedFileForShare] = useState<DriveFile | DriveFolder | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | DriveFolder | null>(null);

  // Table columns visibility
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    name: true,
    id: false,
    size: true,
    mimeType: true,
    owners: true,
    createdTime: false,
    modifiedTime: true,
  });

  // Pagination state
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initialize from URL parameters
  useEffect(() => {
    const view = searchParams.get('view') as typeof activeView;
    const folder = searchParams.get('folder');
    const search = searchParams.get('q');
    
    if (view && ['all', 'my-drive', 'shared', 'starred', 'recent', 'trash'].includes(view)) {
      setActiveView(view);
    }
    
    if (folder) {
      setCurrentFolderId(folder);
    }
    
    if (search) {
      setSearchQuery(search);
      setSubmittedSearchQuery(search);
    }
  }, [searchParams]);

  // Fetch files function with caching and deduplication
  const fetchFiles = useCallback(async (folderId?: string, resetData = true) => {
    if (!session?.accessToken) return;

    try {
      if (resetData) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Generate cache/deduplication key
      const cacheKey = driveCache.generateDriveKey({
        folderId: folderId || null,
        view: activeView,
        search: submittedSearchQuery,
        fileTypes: fileTypeFilter,
        advancedFilters,
        sortBy,
        sortOrder
      });

      // Check cache first
      const cached = driveCache.get(cacheKey);
      if (cached && resetData) {
        setFiles(cached.files || []);
        setFolders(cached.folders || []);
        setHasNextPage(cached.hasNextPage || false);
        setNextPageToken(cached.nextPageToken || null);
        setLoading(false);
        return;
      }

      // Use request deduplication
      const response = await requestDeduplicator.deduplicate(
        cacheKey,
        async () => {
          const params = new URLSearchParams({
            folderId: folderId || '',
            view: activeView,
            search: submittedSearchQuery || '',
            fileTypes: fileTypeFilter.join(','),
            sortBy,
            sortOrder,
            pageToken: resetData ? '' : (nextPageToken || ''),
            ...(advancedFilters.sizeRange?.min && { sizeMin: advancedFilters.sizeRange.min.toString() }),
            ...(advancedFilters.sizeRange?.max && { sizeMax: advancedFilters.sizeRange.max.toString() }),
            ...(advancedFilters.sizeRange?.unit && { sizeUnit: advancedFilters.sizeRange.unit }),
            ...(advancedFilters.createdDateRange?.from && { createdAfter: advancedFilters.createdDateRange.from.toISOString() }),
            ...(advancedFilters.createdDateRange?.to && { createdBefore: advancedFilters.createdDateRange.to.toISOString() }),
            ...(advancedFilters.modifiedDateRange?.from && { modifiedAfter: advancedFilters.modifiedDateRange.from.toISOString() }),
            ...(advancedFilters.modifiedDateRange?.to && { modifiedBefore: advancedFilters.modifiedDateRange.to.toISOString() }),
            ...(advancedFilters.owner && { owner: advancedFilters.owner }),
          });

          return fetch(`/api/drive/files?${params}`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
          });
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setHasPermission(false);
          return;
        }
        throw new Error(`Failed to fetch files: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Process files and folders
      const fileList = data.files.filter((item: DriveFile) => 
        item.mimeType !== 'application/vnd.google-apps.folder'
      );
      const folderList = data.files.filter((item: DriveFile) => 
        item.mimeType === 'application/vnd.google-apps.folder'
      );

      if (resetData) {
        setFiles(fileList);
        setFolders(folderList);
      } else {
        setFiles(prev => [...prev, ...fileList]);
        setFolders(prev => [...prev, ...folderList]);
      }

      setHasNextPage(data.hasNextPage || false);
      setNextPageToken(data.nextPageToken || null);

      // Cache the response for 5 minutes
      if (resetData) {
        driveCache.set(cacheKey, {
          files: fileList,
          folders: folderList,
          hasNextPage: data.hasNextPage || false,
          nextPageToken: data.nextPageToken || null
        }, 5);
      }

      // Update folder path for navigation
      if (folderId && data.folderPath) {
        setFolderPath(data.folderPath);
      } else if (!folderId) {
        setFolderPath([]);
      }

    } catch (error: any) {
      console.error('Error fetching files:', error);
      setError(error);
      
      if (error.message?.includes('403') || error.message?.includes('permission')) {
        setHasPermission(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [
    session?.accessToken,
    activeView,
    submittedSearchQuery,
    fileTypeFilter,
    advancedFilters,
    sortBy,
    sortOrder,
    nextPageToken
  ]);

  // Initial load and dependency changes
  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [fetchFiles, currentFolderId]);

  // Refresh function
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    driveCache.clear();
    fetchFiles(currentFolderId);
  }, [fetchFiles, currentFolderId]);

  // Load more function
  const loadMore = useCallback(() => {
    if (hasNextPage && !loadingMore) {
      fetchFiles(currentFolderId, false);
    }
  }, [fetchFiles, currentFolderId, hasNextPage, loadingMore]);

  // View change handler
  const handleViewChange = useCallback((view: typeof activeView) => {
    setActiveView(view);
    setCurrentFolderId(null);
    setSelectedItems(new Set());
    setIsSelectMode(false);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    params.delete('folder');
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // Folder navigation
  const handleFolderClick = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedItems(new Set());
    setIsSelectMode(false);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('folder', folderId);
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleFolderNavigation = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedItems(new Set());
    setIsSelectMode(false);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (folderId) {
      params.set('folder', folderId);
    } else {
      params.delete('folder');
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // Search handlers
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSearch = useCallback(() => {
    setSubmittedSearchQuery(searchQuery);
    setCurrentFolderId(null);
    setSelectedItems(new Set());
    setIsSelectMode(false);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    params.delete('folder');
    router.push(`?${params.toString()}`);
  }, [searchQuery, router, searchParams]);

  // File type filter handler
  const handleFileTypeToggle = useCallback((type: string) => {
    setFileTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Selection handlers
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedItems(new Set());
    }
  }, [isSelectMode]);

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = [...files.map(f => f.id), ...folders.map(f => f.id)];
    setSelectedItems(new Set(allIds));
  }, [files, folders]);

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Get selected items data
  const getSelectedItemsData = useCallback(() => {
    const selectedFiles = files.filter(f => selectedItems.has(f.id));
    const selectedFolders = folders.filter(f => selectedItems.has(f.id));
    return [...selectedFiles, ...selectedFolders];
  }, [files, folders, selectedItems]);

  // File actions
  const getFileActions = useCallback((file: DriveFile | DriveFolder, view: string) => {
    const isTrash = view === 'trash' || file.trashed;
    const capabilities = file.capabilities || {};
    
    return {
      canPreview: !isTrash && file.mimeType !== 'application/vnd.google-apps.folder',
      canDownload: !isTrash && file.mimeType !== 'application/vnd.google-apps.folder',
      canRename: !isTrash && (capabilities.canEdit !== false),
      canMove: !isTrash && (capabilities.canEdit !== false),
      canCopy: !isTrash && (capabilities.canCopy !== false),
      canShare: !isTrash && (capabilities.canShare !== false),
      canDetails: true,
      canTrash: !isTrash && (capabilities.canMoveToTrash !== false),
      canRestore: isTrash,
      canPermanentDelete: isTrash && (capabilities.canDelete !== false),
    };
  }, []);

  const handleFileAction = useCallback((action: string, fileId: string, fileName: string) => {
    const file = [...files, ...folders].find(f => f.id === fileId);
    if (!file) return;

    switch (action) {
      case 'preview':
        setSelectedFileForPreview(file);
        setIsPreviewDialogOpen(true);
        break;
      case 'download':
        window.open(file.webContentLink, '_blank');
        break;
      case 'rename':
        setSelectedFileForRename(file);
        setIsRenameDialogOpen(true);
        break;
      case 'move':
        // TODO: Implement move dialog
        toast('Move functionality coming soon', 'info');
        break;
      case 'copy':
        // TODO: Implement copy dialog
        toast('Copy functionality coming soon', 'info');
        break;
      case 'share':
        setSelectedFileForShare(file);
        setIsShareDialogOpen(true);
        break;
      case 'details':
        setSelectedFileForDetails(file);
        setIsDetailsDialogOpen(true);
        break;
      case 'trash':
      case 'delete':
        setSelectedFileForDelete(file);
        setIsDeleteDialogOpen(true);
        break;
      case 'restore':
        // TODO: Implement restore functionality
        toast('Restore functionality coming soon', 'info');
        break;
      case 'permanentDelete':
        setSelectedFileForDelete(file);
        setIsDeleteDialogOpen(true);
        break;
    }
  }, [files, folders]);

  // Bulk operations
  const handleBulkDownload = useCallback(async () => {
    const selectedFiles = getSelectedItemsData().filter(item => 
      item.mimeType !== 'application/vnd.google-apps.folder'
    );
    
    if (selectedFiles.length === 0) {
      toast('No files selected for download', 'error');
      return;
    }

    // Download each file
    selectedFiles.forEach((file) => {
      if (file.webContentLink) {
        window.open(file.webContentLink, '_blank');
      }
    });

    toast(`Started download of ${selectedFiles.length} files`, 'success');
  }, [getSelectedItemsData]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFileTypeFilter([]);
    setAdvancedFilters({});
    setSearchQuery('');
    setSubmittedSearchQuery('');
  }, []);

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return fileTypeFilter.length > 0 || 
           Object.keys(advancedFilters).length > 0 ||
           submittedSearchQuery.trim() !== '';
  }, [fileTypeFilter, advancedFilters, submittedSearchQuery]);

  // Sorting and filtering logic
  const sortedFiles = useMemo(() => {
    let sorted = [...files];
    
    // Sort files
    sorted.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'modifiedTime':
          aValue = new Date(a.modifiedTime);
          bValue = new Date(b.modifiedTime);
          break;
        case 'size':
          aValue = parseInt(a.size || '0');
          bValue = parseInt(b.size || '0');
          break;
        case 'type':
          aValue = a.mimeType.toLowerCase();
          bValue = b.mimeType.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [files, sortBy, sortOrder]);

  const sortedFolders = useMemo(() => {
    let sorted = [...folders];
    
    // Sort folders
    sorted.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'modifiedTime':
          aValue = new Date(a.modifiedTime);
          bValue = new Date(b.modifiedTime);
          break;
        case 'type':
          aValue = 'folder';
          bValue = 'folder';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [folders, sortBy, sortOrder]);

  // Error states
  if (!hasPermission) {
    return (
      <DrivePermissionRequired 
        error={error}
        onRetry={handleRefresh}
      />
    );
  }

  if (error && !loading) {
    return (
      <DriveErrorDisplay 
        error={error}
        onRetry={handleRefresh}
        onReconnect={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <BreadcrumbNavigation
          currentFolderId={currentFolderId}
          folderPath={folderPath}
          activeView={activeView}
          onNavigate={handleFolderNavigation}
        />
      </div>

      {/* Toolbar */}
      <DriveToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchInput={handleSearchInput}
        handleSearch={handleSearch}
        setSubmittedSearchQuery={setSubmittedSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeView={activeView}
        handleViewChange={handleViewChange}
        selectedItems={selectedItems}
        isSelectMode={isSelectMode}
        toggleSelectMode={toggleSelectMode}
        selectAll={selectAll}
        deselectAll={deselectAll}
        getSelectedItemsData={getSelectedItemsData}
        setIsMobileActionsOpen={setIsMobileActionsOpen}
        fileTypeFilter={fileTypeFilter}
        handleFileTypeToggle={handleFileTypeToggle}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
        setIsMobileFiltersOpen={setIsMobileFiltersOpen}
        sortedFiles={sortedFiles}
        sortedFolders={sortedFolders}
        files={files}
        folders={folders}
        getFileActions={getFileActions}
        handleBulkDownload={handleBulkDownload}
        handleRefresh={handleRefresh}
        fetchFiles={fetchFiles}
        currentFolderId={currentFolderId}
        setIsBulkRenameDialogOpen={setIsBulkRenameDialogOpen}
        setIsBulkExportDialogOpen={setIsBulkExportDialogOpen}
        setIsBulkMoveDialogOpen={setIsBulkMoveDialogOpen}
        setIsBulkCopyDialogOpen={setIsBulkCopyDialogOpen}
        setIsBulkShareDialogOpen={setIsBulkShareDialogOpen}
        setIsBulkRestoreDialogOpen={setIsBulkRestoreDialogOpen}
        setIsBulkDeleteDialogOpen={setIsBulkDeleteDialogOpen}
        setIsBulkPermanentDeleteDialogOpen={setIsBulkPermanentDeleteDialogOpen}
        setIsUploadDialogOpen={setIsUploadDialogOpen}
        setIsCreateFolderDialogOpen={setIsCreateFolderDialogOpen}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        loading={loading}
        refreshing={refreshing}
      />

      {/* Data Container - Refactored into separate component */}
      <DriveDataView
        loading={loading}
        files={files}
        folders={folders}
        sortedFiles={sortedFiles}
        sortedFolders={sortedFolders}
        viewMode={viewMode}
        searchQuery={submittedSearchQuery}
        currentFolderId={currentFolderId}
        isSelectMode={isSelectMode}
        selectedItems={selectedItems}
        activeView={activeView}
        visibleColumns={visibleColumns}
        toggleItemSelection={toggleItemSelection}
        handleFolderClick={handleFolderClick}
        handleFileAction={handleFileAction}
        getFileActions={getFileActions}
      />

      {/* Load More Section */}
      {hasNextPage && !loading && (
        <div className="flex justify-center p-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full sm:w-auto"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <FileUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadComplete={() => {
          setIsUploadDialogOpen(false);
          handleRefresh();
        }}
        currentFolderId={currentFolderId}
      />

      <CreateFolderDialog
        isOpen={isCreateFolderDialogOpen}
        onClose={() => setIsCreateFolderDialogOpen(false)}
        onCreateComplete={() => {
          setIsCreateFolderDialogOpen(false);
          handleRefresh();
        }}
        currentFolderId={currentFolderId}
      />

      <FileRenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        file={selectedFileForRename}
        onRenameComplete={() => {
          setIsRenameDialogOpen(false);
          handleRefresh();
        }}
      />

      <FileDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        file={selectedFileForDelete}
        onDeleteComplete={() => {
          setIsDeleteDialogOpen(false);
          handleRefresh();
        }}
      />

      <FileDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        file={selectedFileForDetails}
      />

      <FileShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        file={selectedFileForShare}
      />

      <FilePreviewDialog
        isOpen={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        file={selectedFileForPreview}
      />

      <BulkDeleteDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        selectedItems={getSelectedItemsData()}
        onDeleteComplete={() => {
          setIsBulkDeleteDialogOpen(false);
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkPermanentDeleteDialog
        isOpen={isBulkPermanentDeleteDialogOpen}
        onClose={() => setIsBulkPermanentDeleteDialogOpen(false)}
        selectedItems={getSelectedItemsData()}
        onDeleteComplete={() => {
          setIsBulkPermanentDeleteDialogOpen(false);
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkRestoreDialog
        isOpen={isBulkRestoreDialogOpen}
        onClose={() => setIsBulkRestoreDialogOpen(false)}
        selectedItems={getSelectedItemsData()}
        onRestoreComplete={() => {
          setIsBulkRestoreDialogOpen(false);
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkRenameDialog
        isOpen={isBulkRenameDialogOpen}
        onClose={() => setIsBulkRenameDialogOpen(false)}
        selectedItems={getSelectedItemsData()}
        onRenameComplete={() => {
          setIsBulkRenameDialogOpen(false);
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkExportDialog
        isOpen={isBulkExportDialogOpen}
        onClose={() => setIsBulkExportDialogOpen(false)}
        selectedItems={getSelectedItemsData()}
      />

      <BulkMoveDialog
        isOpen={isBulkMoveDialogOpen}
        onClose={() => setIsBulkMoveDialogOpen(false)}
        selectedItems={getSelectedItemsData()}
        onMoveComplete={() => {
          setIsBulkMoveDialogOpen(false);
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkCopyDialog
        isOpen={isBulkCopyDialogOpen}
        onClose={() => setIsBulkCopyDialogOpen(false)}
        selectedItems={getSelectedItemsData()}
        onCopyComplete={() => {
          setIsBulkCopyDialogOpen(false);
          setSelectedItems(new Set());
          handleRefresh();
        }}
      />

      <BulkShareDialog
        isOpen={isBulkShareDialogOpen}
        onClose={() => setIsBulkShareDialogOpen(false)}
        selectedItems={getSelectedItemsData()}
      />

      <MobileActionsBottomSheet
        open={isMobileActionsOpen}
        onClose={() => setIsMobileActionsOpen(false)}
        selectedItems={getSelectedItemsData()}
        onAction={(action, fileId, fileName) => {
          setIsMobileActionsOpen(false);
          handleFileAction(action, fileId, fileName);
        }}
        onBulkAction={(action) => {
          setIsMobileActionsOpen(false);
          switch (action) {
            case 'rename':
              setIsBulkRenameDialogOpen(true);
              break;
            case 'export':
              setIsBulkExportDialogOpen(true);
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
            case 'restore':
              setIsBulkRestoreDialogOpen(true);
              break;
            case 'delete':
              setIsBulkDeleteDialogOpen(true);
              break;
            case 'permanent-delete':
              setIsBulkPermanentDeleteDialogOpen(true);
              break;
            case 'download':
              handleBulkDownload();
              break;
          }
        }}
      />

      <FiltersDialog
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        fileTypeFilter={fileTypeFilter}
        onFileTypeToggle={handleFileTypeToggle}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
        onClearFilters={clearAllFilters}
      />

    </div>
  );
}