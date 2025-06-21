"use client";

import React, { useState, useEffect } from 'react';
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
  Share2,
  Edit,
  Eye,
  RefreshCw,
  Move,
  Copy,
  X,
  AlertTriangle,
  Info,
  Play,
  Grid3X3,
  List,
  Calendar,
  HardDrive,
  Settings,
  Columns,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Square,
  CheckSquare,
  MousePointer,
  SquareCheck,
  Folder,
  FileText,
  Star,
  Link,
  FileSpreadsheet,
  Presentation,
  Video,
  Music,
  Archive,
  Code
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { formatFileSize, formatDriveFileDate, isPreviewable, getFileActions } from '@/lib/google-drive/utils';
import { formatFileTime, getRelativeTime } from '@/lib/timezone-utils';
import { useTimezoneContext } from '@/components/timezone-provider';
import { FileIcon } from '@/components/file-icon';
import { toast } from "sonner";
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIsMobile } from '@/hooks/use-mobile';
// Core drive management imports only

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
import { DriveGridSkeleton, BreadcrumbSkeleton } from './drive-skeleton';
import { DriveToolbarSkeleton, DriveSearchSkeleton, DriveBreadcrumbSkeleton } from '@/components/ui/loading-skeleton';

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

import { DriveErrorDisplay } from '@/components/drive-error-display';
import { DrivePermissionRequired } from '@/components/drive-permission-required';
import { FileCategoryBadges } from '@/components/file-category-badges';
// File size utilities inline
const normalizeFileSize = (size: any): number => {
  // Handle null, undefined, empty values
  if (size === null || size === undefined || size === '' || size === '-') return 0;
  if (!size && size !== 0) return 0;

  // Convert to string and check for invalid values
  const sizeStr = size.toString().trim();
  if (sizeStr === '-' || sizeStr === '' || sizeStr === 'undefined' || sizeStr === 'null') return 0;

  // Parse as number
  const parsedSize = parseInt(sizeStr);
  return isNaN(parsedSize) || parsedSize < 0 ? 0 : parsedSize;
};

const getSizeMultiplier = (unit: 'B' | 'KB' | 'MB' | 'GB'): number => {
  switch (unit) {
    case 'B': return 1;
    case 'KB': return 1024;
    case 'MB': return 1024 * 1024;
    case 'GB': return 1024 * 1024 * 1024;
    default: return 1;
  }
};

const isFileSizeInRange = (
  fileSize: any,
  minSize?: number,
  maxSize?: number,
  unit: 'B' | 'KB' | 'MB' | 'GB' = 'MB'
): boolean => {
  const normalizedFileSize = normalizeFileSize(fileSize);
  const multiplier = getSizeMultiplier(unit);
  const minBytes = minSize ? minSize * multiplier : 0;
  const maxBytes = maxSize ? maxSize * multiplier : Number.MAX_SAFE_INTEGER;
  return normalizedFileSize >= minBytes && normalizedFileSize <= maxBytes;
};

// Enhanced client-side filtering utilities
const applyClientSideFilters = (
  files: DriveFile[], 
  folders: DriveFolder[], 
  filters: {
    fileTypeFilter: string[];
    searchQuery: string;
    activeView: string;
    advancedFilters?: {
      sizeRange?: { min?: number; max?: number; unit: 'B' | 'KB' | 'MB' | 'GB' };
      createdDateRange?: { from?: Date; to?: Date };
      modifiedDateRange?: { from?: Date; to?: Date };
      owner?: string;
    };
  }
) => {
  let filteredFiles = [...files];
  let filteredFolders = [...folders];

  // Apply file type filters
  if (filters.fileTypeFilter.length > 0) {
    filteredFiles = filteredFiles.filter(file => {
      return filters.fileTypeFilter.some(type => {
        switch (type.toLowerCase()) {
          case 'document':
            return file.mimeType?.includes('document') || 
                   file.mimeType?.includes('pdf') || 
                   file.mimeType?.includes('text') ||
                   file.mimeType?.includes('word') ||
                   file.mimeType?.includes('rtf');
          case 'spreadsheet':
            return file.mimeType?.includes('spreadsheet') || 
                   file.mimeType?.includes('excel') ||
                   file.mimeType?.includes('csv');
          case 'presentation':
            return file.mimeType?.includes('presentation') || 
                   file.mimeType?.includes('powerpoint');
          case 'image':
            return file.mimeType?.startsWith('image/');
          case 'video':
            return file.mimeType?.startsWith('video/');
          case 'audio':
            return file.mimeType?.startsWith('audio/');
          case 'archive':
            return file.mimeType?.includes('zip') || 
                   file.mimeType?.includes('rar') ||
                   file.mimeType?.includes('tar') ||
                   file.mimeType?.includes('gzip') ||
                   file.mimeType?.includes('7z');
          case 'code':
            return file.mimeType?.includes('javascript') ||
                   file.mimeType?.includes('html') ||
                   file.mimeType?.includes('css') ||
                   file.mimeType?.includes('json') ||
                   file.mimeType?.includes('xml') ||
                   file.name?.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|cs|php|rb|go|rs|swift|kt)$/i);
          case 'shortcut':
            return file.mimeType === 'application/vnd.google-apps.shortcut';
          case 'folder':
            // Handle folders separately
            return false;
          default:
            return true;
        }
      });
    });

    // Filter folders if 'folder' type is selected
    if (!filters.fileTypeFilter.includes('folder')) {
      filteredFolders = [];
    }
  }

  // Apply additional search filtering for better results
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const searchTerm = filters.searchQuery.toLowerCase();

    filteredFiles = filteredFiles.filter(file => 
      file.name?.toLowerCase().includes(searchTerm) ||
      file.description?.toLowerCase().includes(searchTerm)
    );

    filteredFolders = filteredFolders.filter(folder => 
      folder.name?.toLowerCase().includes(searchTerm) ||
      folder.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply advanced filters
  if (filters.advancedFilters) {
    const { sizeRange, createdDateRange, modifiedDateRange, owner } = filters.advancedFilters;

    // Size range filter (client-side only since Google Drive API doesn't support it)
    if (sizeRange && (sizeRange.min || sizeRange.max)) {
      filteredFiles = filteredFiles.filter(file => {
        return isFileSizeInRange(file.size, sizeRange.min, sizeRange.max, sizeRange.unit);
      });

      // Filter folders by size (folders have size = 0)
      filteredFolders = filteredFolders.filter(folder => {
        return isFileSizeInRange(0, sizeRange.min, sizeRange.max, sizeRange.unit);
      });
    }

    // Date range filters
    if (createdDateRange && (createdDateRange.from || createdDateRange.to)) {
      filteredFiles = filteredFiles.filter(file => {
        const fileDate = new Date(file.createdTime);
        const fromDate = createdDateRange.from;
        const toDate = createdDateRange.to;

        if (fromDate && fileDate < fromDate) return false;
        if (toDate && fileDate > toDate) return false;
        return true;
      });

      filteredFolders = filteredFolders.filter(folder => {
        const folderDate = new Date(folder.createdTime);
        const fromDate = createdDateRange.from;
        const toDate = createdDateRange.to;

        if (fromDate && folderDate < fromDate) return false;
        if (toDate && folderDate > toDate) return false;
        return true;
      });
    }

    if (modifiedDateRange && (modifiedDateRange.from || modifiedDateRange.to)) {
      filteredFiles = filteredFiles.filter(file => {
        const fileDate = new Date(file.modifiedTime);
        const fromDate = modifiedDateRange.from;
        const toDate = modifiedDateRange.to;

        if (fromDate && fileDate < fromDate) return false;
        if (toDate && fileDate > toDate) return false;
        return true;
      });

      filteredFolders = filteredFolders.filter(folder => {
        const folderDate = new Date(folder.modifiedTime);
        const fromDate = modifiedDateRange.from;
        const toDate = modifiedDateRange.to;

        if (fromDate && folderDate < fromDate) return false;
        if (toDate && folderDate > toDate) return false;
        return true;
      });
    }

    // Owner filter
    if (owner && owner.trim()) {
      const ownerTerm = owner.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.owners?.some(ownerInfo => 
          ownerInfo.displayName?.toLowerCase().includes(ownerTerm) ||
          ownerInfo.emailAddress?.toLowerCase().includes(ownerTerm)
        )
      );

      filteredFolders = filteredFolders.filter(folder => 
        folder.owners?.some(ownerInfo => 
          ownerInfo.displayName?.toLowerCase().includes(ownerTerm) ||
          ownerInfo.emailAddress?.toLowerCase().includes(ownerTerm)
        )
      );
    }
  }

  // Apply view-specific filters based on activeView
  if (filters.activeView && filters.activeView !== 'all') {
    switch (filters.activeView) {
      case 'my-drive':
        // Show only files/folders in the user's Drive (not shared)
        filteredFiles = filteredFiles.filter(file => !file.shared);
        filteredFolders = filteredFolders.filter(folder => !folder.shared);
        break;
      case 'shared':
        // Show only shared files/folders
        filteredFiles = filteredFiles.filter(file => file.shared);
        filteredFolders = filteredFolders.filter(folder => folder.shared);
        break;
      case 'starred':
        // Show only starred files/folders (would need starred property)
        // For now, filter based on capabilities or permissions
        filteredFiles = filteredFiles.filter(file => file.capabilities?.canShare);
        filteredFolders = filteredFolders.filter(folder => folder.capabilities?.canShare);
        break;
      case 'recent':
        // Show recently modified files/folders (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filteredFiles = filteredFiles.filter(file => 
          new Date(file.modifiedTime) > sevenDaysAgo
        );
        filteredFolders = filteredFolders.filter(folder => 
          new Date(folder.modifiedTime) > sevenDaysAgo
        );
        break;
      case 'trash':
        // Show only trashed files/folders
        filteredFiles = filteredFiles.filter(file => file.trashed);
        filteredFolders = filteredFolders.filter(folder => folder.trashed);
        break;
    }
  }

  return { filteredFiles, filteredFolders };
};

// This function is deprecated - now using getFileActions from utils

export function DriveManager() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedFileForAction, setSelectedFileForAction] = useState<{ id: string; name: string; parentId?: string } | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | null>(null);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get timezone context for consistent date formatting
  const { timezone, isLoading: timezoneLoading } = useTimezoneContext();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [driveAccessError, setDriveAccessError] = useState<any>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  // Debounced search query for performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Table column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    id: true,
    size: true,
    owners: false,
    mimeType: false,
    createdTime: false,
    modifiedTime: false,
  });

  // Table sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'id' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType' | 'owners';
    direction: 'asc' | 'desc';
  } | null>(null);

  // View filters state
  const [activeView, setActiveView] = useState<'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash'>('all');
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<{
    sizeRange?: { min?: number; max?: number; unit: 'B' | 'KB' | 'MB' | 'GB' };
    createdDateRange?: { from?: Date; to?: Date };
    modifiedDateRange?: { from?: Date; to?: Date };
    owner?: string;
  }>({});

  // Bulk operations state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkMoveDialogOpen, setIsBulkMoveDialogOpen] = useState(false);
  const [isBulkCopyDialogOpen, setIsBulkCopyDialogOpen] = useState(false);
  const [isBulkExportDialogOpen, setIsBulkExportDialogOpen] = useState(false);
  const [isBulkRenameDialogOpen, setIsBulkRenameDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const [isBulkPermanentDeleteDialogOpen, setIsBulkPermanentDeleteDialogOpen] = useState(false);
  const [bulkOperationProgress, setBulkOperationProgress] = useState<{
    isRunning: boolean;
    current: number;
    total: number;
    operation: string;
  }>({ isRunning: false, current: 0, total: 0, operation: '' });

  // Single operation progress state
  const [singleOperationProgress, setSingleOperationProgress] = useState<{
    isRunning: boolean;
    operation: string;
  }>({ isRunning: false, operation: '' });

  // Additional dialog state for enhanced sharing
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isBulkShareDialogOpen, setIsBulkShareDialogOpen] = useState(false);
  const [selectedItemForShare, setSelectedItemForShare] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);

  // Mobile bottom sheet states
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Helper functions for filters
  const clearAdvancedFilters = () => {
    setAdvancedFilters({ sizeRange: { unit: 'MB' } });
  };

  const clearAllFilters = () => {
    setActiveView('all');
    setFileTypeFilter([]);
    setAdvancedFilters({ sizeRange: { unit: 'MB' } });
    setSearchQuery('');
  };

  // Check if any filters are active
  const hasActiveFilters = activeView !== 'all' || 
                          fileTypeFilter.length > 0 || 
                          searchQuery.trim() !== '' ||
                          (advancedFilters.sizeRange?.min) ||
                          (advancedFilters.sizeRange?.max) ||
                          (advancedFilters.createdDateRange?.from) ||
                          (advancedFilters.createdDateRange?.to) ||
                          (advancedFilters.modifiedDateRange?.from) ||
                          (advancedFilters.modifiedDateRange?.to) ||
                          (advancedFilters.owner?.trim());

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

  // Apply client-side filters first, then sort
  const { filteredFiles: clientFilteredFiles, filteredFolders: clientFilteredFolders } = React.useMemo(() => {
    return applyClientSideFilters(files, folders, {
      fileTypeFilter,
      searchQuery: debouncedSearchQuery,
      activeView,
      advancedFilters
    });
  }, [files, folders, fileTypeFilter, debouncedSearchQuery, activeView, advancedFilters]);

  // Sort ALL items (files and folders together) based on current sort configuration
  const sortedAllItems = React.useMemo(() => {
    // Combine files and folders into single array with type information
    const allItems = [
      ...clientFilteredFolders.map(folder => ({ ...folder, itemType: 'folder' as const })),
      ...clientFilteredFiles.map(file => ({ ...file, itemType: 'file' as const }))
    ];

    if (!sortConfig) {
      // Default: folders first, then files (when no sorting is applied)
      return allItems;
    }

    return [...allItems].sort((a, b) => {
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
          // For folders, size is always 0; for files use normalizeFileSize
          aValue = a.itemType === 'folder' ? 0 : normalizeFileSize(a.size);
          bValue = b.itemType === 'folder' ? 0 : normalizeFileSize(b.size);
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
          // For folders, use 'folder'; for files use actual mimeType
          aValue = a.itemType === 'folder' ? 'folder' : (a.mimeType || '').toLowerCase();
          bValue = b.itemType === 'folder' ? 'folder' : (b.mimeType || '').toLowerCase();
          break;
        case 'owners':
          aValue = (a.owners?.[0]?.displayName || a.owners?.[0]?.emailAddress || '').toLowerCase();
          bValue = (b.owners?.[0]?.displayName || b.owners?.[0]?.emailAddress || '').toLowerCase();
          break;
        default:
          return 0;
      }

      // Handle null, undefined, empty string, or "-" as appropriate default values
      if (aValue === null || aValue === undefined || aValue === '' || aValue === '-') aValue = key === 'size' ? 0 : '';
      if (bValue === null || bValue === undefined || bValue === '' || bValue === '-') bValue = key === 'size' ? 0 : '';

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clientFilteredFiles, clientFilteredFolders, sortConfig]);

  // Separate sorted items back into files and folders for backward compatibility
  const sortedFiles = React.useMemo(() => {
    return sortedAllItems.filter(item => item.itemType === 'file');
  }, [sortedAllItems]);

  const sortedFolders = React.useMemo(() => {
    return sortedAllItems.filter(item => item.itemType === 'folder');
  }, [sortedAllItems]);

  // Bulk operations utility functions - use filtered results
  const getAllItems = () => [...sortedFolders, ...sortedFiles];

  const getSelectedItemsData = () => {
    const allItems = getAllItems();
    return Array.from(selectedItems).map(id => {
      const item = allItems.find(item => item.id === id);
      return item ? { 
        id: item.id, 
        name: item.name, 
        type: 'mimeType' in item ? 'file' : 'folder',
        mimeType: 'mimeType' in item ? item.mimeType : 'application/vnd.google-apps.folder'
      } : null;
    }).filter(Boolean);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  };

  const selectAll = () => {
    const allItems = getAllItems();
    setSelectedItems(new Set(allItems.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
    // Force re-render to clear visual selection
    setFiles(prev => [...prev]);
    setFolders(prev => [...prev]);
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      deselectAll();
    }
  };

  // Bulk operation handlers
  const handleBulkDelete = async () => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    // Close dialog first so user can see progress
    setIsBulkDeleteDialogOpen(false);

    // Filter items that can be trashed based on permissions
    const itemsWithPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return actions?.canTrash;
    });

    const itemsWithoutPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return !actions?.canTrash;
    });

    if (itemsWithPermissions.length === 0) {
      toast.warning('No items can be moved to trash. All selected items don\'t have permission to be trashed.');
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: itemsWithPermissions.length,
      operation: 'Moving to trash'
    });

    let successCount = 0;
    let failedItems: string[] = [];
    let skippedItems = itemsWithoutPermissions.map(item => item.name);

    try {
      for (let i = 0; i < itemsWithPermissions.length; i++) {
        const item = itemsWithPermissions[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Moving to trash: ${item.name}`
        }));

        const response = await fetch(`/api/drive/files/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'trash' })
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.text();
          failedItems.push(item.name);
          console.error(`Failed to delete ${item.name}:`, response.status, errorData);
        }

        // Add small delay to prevent rate limiting
        if (i < itemsWithPermissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      let message = '';

      if (successCount > 0) {
        message += `${successCount} item${successCount > 1 ? 's' : ''} moved to trash`;
      }

      if (skippedItems.length > 0) {
        if (message) message += ', ';
        message += `${skippedItems.length} item${skippedItems.length > 1 ? 's' : ''} skipped (no permission)`;
      }

      if (failedItems.length > 0) {
        if (message) message += ', ';
        message += `${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed`;
      }

      if (successCount === itemsWithPermissions.length && skippedItems.length === 0) {
        toast.success(`Successfully moved ${successCount} item${successCount > 1 ? 's' : ''} to trash`);
      } else if (successCount > 0 || skippedItems.length > 0) {
        const toastMessage = `Move to trash completed: ${message}`;
        if (failedItems.length > 0 || skippedItems.length > 0) {
          toast.warning(toastMessage);
        } else {
          toast.success(toastMessage);
        }
        
        // Log details for debugging
        if (skippedItems.length > 0) {
          console.log('Skipped items (no permission):', skippedItems);
        }
        if (failedItems.length > 0) {
          console.log('Failed items:', failedItems);
        }
      } else {
        toast.error(`Failed to move items to trash: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('An error occurred during bulk delete operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const handleBulkMove = async (targetFolderId: string) => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    // Close dialog first so user can see progress
    setIsBulkMoveDialogOpen(false);

    // Filter items that can be moved based on permissions
    const itemsWithPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return actions?.canMove;
    });

    const itemsWithoutPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return !actions?.canMove;
    });

    if (itemsWithPermissions.length === 0) {
      toast.warning('No items can be moved. All selected items don\'t have permission to be moved.');
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: itemsWithPermissions.length,
      operation: 'Moving items'
    });

    let successCount = 0;
    let failedItems: string[] = [];
    let skippedItems = itemsWithoutPermissions.map(item => item.name);

    try {
      for (let i = 0; i < itemsWithPermissions.length; i++) {
        const item = itemsWithPermissions[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Moving: ${item.name}`
        }));

        const response = await fetch(`/api/drive/files/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'move', 
            parentId: targetFolderId,
            currentParentId: currentFolderId 
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.text();
          failedItems.push(item.name);
          console.error(`Failed to move ${item.name}:`, response.status, errorData);
        }

        // Add small delay to prevent rate limiting
        if (i < itemsWithPermissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      let message = '';

      if (successCount > 0) {
        message += `${successCount} item${successCount > 1 ? 's' : ''} moved`;
      }

      if (skippedItems.length > 0) {
        if (message) message += ', ';
        message += `${skippedItems.length} item${skippedItems.length > 1 ? 's' : ''} skipped (no permission)`;
      }

      if (failedItems.length > 0) {
        if (message) message += ', ';
        message += `${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed`;
      }

      if (successCount === itemsWithPermissions.length && skippedItems.length === 0) {
        toast.success(`Successfully moved ${successCount} item${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0 || skippedItems.length > 0) {
        const toastMessage = `Move completed: ${message}`;
        if (failedItems.length > 0 || skippedItems.length > 0) {
          toast.warning(toastMessage);
        } else {
          toast.success(toastMessage);
        }
        
        // Log details for debugging
        if (skippedItems.length > 0) {
          console.log('Skipped items (no permission):', skippedItems);
        }
        if (failedItems.length > 0) {
          console.log('Failed items:', failedItems);
        }
      } else {
        toast.error(`Failed to move items: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk move error:', error);
      toast.error('An error occurred during bulk move operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const handleBulkCopy = async (targetFolderId: string) => {
    const allSelectedItems = getSelectedItemsData();
    
    // Close dialog first so user can see progress
    setIsBulkCopyDialogOpen(false);
    
    // Filter for files that can be copied based on permissions
    const itemsWithPermissions = allSelectedItems.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return item.type === 'file' && actions?.canCopy;
    });

    const foldersSelected = allSelectedItems.filter(item => item.type === 'folder').length;
    const filesWithoutPermissions = allSelectedItems.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return item.type === 'file' && !actions?.canCopy;
    });

    if (itemsWithPermissions.length === 0) {
      let message = 'No files can be copied.';
      if (foldersSelected > 0) {
        message += ` Folders cannot be copied (${foldersSelected} selected).`;
      }
      if (filesWithoutPermissions.length > 0) {
        message += ` ${filesWithoutPermissions.length} file${filesWithoutPermissions.length > 1 ? 's' : ''} don't have copy permission.`;
      }
      toast.warning(message);
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: itemsWithPermissions.length,
      operation: 'Copying files'
    });

    let successCount = 0;
    let failedItems: string[] = [];
    let skippedItems: string[] = [];

    // Add folders and files without permissions to skipped items
    if (foldersSelected > 0) {
      const folderNames = allSelectedItems.filter(item => item.type === 'folder').map(item => item.name);
      skippedItems.push(...folderNames);
    }
    if (filesWithoutPermissions.length > 0) {
      skippedItems.push(...filesWithoutPermissions.map(item => item.name));
    }

    try {
      for (let i = 0; i < itemsWithPermissions.length; i++) {
        const item = itemsWithPermissions[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Copying: ${item.name}`
        }));

        const response = await fetch(`/api/drive/files/${item.id}/copy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: `Copy of ${item.name}`,
            parentId: targetFolderId 
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.text();
          failedItems.push(item.name);
          console.error(`Failed to copy ${item.name}:`, response.status, errorData);
        }

        // Add small delay to prevent rate limiting
        if (i < itemsWithPermissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      let message = '';

      if (successCount > 0) {
        message += `${successCount} file${successCount > 1 ? 's' : ''} copied`;
      }

      if (skippedItems.length > 0) {
        if (message) message += ', ';
        message += `${skippedItems.length} item${skippedItems.length > 1 ? 's' : ''} skipped`;
        if (foldersSelected > 0) {
          message += ` (${foldersSelected} folder${foldersSelected > 1 ? 's' : ''}, ${filesWithoutPermissions.length} no permission)`;
        } else {
          message += ` (no permission)`;
        }
      }

      if (failedItems.length > 0) {
        if (message) message += ', ';
        message += `${failedItems.length} file${failedItems.length > 1 ? 's' : ''} failed`;
      }

      if (successCount === itemsWithPermissions.length && skippedItems.length === 0) {
        toast.success(`Successfully copied ${successCount} file${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0 || skippedItems.length > 0) {
        const toastMessage = `Copy completed: ${message}`;
        if (failedItems.length > 0 || skippedItems.length > 0) {
          toast.warning(toastMessage);
        } else {
          toast.success(toastMessage);
        }
        
        // Log details for debugging
        if (skippedItems.length > 0) {
          console.log('Skipped items:', { folders: foldersSelected, noPermission: filesWithoutPermissions.length });
        }
        if (failedItems.length > 0) {
          console.log('Failed items:', failedItems);
        }
      } else {
        toast.error(`Failed to copy files: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk copy error:', error);
      toast.error('An error occurred during bulk copy operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const handleBulkDownload = async () => {
    const allSelectedItems = getSelectedItemsData();
    // Filter out folders - only allow files to be downloaded
    const selectedItemsData = allSelectedItems.filter(item => item.type === 'file' && item.mimeType !== 'application/vnd.google-apps.folder');
    const folderCount = allSelectedItems.filter(item => item.type === 'folder' || item.mimeType === 'application/vnd.google-apps.folder').length;

    if (selectedItemsData.length === 0) {
      if (folderCount > 0) {
        toast.warning(`Cannot download folders. Only files can be downloaded. ${folderCount} folder${folderCount > 1 ? 's' : ''} selected.`);
      } else {
        toast.warning('No files selected for download.');
      }
      return;
    }

    if (folderCount > 0) {
      toast.info(`Downloading ${selectedItemsData.length} file${selectedItemsData.length > 1 ? 's' : ''}. Skipping ${folderCount} folder${folderCount > 1 ? 's' : ''}.`);
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedItemsData.length,
      operation: 'Downloading files'
    });

    let successCount = 0;
    let failedItems: string[] = [];
    let skippedItems: string[] = [];

    try {
      for (let i = 0; i < selectedItemsData.length; i++) {
        const item = selectedItemsData[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Downloading: ${item.name}`
        }));

        try {
          // Double check that it's not a folder before downloading
          if (item.mimeType === 'application/vnd.google-apps.folder') {
            skippedItems.push(item.name);
            console.log(`Skipping folder: ${item.name}`);
            continue;
          }

          // Direct download for all files (no hybrid strategy)
          console.log(`Downloading file: ${item.name}`);

          // Create download link directly to API endpoint
          const link = document.createElement('a');
          link.href = `/api/drive/download/${item.id}`;
          link.download = item.name;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          successCount++;
          console.log(`Direct download initiated for: ${item.name}`);

          // Add delay between downloads to avoid overwhelming the browser
          if (i < selectedItemsData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (downloadError) {
          failedItems.push(item.name);
          console.error(`Failed to download ${item.name}:`, downloadError);
        }
      }

      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      let message = '';

      if (successCount > 0) {
        message += `${successCount} file${successCount > 1 ? 's' : ''} download initiated`;
      }

      if (skippedItems.length > 0) {
        if (message) message += ', ';
        message += `${skippedItems.length} folder${skippedItems.length > 1 ? 's' : ''} skipped`;
      }

      if (failedItems.length > 0) {
        if (message) message += ', ';
        message += `${failedItems.length} failed`;
      }

      if (successCount === selectedItemsData.length && skippedItems.length === 0) {
        toast.success(`Download initiated for ${successCount} file${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.warning(`Download completed: ${message}`);
        if (failedItems.length > 0) {
          console.log('Failed items:', failedItems);
        }
      } else {
        toast.error(`Download failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error('An error occurred during bulk download operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const handleBulkExport = async (exportFormat: string) => {
    const exportableFiles = getSelectedItemsData().filter(item => 
      item.type === 'file' && 
      item.mimeType && 
      item.mimeType.startsWith('application/vnd.google-apps.') &&
      !item.mimeType.includes('folder') &&
      !item.mimeType.includes('shortcut')
    );

    // Close dialog first so user can see progress
    setIsBulkExportDialogOpen(false);

    if (exportableFiles.length === 0) {
      toast.warning('No Google Workspace files selected for export.');
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: exportableFiles.length,
      operation: `Exporting to ${exportFormat.toUpperCase()}`
    });

    let successCount = 0;
    let failedItems: string[] = [];

    try {
      for (let i = 0; i < exportableFiles.length; i++) {
        const item = exportableFiles[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Exporting: ${item.name} (${exportFormat.toUpperCase()})`
        }));

        try {
          const response = await fetch(`/api/drive/files/${item.id}/export?format=${exportFormat}`);

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${item.name}.${exportFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            successCount++;
          } else {
            failedItems.push(item.name);
            console.error(`Failed to export ${item.name}:`, response.status);
          }
        } catch (error) {
          failedItems.push(item.name);
          console.error(`Export error for ${item.name}:`, error);
        }

        if (i < exportableFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      deselectAll();
      setIsSelectMode(false);

      if (successCount === exportableFiles.length) {
        toast.success(`Successfully exported ${successCount} file${successCount > 1 ? 's' : ''} to ${exportFormat.toUpperCase()}`);
      } else if (successCount > 0) {
        toast.warning(`Exported ${successCount} files to ${exportFormat.toUpperCase()}. ${failedItems.length} files failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      } else {
        toast.error(`Failed to export files: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk export error:', error);
      toast.error('An error occurred during bulk export operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const handleBulkRename = async (renamePattern: string, renameType: string) => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    // Close dialog first so user can see progress
    setIsBulkRenameDialogOpen(false);

    // Filter items that can be renamed based on permissions
    const itemsWithPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return actions?.canRename;
    });

    const itemsWithoutPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return !actions?.canRename;
    });

    if (itemsWithPermissions.length === 0) {
      toast.warning('No items can be renamed. All selected items don\'t have permission to be renamed.');
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: itemsWithPermissions.length,
      operation: 'Renaming items'
    });

    let successCount = 0;
    let failedItems: string[] = [];
    let skippedItems = itemsWithoutPermissions.map(item => item.name);

    try {
      for (let i = 0; i < itemsWithPermissions.length; i++) {
        const item = itemsWithPermissions[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Renaming: ${item.name}`
        }));

        let newName = '';

        if (renameType === 'regex') {
          try {
            const regexData = JSON.parse(renamePattern);
            const regex = new RegExp(regexData.pattern, regexData.flags);
            newName = item.name.replace(regex, regexData.replacement);
          } catch (error) {
            console.error(`Failed to apply regex to ${item.name}:`, error);
            newName = item.name; // Keep original name if regex fails
          }
        } else {
          const fileExtension = item.name.includes('.') ? 
            item.name.substring(item.name.lastIndexOf('.')) : '';
          const baseName = fileExtension ? 
            item.name.substring(0, item.name.lastIndexOf('.')) : item.name;

          switch (renameType) {
            case 'prefix':
              newName = `${renamePattern}_${item.name}`;
              break;
            case 'suffix':
              newName = fileExtension ? 
                `${baseName}_${renamePattern}${fileExtension}` : 
                `${item.name}_${renamePattern}`;
              break;
            case 'numbering':
              const number = String(i + 1).padStart(3, '0');
              newName = fileExtension ? 
                `${renamePattern}_${number}${fileExtension}` : 
                `${renamePattern}_${number}`;
              break;
            case 'timestamp':
              const now = new Date();
              const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
              newName = fileExtension ? 
                `${baseName}_${timestamp}${fileExtension}` : 
                `${item.name}_${timestamp}`;
              break;
            default:
              newName = item.name;
          }
        }

        const response = await fetch(`/api/drive/files/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rename', name: newName })
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.text();
          failedItems.push(item.name);
          console.error(`Failed to rename ${item.name}:`, response.status, errorData);
        }

        if (i < selectedItemsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      let message = '';

      if (successCount > 0) {
        message += `${successCount} item${successCount > 1 ? 's' : ''} renamed`;
      }

      if (skippedItems.length > 0) {
        if (message) message += ', ';
        message += `${skippedItems.length} item${skippedItems.length > 1 ? 's' : ''} skipped (no permission)`;
      }

      if (failedItems.length > 0) {
        if (message) message += ', ';
        message += `${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed`;
      }

      if (successCount === itemsWithPermissions.length && skippedItems.length === 0) {
        toast.success(`Successfully renamed ${successCount} item${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0 || skippedItems.length > 0) {
        const toastMessage = `Rename completed: ${message}`;
        if (failedItems.length > 0 || skippedItems.length > 0) {
          toast.warning(toastMessage);
        } else {
          toast.success(toastMessage);
        }
        
        // Log details for debugging
        if (skippedItems.length > 0) {
          console.log('Skipped items (no permission):', skippedItems);
        }
        if (failedItems.length > 0) {
          console.log('Failed items:', failedItems);
        }
      } else {
        toast.error(`Failed to rename items: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk rename error:', error);
      toast.error('An error occurred during bulk rename operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const handleBulkRestore = async () => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    // Close dialog first so user can see progress
    setIsBulkRestoreDialogOpen(false);

    // Filter items that can be restored based on permissions
    const itemsWithPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return actions?.canRestore;
    });

    const itemsWithoutPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return !actions?.canRestore;
    });

    if (itemsWithPermissions.length === 0) {
      toast.warning('No items can be restored. All selected items are either not in trash or don\'t have permission to be restored.');
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: itemsWithPermissions.length,
      operation: 'Restoring items'
    });

    let successCount = 0;
    let failedItems: string[] = [];
    let skippedItems = itemsWithoutPermissions.map(item => item.name);

    try {
      for (let i = 0; i < itemsWithPermissions.length; i++) {
        const item = itemsWithPermissions[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Restoring: ${item.name}`
        }));

        try {
          const response = await fetch(`/api/drive/files/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'restore' })
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.text();
            failedItems.push(item.name);
            console.error(`Failed to restore ${item.name}:`, response.status, errorData);
          }
        } catch (error) {
          failedItems.push(item.name);
          console.error(`Error restoring ${item.name}:`, error);
        }

        if (i < itemsWithPermissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      let message = '';

      if (successCount > 0) {
        message += `${successCount} item${successCount > 1 ? 's' : ''} restored`;
      }

      if (skippedItems.length > 0) {
        if (message) message += ', ';
        message += `${skippedItems.length} item${skippedItems.length > 1 ? 's' : ''} skipped (not in trash or no permission)`;
      }

      if (failedItems.length > 0) {
        if (message) message += ', ';
        message += `${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed`;
      }

      if (successCount === itemsWithPermissions.length && skippedItems.length === 0) {
        toast.success(`Successfully restored ${successCount} item${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0 || skippedItems.length > 0) {
        const toastMessage = `Restore completed: ${message}`;
        if (failedItems.length > 0 || skippedItems.length > 0) {
          toast.warning(toastMessage);
        } else {
          toast.success(toastMessage);
        }
        
        // Log details for debugging
        if (skippedItems.length > 0) {
          console.log('Skipped items (not in trash or no permission):', skippedItems);
        }
        if (failedItems.length > 0) {
          console.log('Failed items:', failedItems);
        }
      } else {
        toast.error(`Failed to restore items: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk restore error:', error);
      toast.error('An error occurred during bulk restore operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const handleBulkShare = async (shareData: { role: string; type: string }) => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    // Close dialog first so user can see progress
    setIsBulkShareDialogOpen(false);

    // Filter items that can be shared based on permissions
    const itemsWithPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return actions?.canShare;
    });

    const itemsWithoutPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return !actions?.canShare;
    });

    if (itemsWithPermissions.length === 0) {
      toast.warning('No items can be shared. All selected items either don\'t have permission or are restricted.');
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: itemsWithPermissions.length,
      operation: 'Generating share links'
    });

    let successCount = 0;
    let failedItems: string[] = [];
    let skippedItems = itemsWithoutPermissions.map(item => item.name);
    const generatedLinks: string[] = [];

    try {
      for (let i = 0; i < itemsWithPermissions.length; i++) {
        const item = itemsWithPermissions[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Sharing: ${item.name}`
        }));

        try {
          const response = await fetch(`/api/drive/files/${item.id}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_share_link',
              role: shareData.role,
              type: shareData.type === 'anyoneWithLink' ? 'anyone' : shareData.type
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.webViewLink) {
              generatedLinks.push(`${item.name}: ${result.webViewLink}`);
              successCount++;
            } else {
              failedItems.push(item.name);
            }
          } else {
            const errorData = await response.json();
            if (errorData.needsReauth) {
              toast.error('Google Drive access expired. Please reconnect your account.');
              window.location.reload();
              return;
            }
            failedItems.push(item.name);
            console.error(`Failed to share ${item.name}:`, response.status, errorData);
          }
        } catch (error) {
          failedItems.push(item.name);
          console.error(`Error sharing ${item.name}:`, error);
        }

        if (i < itemsWithPermissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      let message = '';

      if (successCount > 0) {
        message += `${successCount} share link${successCount > 1 ? 's' : ''} generated`;
        
        // Copy all links to clipboard if successful
        if (generatedLinks.length > 0) {
          try {
            const allLinks = generatedLinks.join('\n');
            await navigator.clipboard.writeText(allLinks);
            toast.success(`${message} and copied to clipboard!`);
          } catch (clipboardError) {
            toast.success(message);
          }
        }
      }

      if (skippedItems.length > 0) {
        if (message) message += ', ';
        message += `${skippedItems.length} item${skippedItems.length > 1 ? 's' : ''} skipped (no permission)`;
      }

      if (failedItems.length > 0) {
        if (message) message += ', ';
        message += `${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed`;
      }

      if (successCount === itemsWithPermissions.length && skippedItems.length === 0) {
        // Already handled above with clipboard copy
      } else if (successCount > 0 || skippedItems.length > 0) {
        const toastMessage = `Bulk share completed: ${message}`;
        if (failedItems.length > 0 || skippedItems.length > 0) {
          toast.warning(toastMessage);
        } else {
          toast.success(toastMessage);
        }
        
        // Log details for debugging
        if (skippedItems.length > 0) {
          console.log('Skipped items (no permission):', skippedItems);
        }
        if (failedItems.length > 0) {
          console.log('Failed items:', failedItems);
        }
      } else {
        toast.error(`Failed to share items: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk share error:', error);
      toast.error('An error occurred during bulk share operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const handleShare = async (shareData: { role: string; type: string; emailAddress?: string; message?: string }) => {
    if (!selectedItemForShare) return;

    try {
      const response = await fetch(`/api/drive/files/${selectedItemForShare.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_share_link',
          role: shareData.role,
          type: shareData.type,
          emailAddress: shareData.emailAddress,
          message: shareData.message,
          allowFileDiscovery: true
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to share item');
      }

      toast.success(`${selectedItemForShare.name} shared successfully`);
      
      // Refresh the files list to show updated share status
      fetchFiles();
      
      // Close the dialog
      setIsShareDialogOpen(false);
      setSelectedItemForShare(null);
    } catch (error) {
      console.error('Share error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to share item');
    }
  };

  const handleBulkPermanentDelete = async () => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    // Close dialog first so user can see progress
    setIsBulkPermanentDeleteDialogOpen(false);

    // Filter items that can be permanently deleted based on permissions
    const itemsWithPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return actions?.canPermanentDelete;
    });

    const itemsWithoutPermissions = selectedItemsData.filter(item => {
      const fileOrFolder = [...sortedFiles, ...sortedFolders].find(f => f.id === item.id);
      const actions = fileOrFolder ? getFileActions(fileOrFolder, activeView) : null;
      return !actions?.canPermanentDelete;
    });

    if (itemsWithPermissions.length === 0) {
      toast.warning('No items can be permanently deleted. All selected items either don\'t have permission or are not in trash.');
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: itemsWithPermissions.length,
      operation: 'Permanently deleting items'
    });

    let successCount = 0;
    let failedItems: string[] = [];
    let skippedItems = itemsWithoutPermissions.map(item => item.name);

    try {
      for (let i = 0; i < itemsWithPermissions.length; i++) {
        const item = itemsWithPermissions[i];
        setBulkOperationProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          operation: `Permanently deleting: ${item.name}`
        }));

        try {
          const response = await fetch(`/api/drive/files/${item.id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.text();
            failedItems.push(item.name);
            console.error(`Failed to permanently delete ${item.name}:`, response.status, errorData);
          }
        } catch (error) {
          failedItems.push(item.name);
          console.error(`Error permanently deleting ${item.name}:`, error);
        }

        if (i < itemsWithPermissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      let message = '';

      if (successCount > 0) {
        message += `${successCount} item${successCount > 1 ? 's' : ''} permanently deleted`;
      }

      if (skippedItems.length > 0) {
        if (message) message += ', ';
        message += `${skippedItems.length} item${skippedItems.length > 1 ? 's' : ''} skipped (no permission or not in trash)`;
      }

      if (failedItems.length > 0) {
        if (message) message += ', ';
        message += `${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed`;
      }

      if (successCount === itemsWithPermissions.length && skippedItems.length === 0) {
        toast.success(`Successfully deleted ${successCount} item${successCount > 1 ? 's' : ''} permanently`);
      } else if (successCount > 0 || skippedItems.length > 0) {
        const toastMessage = `Permanent delete completed: ${message}`;
        if (failedItems.length > 0 || skippedItems.length > 0) {
          toast.warning(toastMessage);
        } else {
          toast.success(toastMessage);
        }
        
        // Log details for debugging
        if (skippedItems.length > 0) {
          console.log('Skipped items (no permission):', skippedItems);
        }
        if (failedItems.length > 0) {
          console.log('Failed items:', failedItems);
        }
      } else {
        toast.error(`Failed to permanently delete items: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk permanent delete error:', error);
      toast.error('An error occurred during bulk permanent delete operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
    }
  };

  const fetchFiles = async (parentId?: string, query?: string, pageToken?: string, append = false, viewFilter?: string) => {
    const requestId = `fetch-files-${parentId || 'root'}-${query || ''}-${pageToken || ''}`;
    const startTime = Date.now();

    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (parentId) params.append('parentId', parentId);
      if (query) params.append('query', query);
      if (pageToken) params.append('pageToken', pageToken);

      // Add search query from input field
      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Add view filter parameters
      const currentView = viewFilter || activeView;
      if (currentView !== 'all') {
        params.append('view', currentView);
      }

      // Add file type filters
      if (fileTypeFilter.length > 0) {
        params.append('fileTypes', fileTypeFilter.join(','));
      }

      // Add advanced filters
      if (advancedFilters.sizeRange && (advancedFilters.sizeRange.min || advancedFilters.sizeRange.max)) {
        if (advancedFilters.sizeRange.min) {
          params.append('sizeMin', (advancedFilters.sizeRange.min * getSizeMultiplier(advancedFilters.sizeRange.unit)).toString());
        }
        if (advancedFilters.sizeRange.max) {
          params.append('sizeMax', (advancedFilters.sizeRange.max * getSizeMultiplier(advancedFilters.sizeRange.unit)).toString());
        }
      }

      if (advancedFilters.createdDateRange?.from) {
        params.append('createdAfter', advancedFilters.createdDateRange.from.toISOString());
      }
      if (advancedFilters.createdDateRange?.to) {
        params.append('createdBefore', advancedFilters.createdDateRange.to.toISOString());
      }

      if (advancedFilters.modifiedDateRange?.from) {
        params.append('modifiedAfter', advancedFilters.modifiedDateRange.from.toISOString());
      }
      if (advancedFilters.modifiedDateRange?.to) {
        params.append('modifiedBefore', advancedFilters.modifiedDateRange.to.toISOString());
      }

      if (advancedFilters.owner) {
        params.append('owner', advancedFilters.owner);
      }

      // Optimized page size for better performance
      params.append('pageSize', '50');

      console.log('=== Fetching files with params:', params.toString(), '===');

      // Simple fetch without request queue
      const response = await fetch(`/api/drive/files?${params}`);

      console.log('Drive API response status:', response.status);

      const responseText = await response.text();
      console.log('Drive API raw response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }
        console.error('Drive API error:', errorData);

        if (response.status === 400 && (errorData.error?.includes('Google Drive access not found') || errorData.needsReauth)) {
          setHasAccess(false);
          if (!append) {
            setFiles([]);
            setFolders([]);
          }
          return;
        }

        if (response.status === 401 || response.status === 403 || errorData.needsReauth) {
          setHasAccess(false);
          toast.error(errorData.error || 'Google Drive access expired. Please reconnect your account.');
          if (!append) {
            setFiles([]);
            setFolders([]);
          }
          return;
        }

        throw new Error(errorData.error || 'Failed to fetch files');
      }

      const data = JSON.parse(responseText);
      console.log('Drive API data received:', data);

      if (!data.files || !Array.isArray(data.files)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from Drive API');
      }

      // Store next page token for pagination
      setNextPageToken(data.nextPageToken || null);

      // Separate files and folders
      const fileList = data.files.filter((item: DriveFile) => 
        item.mimeType !== 'application/vnd.google-apps.folder'
      );
      const folderList = data.files.filter((item: DriveFile) => 
        item.mimeType === 'application/vnd.google-apps.folder'
      );

      console.log('Processed - Files:', fileList.length, 'Folders:', folderList.length);

      // Handle pagination: append or replace
      if (append) {
        setFiles(prev => {
          const newFiles = [...prev, ...fileList];
          // Files loaded for pagination
          return newFiles;
        });
        setFolders(prev => [...prev, ...folderList]);
      } else {
        setFiles(fileList);
        setFolders(folderList);

        // Initial files loaded

        // Process file organization for visible files
        [...fileList, ...folderList].forEach(item => {
          processFileOrganization(item);
        });
      }
      setHasAccess(true);

      if (fileList.length === 0 && folderList.length === 0 && !query && !parentId && !append) {
        console.log('No files found in root directory');
        toast.info('Google Drive connected! Your drive appears to be empty or all files are in subfolders.');
      } else {
        console.log(`Successfully loaded ${fileList.length + folderList.length} items`);
      }
    } catch (error) {
      console.error('Error fetching files:', error);

      handleError(error, 'Failed to fetch files');
      if (!append) {
        setFiles([]);
        setFolders([]);
      }
      // Don't set hasAccess to false here unless it's an auth error
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Optimized search input handler
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    // No timeout needed - using debounced value hook instead
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchFiles(undefined, searchQuery);
    } else {
      fetchFiles(currentFolderId || undefined);
    }
  };

  const handleViewChange = (view: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash') => {
    setActiveView(view);
    setCurrentFolderId(null); // Reset to root when changing views
    setSearchQuery(''); // Clear search
    
    // Clear selection when changing views
    setSelectedItems(new Set());
    setIsSelectMode(false);
    
    fetchFiles(undefined, undefined, undefined, false, view);
  };

  const handleFileTypeFilterChange = (newFileTypes: string[]) => {
    setFileTypeFilter(newFileTypes);
    // Refresh files with new filter
    fetchFiles(currentFolderId || undefined, searchQuery || undefined);
  };

  const handleAdvancedFiltersChange = (filters: any) => {
    setAdvancedFilters(filters);
    // Note: No need to call fetchFiles here as client-side filtering handles this
  };

  const handleFileTypeToggle = (type: string) => {
    setFileTypeFilter(prev => {
      const newFilter = prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type];
      return newFilter;
    });
    // Note: No need to call fetchFiles here as client-side filtering handles this
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
    setNextPageToken(null); // Reset pagination

    // Track folder access for navigation

    fetchFiles(folderId);
  };

  const handleFolderNavigation = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
    setNextPageToken(null); // Reset pagination
    fetchFiles(folderId || undefined);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setNextPageToken(null); // Reset pagination
    await fetchFiles(currentFolderId || undefined, undefined, undefined, false, activeView);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (nextPageToken && !loadingMore) {
      fetchFiles(currentFolderId || undefined, searchQuery || undefined, nextPageToken, true);
    }
  };

  const handleFileAction = async (action: string, fileId: string, fileName: string, additionalData?: any) => {
    try {
      console.log(`Performing action: ${action} on file: ${fileName} (${fileId})`);

      switch (action) {
        case 'preview':
          const previewFile = files.find(f => f.id === fileId);
          
          // Handle shortcuts differently - navigate/preview their targets internally
          if (previewFile?.mimeType === 'application/vnd.google-apps.shortcut') {
            try {
              // Fetch shortcut details to get target information
              const shortcutResponse = await fetch(`/api/drive/files/${fileId}/details`);
              if (shortcutResponse.ok) {
                const shortcutData = await shortcutResponse.json();
                const targetId = shortcutData.shortcutDetails?.targetId;
                const targetMimeType = shortcutData.shortcutDetails?.targetMimeType;
                
                if (targetId) {
                  // For folder shortcuts, navigate to the folder within the app
                  if (targetMimeType === 'application/vnd.google-apps.folder') {
                    handleFolderClick(targetId);
                  } else {
                    // For file shortcuts, try to preview the target file internally
                    try {
                      // Fetch the target file details to create a proper file object for preview
                      const targetFileResponse = await fetch(`/api/drive/files/${targetId}/details`);
                      if (targetFileResponse.ok) {
                        const targetFileData = await targetFileResponse.json();
                        
                        // Check if the target file is previewable
                        if (isPreviewable(targetFileData.mimeType)) {
                          // Create a file object from the target data and preview it
                          const targetFile = {
                            id: targetFileData.id,
                            name: targetFileData.name || `${fileName} (target)`,
                            mimeType: targetFileData.mimeType,
                            size: targetFileData.size,
                            createdTime: targetFileData.createdTime,
                            modifiedTime: targetFileData.modifiedTime,
                            webViewLink: targetFileData.webViewLink,
                            webContentLink: targetFileData.webContentLink,
                            thumbnailLink: targetFileData.thumbnailLink,
                            parents: targetFileData.parents,
                            owners: targetFileData.owners,
                            shared: targetFileData.shared,
                            trashed: targetFileData.trashed,
                            capabilities: targetFileData.capabilities
                          };
                          
                          setSelectedFileForPreview(targetFile);
                          setIsPreviewDialogOpen(true);
                        } else {
                          // If not previewable, show info and offer to download
                          toast.info(`Shortcut "${fileName}" points to "${targetFileData.name}" which cannot be previewed. Click download to get the file.`);
                          // Optionally trigger download of the target file
                          handleFileAction('download', targetId, targetFileData.name);
                        }
                      } else {
                        toast.error(`Shortcut target file not accessible. It may have been moved or deleted.`);
                      }
                    } catch (targetError) {
                      console.error('Error fetching shortcut target:', targetError);
                      toast.error(`Failed to access shortcut target for "${fileName}".`);
                    }
                  }
                } else {
                  toast.error(`"${fileName}" shortcut target not found.`);
                }
              } else {
                toast.error(`Failed to resolve shortcut "${fileName}".`);
              }
            } catch (error) {
              console.error('Error handling shortcut:', error);
              toast.error(`Failed to open shortcut "${fileName}".`);
            }
          } else if (previewFile && isPreviewable(previewFile.mimeType)) {
            setSelectedFileForPreview(previewFile);
            setIsPreviewDialogOpen(true);
          } else {
            // Fallback to Google Drive web view for non-previewable files
            const fallbackFile = files.find(f => f.id === fileId);
            if (fallbackFile?.webViewLink) {
              window.open(fallbackFile.webViewLink, '_blank');
            } else {
              toast.error(`"${fileName}" cannot be previewed. This file type may not support preview functionality.`);
            }
          }
          break;

        case 'download':
          // Check if it's a folder - folders cannot be downloaded
          const downloadFile = files.find(f => f.id === fileId);
          const downloadFolder = folders.find(f => f.id === fileId);

          if (downloadFolder || (downloadFile && downloadFile.mimeType === 'application/vnd.google-apps.folder')) {
            toast.warning(`Cannot download folders. "${fileName}" is a folder.`);
            return;
          }

          // Start progress tracking
          setSingleOperationProgress({
            isRunning: true,
            operation: `Downloading: ${fileName}`
          });

          try {
            // Direct download for all files (no hybrid strategy)
            console.log(`Downloading file: ${fileName}`);

            // Create download link directly to API endpoint
            const link = document.createElement('a');
            link.href = `/api/drive/download/${fileId}`;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Download initiated: "${fileName}"`);
          } finally {
            // Hide progress after 2 seconds
            setTimeout(() => {
              setSingleOperationProgress({ isRunning: false, operation: '' });
            }, 2000);
          }
          break;

        case 'rename':
          // Open rename dialog for both files and folders
          console.log('=== Rename Action Triggered ===');
          console.log('Item ID:', fileId);
          console.log('Item Name:', fileName);

          // Check if it's a file or folder
          const renameFile = files.find(f => f.id === fileId);
          const renameFolder = folders.find(f => f.id === fileId);
          const itemToRename = renameFile || renameFolder;

          console.log('Found file for rename:', renameFile);
          console.log('Found folder for rename:', renameFolder);
          console.log('Item to rename:', itemToRename);

          if (itemToRename) {
            const fileForAction = { 
              id: fileId, 
              name: fileName, 
              parentId: itemToRename.parents?.[0] 
            };
            console.log('Setting selected item for action:', fileForAction);
            setSelectedFileForAction(fileForAction);

            console.log('Opening rename dialog...');
            setIsRenameDialogOpen(true);
          } else {
            console.error('Item not found in current files or folders list');
            toast.error('Item not found');
          }
          break;

        case 'move':
          // Open move dialog for both files and folders
          console.log('=== Move Action Triggered ===');
          console.log('Item ID:', fileId);
          console.log('Item Name:', fileName);

          const moveFile = files.find(f => f.id === fileId);
          const moveFolder = folders.find(f => f.id === fileId);
          const itemToMove = moveFile || moveFolder;

          console.log('Found file for move:', moveFile);
          console.log('Found folder for move:', moveFolder);

          if (itemToMove) {
            const fileForAction = { 
              id: fileId, 
              name: fileName, 
              parentId: itemToMove.parents?.[0] 
            };
            console.log('Setting selected item for move:', fileForAction);
            setSelectedFileForAction(fileForAction);
            setIsMoveDialogOpen(true);
          } else {
            console.error('Item not found for move operation');
            toast.error('Item not found');
          }
          break;

        case 'copy':
          // Open copy dialog for both files and folders
          console.log('=== Copy Action Triggered ===');
          console.log('Item ID:', fileId);
          console.log('Item Name:', fileName);

          const copyFile = files.find(f => f.id === fileId);
          const copyFolder = folders.find(f => f.id === fileId);
          const itemToCopy = copyFile || copyFolder;

          console.log('Found file for copy:', copyFile);
          console.log('Found folder for copy:', copyFolder);

          if (itemToCopy) {
            const fileForAction = { 
              id: fileId, 
              name: fileName, 
              parentId: itemToCopy.parents?.[0] 
            };
            console.log('Setting selected item for copy:', fileForAction);
            setSelectedFileForAction(fileForAction);
            setIsCopyDialogOpen(true);
          } else {
            console.error('Item not found for copy operation');
            toast.error('Item not found');
          }
          break;

        case 'trash':
          console.log('=== Trash Action Triggered ===');
          console.log('Item ID:', fileId);
          console.log('Item Name:', fileName);

          // Start progress tracking
          setSingleOperationProgress({
            isRunning: true,
            operation: `Moving to trash: ${fileName}`
          });

          try {
            const trashResponse = await fetch(`/api/drive/files/${fileId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'trash' })
            });

            console.log('Trash response status:', trashResponse.status);

            if (!trashResponse.ok) {
              const errorData = await trashResponse.json();
              console.error('Trash failed:', errorData);

              if (errorData.needsReauth) {
                toast.error('Google Drive access expired. Please reconnect your account.');
                window.location.reload();
                return;
              }

              // Handle permission errors gracefully
              if (trashResponse.status === 403) {
                toast.error(`You don't have permission to move "${fileName}" to trash. This may be a shared file or folder with restricted access.`);
                return;
              }

              if (trashResponse.status === 404) {
                toast.error(`"${fileName}" was not found. It may have already been moved or deleted.`);
                await handleRefresh();
                return;
              }

              throw new Error(errorData.error || 'Failed to move to trash');
            }

            console.log('Trash successful');
            toast.success(`${fileName} moved to trash`);
            await handleRefresh();
          } finally {
            setSingleOperationProgress({ isRunning: false, operation: '' });
          }
          break;

        case 'restore':
          // Start progress tracking
          setSingleOperationProgress({
            isRunning: true,
            operation: `Restoring: ${fileName}`
          });

          try {
            const restoreResponse = await fetch(`/api/drive/files/${fileId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'restore' })
            });

            if (!restoreResponse.ok) {
              const errorData = await restoreResponse.json();
              if (errorData.needsReauth) {
                toast.error('Google Drive access expired. Please reconnect your account.');
                window.location.reload();
                return;
              }

              if (restoreResponse.status === 403) {
                toast.error(`You don't have permission to restore "${fileName}". This may be a shared file or folder with restricted access.`);
                return;
              }

              if (restoreResponse.status === 404) {
                toast.error(`"${fileName}" was not found in trash. It may have already been restored or permanently deleted.`);
                await handleRefresh();
                return;
              }

              throw new Error(errorData.error || 'Failed to restore file');
            }

            toast.success(`${fileName} restored from trash`);
            await handleRefresh();
          } finally {
            setSingleOperationProgress({ isRunning: false, operation: '' });
          }
          break;

        case 'permanentDelete':
          // Open permanent delete confirmation dialog
          console.log('=== Permanent Delete Action Triggered ===');
          console.log('Item ID:', fileId);
          console.log('Item Name:', fileName);

          const deleteFile = files.find(f => f.id === fileId);
          const deleteFolder = folders.find(f => f.id === fileId);
          const itemType = deleteFile ? 'file' : 'folder';

          setSelectedItemForDelete({ id: fileId, name: fileName, type: itemType });
          setIsPermanentDeleteDialogOpen(true);
          break;

        case 'details':
          // Open details dialog for both files and folders
          console.log('=== Details Action Triggered ===');
          console.log('Item ID:', fileId);
          console.log('Item Name:', fileName);

          const detailsFile = files.find(f => f.id === fileId);
          const detailsFolder = folders.find(f => f.id === fileId);
          const detailsItemType = detailsFile ? 'file' : 'folder';

          setSelectedItemForDetails({ id: fileId, name: fileName, type: detailsItemType });
          setIsDetailsDialogOpen(true);
          break;

        case 'share':
          console.log('=== Share Action Triggered ===');
          console.log('Item ID:', fileId);
          console.log('Item Name:', fileName);

          // Open enhanced share dialog with customizable privacy settings
          const shareFile = files.find(f => f.id === fileId);
          const shareFolder = folders.find(f => f.id === fileId);
          const shareItemType = shareFile ? 'file' : 'folder';

          setSelectedItemForShare({ id: fileId, name: fileName, type: shareItemType });
          setIsShareDialogOpen(true);
          break;

        default:
          console.warn(`Unknown action: ${action}`);
          toast.error('Unknown action');
          break;
      }
    } catch (error) {
      console.error('Error performing file action:', error);
      handleError(error, 'Failed to perform action');
    }
  };

  // Helper functions for dialog operations
  const handleRenameFile = async (newName: string) => {
    try {
      console.log('=== Rename File Operation ===');
      console.log('Selected file for action:', selectedFileForAction);
      console.log('New name:', newName);

      if (!selectedFileForAction) {
        console.error('No file selected for rename');
        toast.error('No file selected for rename');
        return;
      }

      if (!newName.trim()) {
        console.error('Empty filename provided');
        toast.error('Please provide a valid filename');
        return;
      }

      console.log(`Renaming file ${selectedFileForAction.id} to "${newName}"`);

      const renameResponse = await fetch(`/api/drive/files/${selectedFileForAction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({          action: 'rename',
          name: newName.trim()
        })
      });

      console.log('Rename response status:', renameResponse.status);

      if (!renameResponse.ok) {
        const errorData = await renameResponse.json();
        console.error('Rename failed:', errorData);

        if (errorData.needsReauth) {
          toast.error('Google Drive access expired. Please reconnect your account.');
          window.location.reload();
          return;
        }

        // Handle permission errors gracefully
        if (renameResponse.status === 403) {
          toast.error(`You don't have permission to rename "${selectedFileForAction.name}". This may be a shared file or folder with restricted access.`);
          return;
        }

        if (renameResponse.status === 404) {
          toast.error(`"${selectedFileForAction.name}" was not found. It may have already been moved or deleted.`);
          setIsRenameDialogOpen(false);
          setSelectedFileForAction(null);
          await handleRefresh();
          return;
        }

        throw new Error(errorData.error || 'Failed to rename file');
      }

      const result = await renameResponse.json();
      console.log('Rename successful:', result);

      toast.success(`File renamed to "${newName}"`);

      // Close the dialog
      setIsRenameDialogOpen(false);
      setSelectedFileForAction(null);

      // Refresh the file list
      await handleRefresh();
    } catch (error) {
      console.error('Error during rename operation:', error);
      handleError(error, 'Failed to rename file');
    }
  };

  const handleMoveFile = async (newParentId: string, currentParentId?: string) => {
    if (!selectedFileForAction) return;

    const moveResponse = await fetch(`/api/drive/files/${selectedFileForAction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'move',
        parentId: newParentId,
        currentParentId: currentParentId
      })
    });

    if (!moveResponse.ok) {
      const errorData = await moveResponse.json();
      if (errorData.needsReauth) {
        toast.error('Google Drive access expired. Please reconnect your account.');
        window.location.reload();
        return;
      }

      // Handle permission errors gracefully
      if (moveResponse.status === 403) {
        toast.error(`You don't have permission to move "${selectedFileForAction.name}". This may be a shared file or folder with restricted access.`);
        return;
      }

      if (moveResponse.status === 404) {
        toast.error(`"${selectedFileForAction.name}" was not found. It may have already been moved or deleted.`);
        await handleRefresh();
        return;
      }

      throw new Error(errorData.error || 'Failed to move file');
    }

    toast.success(`File moved successfully`);
    await handleRefresh();
  };

  const handleCopyFile = async (newName: string, parentId: string) => {
    try {
      if (!selectedFileForAction) {
        console.error('No file selected for copy');
        toast.error('No file selected for copy');
        return;
      }

      console.log('=== Copy File Operation ===');
      console.log('Selected file for copy:', selectedFileForAction);
      console.log('New name:', newName);
      console.log('Target parent ID:', parentId);

      const copyResponse = await fetch(`/api/drive/files/${selectedFileForAction.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          parentId: parentId
        })
      });

      console.log('Copy response status:', copyResponse.status);

      if (!copyResponse.ok) {
        const errorData = await copyResponse.json();
        console.error('Copy failed:', errorData);

        if (errorData.needsReauth) {
          toast.error('Google Drive access expired. Please reconnect your account.');
          window.location.reload();
          return;
        }

        // Handle permission errors gracefully
        if (copyResponse.status === 403) {
          toast.error(`You don't have permission to copy "${selectedFileForAction.name}". This may be a shared file or folder with restricted access.`);
          return;
        }

        if (copyResponse.status === 404) {
          toast.error(`"${selectedFileForAction.name}" was not found. It may have already been moved or deleted.`);
          await handleRefresh();
          return;
        }

        throw new Error(errorData.error || 'Failed to copy file');
      }

      const result = await copyResponse.json();
      console.log('Copy successful:', result);

      toast.success(`File copied as "${newName}"`);

      // Close the dialog
      setIsCopyDialogOpen(false);
      setSelectedFileForAction(null);

      // Refresh the file list
      await handleRefresh();
    } catch (error) {
      console.error('Error during copy operation:', error);
      handleError(error, 'Failed to copy file');
    }
  };

  const handleError = async (error: any, context: string) => {
    console.error(`${context}:`, error);

    // Handle authentication issues
    if (error.message?.includes('401') || 
        error.message?.includes('unauthorized') || 
        error.message?.includes('invalid_credentials') ||
        error.message?.includes('authentication')) {
      
      toast.error('Google Drive access expired. Please reconnect your account.');
      setNeedsReauth(true);
      return;
    }

    if (error.message?.includes('403') || error.message?.includes('forbidden')) {
      toast.error('Insufficient permissions. Please check your Google Drive access.');
      return;
    }

    toast.error(`${context}: ${error.message || 'An error occurred'}`);
  };

  // Auto-tagging and smart categorization function
  const processFileOrganization = (item: DriveFile | DriveFolder) => {
    // Example: Auto-tagging based on file type
    let tags: string[] = [];
    if (item.mimeType?.includes('document')) {
      tags.push('document');
    } else if (item.mimeType?.includes('spreadsheet')) {
      tags.push('spreadsheet');
    } else if (item.mimeType?.startsWith('image/')) {
      tags.push('image');
    }

    // Example: Smart categorization based on file name
    if (item.name?.toLowerCase().includes('report')) {
      tags.push('report');
    }

    // Add tags to the file's description or metadata
    if (tags.length > 0) {
      console.log(`Auto-tagging ${item.name}:`, tags);
      // You can implement a function to update the file's description
      // or metadata with these tags using the Google Drive API.
      // Example: updateFileMetadata(item.id, { tags: tags });
    }
  };

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      try {
        console.log('=== DriveManager: Starting access check ===');

        // Check if user just connected Drive (from URL parameter)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('connected') === 'true') {
          // Remove the parameter from URL
          window.history.replaceState({}, '', window.location.pathname);
          // Show success message
          toast.success('Google Drive connected successfully!');
        }

        // First check if we have Drive access
        console.log('Checking Drive access...');
        const accessResponse = await fetch('/api/auth/check-drive-access');
        const accessData = await accessResponse.json();

        console.log('Access check result:', accessData);

        if (!accessData.hasAccess) {
          console.log('No Drive access detected');
          setHasAccess(false);
          setDriveAccessError(accessData.error || 'Insufficient permissions');
          setLoading(false);
          return;
        }

        console.log('Drive access confirmed, fetching files...');
        // If we have access, fetch files
        await fetchFiles();
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking Drive access:', error);
        setHasAccess(false);
        setDriveAccessError(error);
        setLoading(false);
      }
    };

    checkAccessAndFetch();
  }, []);

  // Handle debounced search with optimized API calls
  useEffect(() => {
    if (debouncedSearchQuery.trim() !== searchQuery.trim()) {
      return; // Only trigger when debounced value matches current input
    }

    if (debouncedSearchQuery.trim()) {
      fetchFiles(currentFolderId, debouncedSearchQuery.trim());
    } else if (debouncedSearchQuery === '' && searchQuery === '') {
      fetchFiles(currentFolderId);
    }
  }, [debouncedSearchQuery, currentFolderId]);

  // Force re-render when filters change to update the visual display
  useEffect(() => {
    // This ensures the component re-renders when filter states change
    // which will update the filtered data display
    if (files.length > 0 || folders.length > 0) {
      // Force a minimal state update to trigger re-render
      setFiles(prev => [...prev]);
      setFolders(prev => [...prev]);
    }
  }, [fileTypeFilter, advancedFilters, activeView]);

  // Handle view mode change for toggle group
  const handleViewModeChange = (value: string) => {
    if (value && (value === 'grid' || value === 'table')) {
      setViewMode(value as 'grid' | 'table');
    }
  };

  // Fix server action issue and add sticky toolbar behavior
  useEffect(() => {
    // Clear any stale form data that might cause server action errors
    if (typeof window !== 'undefined') {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (form.getAttribute('action')?.includes('70dc89edfafce2312ceaab16a53e7187127e12a779')) {
          form.removeAttribute('action');
        }
      });

      // Android-style sticky toolbar behavior
      let lastScrollY = window.scrollY;
      let ticking = false;

      const updateToolbar = () => {
        const toolbar = document.getElementById('drive-toolbar');
        if (!toolbar) return;

        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down - hide toolbar
          toolbar.style.transform = 'translateY(-100%)';
        } else {
          // Scrolling up or at top - show toolbar
          toolbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
      };

      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(updateToolbar);
          ticking = true;
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', onScroll);
      };
    }
  }, []);

  // Show permission required card if no access to Google Drive
  if (hasAccess === false) {
    return (
      <DrivePermissionRequired 
        error={driveAccessError}
        onRetry={async () => {
          setLoading(true);
          setHasAccess(null);
          setDriveAccessError(null);
          
          try {
            const accessResponse = await fetch('/api/auth/check-drive-access');
            const accessData = await accessResponse.json();
            
            if (accessData.hasAccess) {
              await fetchFiles();
              setHasAccess(true);
            } else {
              setHasAccess(false);
              setDriveAccessError(accessData.error || 'Insufficient permissions');
            }
          } catch (error) {
            console.error('Retry error:', error);
            setHasAccess(false);
            setDriveAccessError(error);
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  if (loading && files.length === 0) {
    return (
      <div className="w-full space-y-3 sm:space-y-4">
        <DriveToolbarSkeleton />
        <DriveSearchSkeleton />
        <DriveBreadcrumbSkeleton />
        <div className="px-2 sm:px-0">
          <DriveGridSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* DriveManager Toolbar - Sticky with Android-style behavior */}
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
                          const isOwner = fileOrFolder.owners && fileOrFolder.owners.some(owner => owner.me === true);
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
                        <label className="text-xs font-medium text-muted-foreground">Owner (Name or Email)</label>
                        <Input
                          type="text"
                          placeholder="Enter owner name or email"
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
                            setActiveView('all');
                            setFileTypeFilter([]);
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
                        <Eye className="h-4 w-4 text-green-500" />
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
                        <Video className="h-4 w-4 text-red-500" />
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
                        <Music className="h-4 w-4 text-indigo-500" />
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
                        <Code className="h-4 w-4 text-emerald-500" />
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

                  {/* Spreadsheets */}
                  {sortedFiles.filter(f => f.mimeType?.includes('spreadsheet')).length > 0 && (
                    <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950/30 rounded-md">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Spreadsheets</span>
                      </div>
                      <Badge variant="outline" className="border-purple-500 text-purple-700 dark:text-purple-300">
                        {sortedFiles.filter(f => f.mimeType?.includes('spreadsheet')).length}
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
                    onClick={() => setSearchQuery('')}
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

      {/* Breadcrumb Navigation - Between toolbar and data */}
      <div className="px-4 py-3 bg-background border-b">
        <FileBreadcrumb
          currentFolderId={currentFolderId}
          loading={loading || refreshing}
          onNavigate={handleFolderNavigation}
        />
      </div>

      {/* Clean Data Container */}
      <Card>
        <CardContent className="p-0">

          {loading ? (
            <DriveGridSkeleton />
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex justify-center mb-4">
                <FileIcon mimeType="application/vnd.google-apps.folder" className="h-16 w-16" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No files found' : currentFolderId ? 'This folder is empty' : 'Your Google Drive is ready!'}
              </h3>
              <p className="text-sm">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : currentFolderId 
                    ? 'Upload files or create folders to get started'
                    : 'Upload files or create folders to get started, or check if your files are in subfolders'
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {/* Folders - using filtered/sorted data */}
              {sortedFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`border rounded-lg p-2 sm:p-3 md:p-4 hover:bg-accent cursor-pointer transition-colors relative ${
                    selectedItems.has(folder.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => isSelectMode ? toggleItemSelection(folder.id) : handleFolderClick(folder.id)}
                >
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.has(folder.id)}
                        onCheckedChange={() => toggleItemSelection(folder.id)}
                        className="bg-background !h-4 !w-4 !size-4"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className={`flex items-center ${isSelectMode ? 'ml-6' : ''}`}>
                      <FileIcon mimeType="application/vnd.google-apps.folder" className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(() => {
                          const actions = getFileActions(folder, activeView);
                          return (
                            <>
                              {actions.canRename && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('rename', folder.id, folder.name);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                              )}

                              {actions.canMove && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('move', folder.id, folder.name);
                                }}>
                                  <Move className="h-4 w-4 mr-2" />
                                  Move
                                </DropdownMenuItem>
                              )}

                              {actions.canCopy && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('copy', folder.id, folder.name);
                                }}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                              )}

                              {actions.canShare && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('share', folder.id, folder.name);
                                }}>
                                  <Share className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                              )}

                              {actions.canDetails && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('details', folder.id, folder.name);
                                }}>
                                  <Info className="h-4 w-4 mr-2" />
                                  Details
                                </DropdownMenuItem>
                              )}

                              {(actions.canTrash || actions.canRestore || actions.canPermanentDelete) && <DropdownMenuSeparator />}

                              {actions.canRestore && (
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileAction('restore', folder.id, folder.name);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              )}

                              {actions.canTrash && (
                                <DropdownMenuItem 
                                  className="text-orange-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileAction('trash', folder.id, folder.name);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Move to Trash
                                </DropdownMenuItem>
                              )}

                              {actions.canPermanentDelete && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileAction('permanentDelete', folder.id, folder.name);
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Permanently Delete
                                </DropdownMenuItem>
                              )}
                            </>
                          );
                        })()}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium truncate text-xs sm:text-sm md:text-base" title={folder.name}>{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileTime(folder.modifiedTime, timezone)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Files - using filtered/sorted data */}
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`border rounded-lg p-2 sm:p-3 md:p-4 hover:bg-accent transition-colors relative cursor-pointer ${
                    selectedItems.has(file.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => isSelectMode ? toggleItemSelection(file.id) : undefined}
                >
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.has(file.id)}
                        onCheckedChange={() => toggleItemSelection(file.id)}
                        className="bg-background !h-4 !w-4 !size-4"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className={`flex items-center ${isSelectMode ? 'ml-6' : ''}`}>
                      <FileThumbnailPreview
                        thumbnailLink={file.thumbnailLink}
                        fileName={file.name}
                        mimeType={file.mimeType}
                        className="transition-all duration-200"
                      >
                        <FileIcon mimeType={file.mimeType} className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                      </FileThumbnailPreview>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(() => {
                          const actions = getFileActions(file, activeView);
                          return (
                            <>
                              {actions.canPreview && isPreviewable(file.mimeType) && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('preview', file.id, file.name);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                              )}

                              {actions.canDownload && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('download', file.id, file.name);
                                }}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}

                              {actions.canRename && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('rename', file.id, file.name);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                              )}

                              {actions.canMove && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('move', file.id, file.name);
                                }}>
                                  <Move className="h-4 w-4 mr-2" />
                                  Move
                                </DropdownMenuItem>
                              )}

                              {actions.canCopy && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('copy', file.id, file.name);
                                }}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                              )}

                              {actions.canShare && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('share', file.id, file.name);
                                }}>
                                  <Share className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                              )}

                              {actions.canDetails && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('details', file.id, file.name);
                                }}>
                                  <Info className="h-4 w-4 mr-2" />
                                  Details
                                </DropdownMenuItem>
                              )}

                              {(actions.canTrash || actions.canRestore || actions.canPermanentDelete) && <DropdownMenuSeparator />}

                              {actions.canRestore && (
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileAction('restore', file.id, file.name);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              )}

                              {actions.canTrash && (
                                <DropdownMenuItem 
                                  className="text-orange-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileAction('trash', file.id, file.name);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Move to Trash
                                </DropdownMenuItem>
                              )}

                              {actions.canPermanentDelete && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileAction('permanentDelete', file.id, file.name);
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Permanently Delete
                                </DropdownMenuItem>
                              )}
                            </>
                          );
                        })()}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1">
                    <div className="space-y-1">
                      <p 
                        className="font-medium truncate text-xs sm:text-sm md:text-base cursor-pointer hover:text-blue-600 hover:underline" 
                        title={`Click to ${file.mimeType === 'application/vnd.google-apps.shortcut' ? 'open shortcut' : 'preview'}: ${file.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (file.mimeType === 'application/vnd.google-apps.shortcut') {
                            handleFileAction('preview', file.id, file.name);
                          } else if (isPreviewable(file.mimeType)) {
                            handleFileAction('preview', file.id, file.name);
                          } else {
                            handleFileAction('download', file.id, file.name);
                          }
                        }}
                      >
                        {file.name}
                      </p>
                      {file.mimeType === 'application/vnd.google-apps.shortcut' && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 w-fit">
                          <Link className="h-3 w-3 mr-1" />
                          Shortcut
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-muted-foreground">
                      <span>{file.size ? formatFileSize(file.size) : '-'}</span>
                      <span>{formatFileTime(file.modifiedTime, timezone)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      {isSelectMode && (
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedItems.size === folders.length + files.length && folders.length + files.length > 0}
                            onCheckedChange={selectedItems.size === folders.length + files.length ? deselectAll : selectAll}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </div>
                      )}
                    </TableHead>
                    {visibleColumns.name && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('name')}
                          className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start w-full"
                        >
                          Name
                          <span className="ml-1 opacity-60">{getSortIcon('name')}</span>
                        </Button>
                      </TableHead>
                    )}
                    {visibleColumns.id && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('id')}
                          className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start w-full"
                        >
                          ID
                          <span className="ml-1 opacity-60">{getSortIcon('id')}</span>
                        </Button>
                      </TableHead>
                    )}
                    {visibleColumns.size && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('size')}
                          className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start w-full"
                        >
                          Size
                          <span className="ml-1 opacity-60">{getSortIcon('size')}</span>
                        </Button>
                      </TableHead>
                    )}
                    {visibleColumns.owners && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('owners')}
                          className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start w-full"
                        >
                          Owners
                          <span className="ml-1 opacity-60">{getSortIcon('owners')}</span>
                        </Button>
                      </TableHead>
                    )}
                    {visibleColumns.mimeType && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('mimeType')}
                          className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start w-full"
                        >
                          Type
                          <span className="ml-1 opacity-60">{getSortIcon('mimeType')}</span>
                        </Button>
                      </TableHead>
                    )}
                    {visibleColumns.createdTime && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('createdTime')}
                          className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start w-full"
                        >
                          Created
                          <span className="ml-1 opacity-60">{getSortIcon('createdTime')}</span>
                        </Button>
                      </TableHead>
                    )}
                    {visibleColumns.modifiedTime && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('modifiedTime')}
                          className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start w-full"
                        >
                          Modified
                          <span className="ml-1 opacity-60">{getSortIcon('modifiedTime')}</span>
                        </Button>
                      </TableHead>
                    )}
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* All items (folders and files) sorted together */}
                  {sortedAllItems.map((item) => (
                    <TableRow 
                      key={item.id}
                      className={`cursor-pointer hover:bg-accent transition-colors ${
                        selectedItems.has(item.id) ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => isSelectMode ? toggleItemSelection(item.id) : (item.itemType === 'folder' ? handleFolderClick(item.id) : undefined)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isSelectMode && (
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          )}
                          <FileThumbnailPreview
                            thumbnailLink={item.itemType === 'file' ? item.thumbnailLink : undefined}
                            fileName={item.name}
                            mimeType={item.itemType === 'folder' ? 'application/vnd.google-apps.folder' : item.mimeType}
                            className="transition-all duration-200"
                          >
                            <FileIcon 
                              mimeType={item.itemType === 'folder' ? 'application/vnd.google-apps.folder' : item.mimeType} 
                              className="h-4 w-4" 
                            />
                          </FileThumbnailPreview>
                        </div>
                      </TableCell>
                      {visibleColumns.name && (
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {item.itemType === 'folder' ? (
                              <span className="truncate">{item.name}</span>
                            ) : (
                              <span 
                                className="truncate hover:text-blue-600 hover:underline"
                                title={`Click to ${item.mimeType === 'application/vnd.google-apps.shortcut' ? 'open shortcut' : 'preview'}: ${item.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.mimeType === 'application/vnd.google-apps.shortcut') {
                                    handleFileAction('preview', item.id, item.name);
                                  } else if (isPreviewable(item.mimeType)) {
                                    handleFileAction('preview', item.id, item.name);
                                  } else {
                                    handleFileAction('download', item.id, item.name);
                                  }
                                }}
                              >
                                {item.name}
                              </span>
                            )}
                            {item.itemType === 'folder' && <Badge variant="outline" className="text-xs">Folder</Badge>}
                            {item.itemType === 'file' && item.shared && <Badge variant="secondary" className="text-xs">Shared</Badge>}
                            {item.itemType === 'file' && item.mimeType === 'application/vnd.google-apps.shortcut' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                                <Link className="h-3 w-3 mr-1" />
                                Shortcut
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.id && (
                        <TableCell className="text-muted-foreground">
                          <code className="text-xs bg-muted px-1 rounded">{item.id}</code>
                        </TableCell>
                      )}
                      {visibleColumns.size && (
                        <TableCell className="text-muted-foreground">
                          {item.itemType === 'folder' ? '-' : (item.size ? formatFileSize(item.size) : '-')}
                        </TableCell>
                      )}
                      {visibleColumns.owners && (
                        <TableCell className="text-muted-foreground">
                          {item.owners?.map(owner => owner.displayName || owner.emailAddress).join(', ') || '-'}
                        </TableCell>
                      )}
                      {visibleColumns.mimeType && (
                        <TableCell className="text-muted-foreground">
                          {item.itemType === 'folder' ? (
                            <Badge variant="secondary" className="text-xs">Folder</Badge>
                          ) : (
                            <code className="text-xs bg-muted px-1 rounded">{item.mimeType}</code>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.createdTime && (
                        <TableCell className="text-muted-foreground">
                          {formatFileTime(item.createdTime, timezone)}
                        </TableCell>
                      )}
                      {visibleColumns.modifiedTime && (
                        <TableCell className="text-muted-foreground">
                          {formatFileTime(item.modifiedTime, timezone)}
                        </TableCell>
                      )}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(() => {
                              const actions = getFileActions(item, activeView);
                              return (
                                <>
                                  {item.itemType === 'file' && actions.canPreview && isPreviewable(item.mimeType) && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileAction('preview', item.id, item.name);
                                    }}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                  )}

                                  {item.itemType === 'file' && actions.canDownload && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileAction('download', item.id, item.name);
                                    }}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                  )}

                                  {actions.canRename && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileAction('rename', item.id, item.name);
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                  )}

                                  {actions.canMove && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileAction('move', item.id, item.name);
                                    }}>
                                      <Move className="h-4 w-4 mr-2" />
                                      Move
                                    </DropdownMenuItem>
                                  )}

                                  {actions.canCopy && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileAction('copy', item.id, item.name);
                                    }}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy
                                    </DropdownMenuItem>
                                  )}

                                  {actions.canShare && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileAction('share', item.id, item.name);
                                    }}>
                                      <Share className="h-4 w-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                  )}

                                  {actions.canDetails && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileAction('details', item.id, item.name);
                                    }}>
                                      <Info className="h-4 w-4 mr-2" />
                                      Details
                                    </DropdownMenuItem>
                                  )}

                                  {(actions.canTrash || actions.canRestore || actions.canPermanentDelete) && <DropdownMenuSeparator />}

                                  {actions.canRestore && (
                                    <DropdownMenuItem 
                                      className="text-green-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileAction('restore', item.id, item.name);
                                      }}
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Restore
                                    </DropdownMenuItem>
                                  )}

                                  {actions.canTrash && (
                                    <DropdownMenuItem 
                                      className="text-orange-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileAction('trash', item.id, item.name);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Move to Trash
                                    </DropdownMenuItem>
                                  )}

                                  {actions.canPermanentDelete && (
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileAction('permanentDelete', item.id, item.name);
                                      }}
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Permanently Delete
                                    </DropdownMenuItem>
                                  )}
                                </>
                              );
                            })()}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Load More Button */}
          {nextPageToken && !loading && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full max-w-xs"
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
        </CardContent>
      </Card>

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
        onFolderCreated={() => {
          setIsCreateFolderDialogOpen(false);
          handleRefresh();
        }}
        parentFolderId={currentFolderId}
      />

      <FileRenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => {
          setIsRenameDialogOpen(false);
          setSelectedFileForAction(null);
        }}
        fileName={selectedFileForAction?.name || ''}
        onRename={handleRenameFile}
      />

      <FileMoveDialog
        isOpen={isMoveDialogOpen}
        onClose={() => {
          setIsMoveDialogOpen(false);
          setSelectedFileForAction(null);
        }}
        fileName={selectedFileForAction?.name || ''}
        currentParentId={selectedFileForAction?.parentId || null}
        onMove={handleMoveFile}
      />

      <FileCopyDialog
        isOpen={isCopyDialogOpen}
        onClose={() => {
          setIsCopyDialogOpen(false);
          setSelectedFileForAction(null);
        }}
        fileName={selectedFileForAction?.name || ''}
        currentParentId={selectedFileForAction?.parentId || null}
        onCopy={handleCopyFile}
      />

      <PermanentDeleteDialog
        open={isPermanentDeleteDialogOpen}
        onOpenChange={setIsPermanentDeleteDialogOpen}
        itemId={selectedItemForDelete?.id || null}
        itemName={selectedItemForDelete?.name || null}
        itemType={selectedItemForDelete?.type || 'file'}
        onSuccess={async () => {
          await handleRefresh();
          setSelectedItemForDelete(null);
        }}
      />

      <FileDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedItemForDetails(null);
        }}
        fileId={selectedItemForDetails?.id || ''}
        fileName={selectedItemForDetails?.name || ''}
        fileType={selectedItemForDetails?.type || 'file'}
      />

      <FilePreviewDialog
        open={isPreviewDialogOpen}
        onClose={() => {
          setIsPreviewDialogOpen(false);
          setSelectedFileForPreview(null);
        }}
        file={selectedFileForPreview}
      />

      {/* Bulk Operation Dialogs */}
      <BulkDeleteDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        selectedItems={getSelectedItemsData()}
      />

      <BulkMoveDialog
        isOpen={isBulkMoveDialogOpen}
        onClose={() => setIsBulkMoveDialogOpen(false)}
        onConfirm={handleBulkMove}
        selectedItems={getSelectedItemsData()}
      />

      <BulkCopyDialog
        isOpen={isBulkCopyDialogOpen}
        onClose={() => setIsBulkCopyDialogOpen(false)}
        onConfirm={handleBulkCopy}
        selectedItems={getSelectedItemsData()}
      />

      <BulkExportDialog
        isOpen={isBulkExportDialogOpen}
        onClose={() => setIsBulkExportDialogOpen(false)}
        onConfirm={handleBulkExport}
        selectedItems={getSelectedItemsData()}
      />

      <BulkRenameDialog
        isOpen={isBulkRenameDialogOpen}
        onClose={() => setIsBulkRenameDialogOpen(false)}
        onConfirm={handleBulkRename}
        selectedItems={getSelectedItemsData()}
      />

      <BulkRestoreDialog
        isOpen={isBulkRestoreDialogOpen}
        onClose={() => setIsBulkRestoreDialogOpen(false)}
        onConfirm={handleBulkRestore}
        selectedItems={getSelectedItemsData()}
      />

      {/* Enhanced Bulk Permanent Delete Dialog with Security Features */}
      <BulkPermanentDeleteDialog
        isOpen={isBulkPermanentDeleteDialogOpen}
        onClose={() => setIsBulkPermanentDeleteDialogOpen(false)}
        onConfirm={handleBulkPermanentDelete}
        selectedItems={getSelectedItemsData()}
      />

      {/* Enhanced Bulk Operations Progress Indicator */}
      {bulkOperationProgress.isRunning && (
        <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg p-4 shadow-lg min-w-[320px] max-w-[90vw] md:max-w-[400px]">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-primary/10">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium mb-1 truncate" title={bulkOperationProgress.operation}>
                {bulkOperationProgress.operation}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{bulkOperationProgress.current} of {bulkOperationProgress.total} items</span>
                <span className="font-medium">{Math.round((bulkOperationProgress.current / bulkOperationProgress.total) * 100)}%</span>
              </div>
              <Progress 
                value={(bulkOperationProgress.current / bulkOperationProgress.total) * 100} 
                className="h-2"
              />
              {bulkOperationProgress.total > 5 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {bulkOperationProgress.total - bulkOperationProgress.current} remaining
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single Operation Progress Indicator */}
      {singleOperationProgress.isRunning && !bulkOperationProgress.isRunning && (
        <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg p-4 shadow-lg min-w-[280px] max-w-[90vw] md:max-w-[350px]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-primary/10">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" title={singleOperationProgress.operation}>
                {singleOperationProgress.operation}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1 w-1 bg-primary rounded-full animate-pulse"></div>
                <div className="h-1 w-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-1 w-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-xs text-muted-foreground ml-1">Processing...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Share Dialog */}
      <FileShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        item={selectedItemForShare}
        items={selectedItemForShare?.id === 'bulk' ? getSelectedItemsData() : undefined}
        onShare={handleShare}
      />

      {/* Bulk Share Dialog */}
      <BulkShareDialog
        open={isBulkShareDialogOpen}
        onOpenChange={setIsBulkShareDialogOpen}
        selectedItems={getSelectedItemsData()}
        onShare={handleBulkShare}
      />

      {/* Mobile Bottom Sheets for Enhanced Touch Experience */}
      <MobileActionsBottomSheet
        open={isMobileActionsOpen}
        onOpenChange={setIsMobileActionsOpen}
        selectedCount={selectedItems.size}
        selectedItems={getSelectedItemsData()}
        isInTrash={activeView === 'trash' || searchQuery.includes('trashed:true')}
        onBulkDownload={handleBulkDownload}
        onBulkDelete={() => setIsBulkDeleteDialogOpen(true)}
        onBulkMove={() => setIsBulkMoveDialogOpen(true)}
        onBulkCopy={() => setIsBulkCopyDialogOpen(true)}
        onBulkRename={() => setIsBulkRenameDialogOpen(true)}
        onBulkExport={() => setIsBulkExportDialogOpen(true)}
        onBulkShare={() => {
          // Always use enhanced share dialog for better UI
          const selectedItemsData = getSelectedItemsData();
          if (selectedItemsData.length === 1 && selectedItemsData[0]) {
            setSelectedItemForShare({
              id: selectedItemsData[0].id,
              name: selectedItemsData[0].name,
              type: selectedItemsData[0].type as 'file' | 'folder'
            });
          } else {
            setSelectedItemForShare({
              id: 'bulk',
              name: `${selectedItemsData.length} items`,
              type: 'file'
            });
          }
          setIsShareDialogOpen(true);
        }}
        onBulkRestore={() => setIsBulkRestoreDialogOpen(true)}
        onBulkPermanentDelete={() => setIsBulkPermanentDeleteDialogOpen(true)}
        onDeselectAll={deselectAll}
      />

      <FiltersDialog
        open={isMobileFiltersOpen}
        onOpenChange={setIsMobileFiltersOpen}
        onFilterChange={(filters: any) => {
          if (filters.activeView) {
            handleViewChange(filters.activeView);
          }
          if (filters.fileTypeFilter) {
            setFileTypeFilter(filters.fileTypeFilter);
          }
          if (filters.advancedFilters) {
            setAdvancedFilters(filters.advancedFilters);
          }
        }}
        currentFilters={{
          activeView,
          fileTypeFilter,
          advancedFilters
        }}
        hasActiveFilters={!!hasActiveFilters}
        onClearFilters={clearAllFilters}
      />

    </div>
  );
}