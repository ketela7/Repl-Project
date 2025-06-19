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
  Star
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
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { formatFileSize, formatDate, isPreviewable, getFileActions } from '@/lib/google-drive/utils';
import { FileIcon } from '@/components/file-icon';
import { toast } from "sonner";
import { useDebouncedValue } from '@/hooks/use-debounced-value';
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
import { LoadingSkeleton, BreadcrumbLoadingSkeleton } from '@/components/ui/loading-skeleton';
import { LazyImage } from '@/components/ui/lazy-image';
import { BulkActionsToolbar } from './bulk-actions-toolbar';
import { BulkDeleteDialog } from './bulk-delete-dialog';
import { BulkMoveDialog } from './bulk-move-dialog';
import { BulkExportDialog } from './bulk-export-dialog';
import { BulkRenameDialog } from './bulk-rename-dialog';
import { BulkRestoreDialog } from './bulk-restore-dialog';
import { BulkPermanentDeleteDialog } from './bulk-permanent-delete-dialog';
import { BulkCopyDialog } from './bulk-copy-dialog';
import { DriveFiltersSidebar } from './drive-filters-sidebar';
import { FileThumbnailPreview } from '@/components/ui/file-thumbnail-preview';

import { DriveErrorDisplay } from '@/components/drive-error-display';
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

  return { filteredFiles, filteredFolders };
};

// This function is deprecated - now using getFileActions from utils

export function DriveManager() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
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

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedItemsData.length,
      operation: 'Moving to trash'
    });

    let successCount = 0;
    let failedItems: string[] = [];

    try {
      for (let i = 0; i < selectedItemsData.length; i++) {
        const item = selectedItemsData[i];
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));

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
        if (i < selectedItemsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show result notification
      if (successCount === selectedItemsData.length) {
        toast.success(`Successfully moved ${successCount} item${successCount > 1 ? 's' : ''} to trash`);
      } else if (successCount > 0) {
        toast.warning(`Moved ${successCount} items to trash. ${failedItems.length} items failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      } else {
        toast.error(`Failed to move items to trash: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('An error occurred during bulk delete operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
      setIsBulkDeleteDialogOpen(false);
    }
  };

  const handleBulkMove = async (targetFolderId: string) => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedItemsData.length,
      operation: 'Moving items'
    });

    let successCount = 0;
    let failedItems: string[] = [];

    try {
      for (let i = 0; i < selectedItemsData.length; i++) {
        const item = selectedItemsData[i];
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));

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
        if (i < selectedItemsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show result notification
      if (successCount === selectedItemsData.length) {
        toast.success(`Successfully moved ${successCount} item${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.warning(`Moved ${successCount} items. ${failedItems.length} items failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      } else {
        toast.error(`Failed to move items: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk move error:', error);
      toast.error('An error occurred during bulk move operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
      setIsBulkMoveDialogOpen(false);
    }
  };

  const handleBulkCopy = async (targetFolderId: string) => {
    const selectedItemsData = getSelectedItemsData().filter(item => item.type === 'file');
    if (selectedItemsData.length === 0) {
      toast.warning('No files selected for copying. Only files can be copied.');
      setIsBulkCopyDialogOpen(false);
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedItemsData.length,
      operation: 'Copying files'
    });

    let successCount = 0;
    let failedItems: string[] = [];

    try {
      for (let i = 0; i < selectedItemsData.length; i++) {
        const item = selectedItemsData[i];
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));

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
        if (i < selectedItemsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      // Show result notification
      if (successCount === selectedItemsData.length) {
        toast.success(`Successfully copied ${successCount} file${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.warning(`Copied ${successCount} files. ${failedItems.length} items failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      } else {
        toast.error(`Failed to copy files: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk copy error:', error);
      toast.error('An error occurred during bulk copy operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
      setIsBulkCopyDialogOpen(false);
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
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));

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

    if (exportableFiles.length === 0) {
      toast.warning('No Google Workspace files selected for export.');
      setIsBulkExportDialogOpen(false);
      return;
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: exportableFiles.length,
      operation: 'Exporting files'
    });

    let successCount = 0;
    let failedItems: string[] = [];

    try {
      for (let i = 0; i < exportableFiles.length; i++) {
        const item = exportableFiles[i];
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));

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
        toast.success(`Successfully exported ${successCount} file${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.warning(`Exported ${successCount} files. ${failedItems.length} files failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      } else {
        toast.error(`Failed to export files: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk export error:', error);
      toast.error('An error occurred during bulk export operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
      setIsBulkExportDialogOpen(false);
    }
  };

  const handleBulkRename = async (renamePattern: string, renameType: string) => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedItemsData.length,
      operation: 'Renaming items'
    });

    let successCount = 0;
    let failedItems: string[] = [];

    try {
      for (let i = 0; i < selectedItemsData.length; i++) {
        const item = selectedItemsData[i];
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));

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

      if (successCount === selectedItemsData.length) {
        toast.success(`Successfully renamed ${successCount} item${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.warning(`Renamed ${successCount} items. ${failedItems.length} items failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      } else {
        toast.error(`Failed to rename items: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk rename error:', error);
      toast.error('An error occurred during bulk rename operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
      setIsBulkRenameDialogOpen(false);
    }
  };

  const handleBulkRestore = async () => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedItemsData.length,
      operation: 'Restoring items'
    });

    let successCount = 0;
    let failedItems: string[] = [];

    try {
      for (let i = 0; i < selectedItemsData.length; i++) {
        const item = selectedItemsData[i];
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));

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

        if (i < selectedItemsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      if (successCount === selectedItemsData.length) {
        toast.success(`Successfully restored ${successCount} item${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.warning(`Restored ${successCount} items. ${failedItems.length} items failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      } else {
        toast.error(`Failed torestore items: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk restore error:', error);
      toast.error('An error occurred during bulk restore operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
      setIsBulkRestoreDialogOpen(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    const selectedItemsData = getSelectedItemsData();
    if (selectedItemsData.length === 0) return;

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: selectedItemsData.length,
      operation: 'Permanently deleting items'
    });

    let successCount = 0;
    let failedItems: string[] = [];

    try {
      for (let i = 0; i < selectedItemsData.length; i++) {
        const item = selectedItemsData[i];
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));

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

        if (i < selectedItemsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      await fetchFiles(currentFolderId, searchQuery);
      deselectAll();
      setIsSelectMode(false);

      if (successCount === selectedItemsData.length) {
        toast.success(`Successfully deleted ${successCount} item${successCount > 1 ? 's' : ''} permanently`);
      } else if (successCount > 0) {
        toast.warning(`Deleted ${successCount} items permanently. ${failedItems.length} items failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      } else {
        toast.error(`Failed to delete items permanently: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('Bulk permanent delete error:', error);
      toast.error('An error occurred during bulk permanent delete operation');
    } finally {
      setBulkOperationProgress({ isRunning: false, current: 0, total: 0, operation: '' });
      setIsBulkPermanentDeleteDialogOpen(false);
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
    fetchFiles(undefined, undefined, undefined, false, view);
  };

  const handleFileTypeFilterChange = (newFileTypes: string[]) => {
    setFileTypeFilter(newFileTypes);
    // Refresh files with new filter
    fetchFiles(currentFolderId || undefined, searchQuery || undefined);
  };

  const handleAdvancedFiltersChange = (filters: any) => {
    setAdvancedFilters(filters);
    // Refresh files with new advanced filters
    fetchFiles(currentFolderId || undefined, searchQuery || undefined);
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
    setNextPageToken(null); // Reset pagination

    // Track folder access for navigation

    fetchFiles(folderId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setNextPageToken(null); // Reset pagination
    await fetchFiles(currentFolderId || undefined, searchQuery || undefined);
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
          if (previewFile && isPreviewable(previewFile.mimeType)) {
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
          break;

        case 'restore':
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

          const shareResponse = await fetch(`/api/drive/files/${fileId}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'get_share_link',
              role: 'reader',
              type: 'anyone' 
            })
          });

          console.log('Share response status:', shareResponse.status);

          if (!shareResponse.ok) {
            const errorData = await shareResponse.json();
            console.error('Share failed:', errorData);

            if (errorData.needsReauth) {
              toast.error('Google Drive access expired. Please reconnect your account.');
              window.location.reload();
              return;
            }

            if (shareResponse.status === 403) {
              toast.error(`You don't have permission to share "${fileName}". This may be a file or folder with restricted sharing access.`);
              return;
            }

            if (shareResponse.status === 404) {
              toast.error(`"${fileName}" was not found. It may have been moved or deleted.`);
              await handleRefresh();
              return;
            }

            throw new Error(errorData.error || 'Failed to get share link');
          }

          const shareResult = await shareResponse.json();
          console.log('Share successful:', shareResult);

          if (shareResult.webViewLink) {
            // Copy to clipboard
            try {
              await navigator.clipboard.writeText(shareResult.webViewLink);
              toast.success(`Share link for "${fileName}" copied to clipboard!`);
            } catch (clipboardError) {
              console.error('Failed to copy to clipboard:', clipboardError);
              // Fallback - show the link in a temporary dialog or toast
              toast.success(`Share link generated for "${fileName}": ${shareResult.webViewLink}`);
            }
          } else {
            toast.error('Failed to generate share link');
          }
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

  // Handle view mode change for toggle group
  const handleViewModeChange = (value: string) => {
    if (value && (value === 'grid' || value === 'table')) {
      setViewMode(value as 'grid' | 'table');
    }
  };

    // Fix server action issue
    useEffect(() => {
      // Clear any stale form data that might cause server action errors
      if (typeof window !== 'undefined') {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
          if (form.getAttribute('action')?.includes('70dc89edfafce2312ceaab16a53e7187127e12a779')) {
            form.removeAttribute('action');
          }
        });
      }
    }, []);

  // Show connection card if no access to Google Drive
  if (hasAccess === false) {
    return <DriveConnectionCard />;
  }

  if (loading && files.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <Input
              placeholder="Search files and folders..."
              value=""
              disabled
              className="text-sm"
            />
            <Button size="sm" variant="outline" disabled>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <BreadcrumbLoadingSkeleton />
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>
              <LoadingSkeleton count={1} type="list" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeleton count={8} type={viewMode} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Floating Toolbar - Sticky Horizontal Scroll */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm mb-6">
        <div className="flex items-center justify-between p-4">
          {/* Horizontal Scrollable Tabs */}
          <div className="flex items-center gap-2 overflow-x-scroll scrollbar-hide scroll-smooth flex-1" 
               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            
            {/* Search Tab */}
            <Button
              variant={searchQuery ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              onClick={() => {
                if (!searchQuery) {
                  // Focus on search when activated
                  setTimeout(() => {
                    const input = document.querySelector('#floating-search-input') as HTMLInputElement;
                    if (input) input.focus();
                  }, 100);
                }
              }}
            >
              <Search className="h-4 w-4" />
              Search
            </Button>

            {/* Batch Operations Tab */}
            <Button
              variant={selectedItems.size > 0 ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              onClick={() => setIsSelectMode(!isSelectMode)}
              disabled={sortedFiles.length === 0 && sortedFolders.length === 0}
            >
              <Square className="h-4 w-4" />
              Batch
              {selectedItems.size > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedItems.size}
                </Badge>
              )}
            </Button>

            {/* Quick Filter Buttons */}
            <Button
              variant={activeView === 'starred' ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              onClick={() => handleViewChange(activeView === 'starred' ? 'all' : 'starred')}
            >
              <Star className="h-4 w-4" />
              Starred
            </Button>

            <Button
              variant={activeView === 'shared' ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              onClick={() => handleViewChange(activeView === 'shared' ? 'all' : 'shared')}
            >
              <Share className="h-4 w-4" />
              Shared
            </Button>

            <Button
              variant={activeView === 'recent' ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              onClick={() => handleViewChange(activeView === 'recent' ? 'all' : 'recent')}
            >
              <Calendar className="h-4 w-4" />
              Recent
            </Button>

            <Button
              variant={activeView === 'trash' ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              onClick={() => handleViewChange(activeView === 'trash' ? 'all' : 'trash')}
            >
              <Trash2 className="h-4 w-4" />
              Trash
            </Button>

            {/* File Type Filters */}
            <Button
              variant={fileTypeFilter.includes('document') ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              onClick={() => {
                const newFilter = fileTypeFilter.includes('document') 
                  ? fileTypeFilter.filter(f => f !== 'document')
                  : [...fileTypeFilter, 'document'];
                handleFileTypeFilterChange(newFilter);
              }}
            >
              <FileText className="h-4 w-4" />
              Docs
            </Button>

            <Button
              variant={fileTypeFilter.includes('image') ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              onClick={() => {
                const newFilter = fileTypeFilter.includes('image') 
                  ? fileTypeFilter.filter(f => f !== 'image')
                  : [...fileTypeFilter, 'image'];
                handleFileTypeFilterChange(newFilter);
              }}
            >
              <FileText className="h-4 w-4" />
              Images
            </Button>

            {/* File Counter Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full flex-shrink-0">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{sortedFiles.length + sortedFolders.length}</span>
            </div>

            {/* Folder Counter */}
            {sortedFolders.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0">
                <Folder className="h-3 w-3" />
                <span>{sortedFolders.length}</span>
              </Badge>
            )}

            {/* File Counter */}
            {sortedFiles.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0">
                <FileText className="h-3 w-3" />
                <span>{sortedFiles.length}</span>
              </Badge>
            )}
          </div>

          {/* Actions Menu */}
          <div className="flex items-center gap-2 ml-4">
            <Button 
              onClick={handleRefresh} 
              variant="ghost" 
              size="sm"
              disabled={refreshing}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => setIsCreateFolderDialogOpen(true)} 
              variant="ghost" 
              size="sm"
              className="flex-shrink-0"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
                  {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid3X3 className="h-4 w-4 mr-2" />}
                  {viewMode === 'grid' ? 'Table View' : 'Grid View'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Expandable Search Bar */}
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="floating-search-input"
                type="text"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
                disabled={loading}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      <FileBreadcrumb 
        currentFolderId={currentFolderId}
        loading={loading || refreshing}
        onNavigate={(folderId) => {
          setCurrentFolderId(folderId);
          fetchFiles(folderId || undefined);
        }}
      />

      {/* File Category Overview */}
      {(sortedFiles.length > 0 || sortedFolders.length > 0) && (
        <FileCategoryBadges 
          files={sortedFiles}
          folders={sortedFolders}
          onCategoryClick={(category) => {
            if (category === 'Folders') {
              setFileTypeFilter(['folder']);
            } else {
              const categoryFilters = {
                'Videos': ['video'],
                'Documents': ['document', 'pdf'],
                'Images': ['image'],
                'Audio': ['audio'],
                'Spreadsheets': ['spreadsheet'],
                'Presentations': ['presentation'],
                'Archives': ['archive'],
                'Code': ['code'],
                'Others': ['other']
              };
              const filter = categoryFilters[category as keyof typeof categoryFilters] || ['other'];
              setFileTypeFilter(filter);
              toast.info(`Showing ${category} files`);
            }
          }}
        />
      )}

      {/* Files and Folders Grid */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-lg sm:text-xl">Files & Folders</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {sortedFolders.length + sortedFiles.length} items
              </Badge>
              {(sortedFolders.length > 0 || sortedFiles.length > 0) && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <span className="flex items-center gap-1">
                    {sortedFolders.length > 0 && (
                      <>
                        {sortedFolders.length}
                        <Folder className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    {sortedFiles.length > 0 && (
                      <>
                        {sortedFiles.length}
                        <FileText className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                      </>
                    )}
                  </span>
                </Badge>
              )}
              {(folders.length > 0 || files.length > 0) && (
                <div className="flex items-center gap-2">
                  <ToggleGroup 
                    type="single" 
                    value={viewMode} 
                    onValueChange={handleViewModeChange}
                    className="bg-background border rounded-md"
                  >
                    <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
                      <Grid3X3 className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="table" aria-label="Table view" size="sm">
                      <List className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>

                  {viewMode === 'table' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <Columns className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4" align="end">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-sm text-foreground">Table Columns</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                              <Checkbox
                                id="name"
                                checked={visibleColumns.name}
                                onCheckedChange={(checked) =>
                                  setVisibleColumns(prev => ({ ...prev, name: checked === true }))
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label 
                                htmlFor="name" 
                                className="text-sm font-medium cursor-pointer flex-1 select-none"
                              >
                                Name
                              </label>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                              <Checkbox
                                id="id"
                                checked={visibleColumns.id}
                                onCheckedChange={(checked) =>
                                  setVisibleColumns(prev => ({ ...prev, id: checked === true }))
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label 
                                htmlFor="id" 
                                className="text-sm font-medium cursor-pointer flex-1 select-none"
                              >
                                ID
                              </label>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                              <Checkbox
                                id="size"
                                checked={visibleColumns.size}
                                onCheckedChange={(checked) =>
                                  setVisibleColumns(prev => ({ ...prev, size: checked === true }))
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label 
                                htmlFor="size" 
                                className="text-sm font-medium cursor-pointer flex-1 select-none"
                              >
                                Size
                              </label>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                              <Checkbox
                                id="owners"
                                checked={visibleColumns.owners}
                                onCheckedChange={(checked) =>
                                  setVisibleColumns(prev => ({ ...prev, owners: checked === true }))
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label 
                                htmlFor="owners" 
                                className="text-sm font-medium cursor-pointer flex-1 select-none"
                              >
                                Owners
                              </label>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                              <Checkbox
                                id="mimeType"
                                checked={visibleColumns.mimeType}
                                onCheckedChange={(checked) =>
                                  setVisibleColumns(prev => ({ ...prev, mimeType: checked === true }))
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label 
                                htmlFor="mimeType" 
                                className="text-sm font-medium cursor-pointer flex-1 select-none"
                              >
                                MIME Type
                              </label>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                              <Checkbox
                                id="createdTime"
                                checked={visibleColumns.createdTime}
                                onCheckedChange={(checked) =>
                                  setVisibleColumns(prev => ({ ...prev, createdTime: checked === true }))
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label 
                                htmlFor="createdTime" 
                                className="text-sm font-medium cursor-pointer flex-1 select-none"
                              >
                                Created
                              </label>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                              <Checkbox
                                id="modifiedTime"
                                checked={visibleColumns.modifiedTime}
                                onCheckedChange={(checked) =>
                                  setVisibleColumns(prev => ({ ...prev, modifiedTime: checked === true }))
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label 
                                htmlFor="modifiedTime" 
                                className="text-sm font-medium cursor-pointer flex-1 select-none"
                              >
                                Modified
                              </label>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>

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
                      {formatDate(folder.modifiedTime)}
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
                    <p 
                      className="font-medium truncate text-xs sm:text-sm md:text-base cursor-pointer hover:text-blue-600 hover:underline" 
                      title={`Click to preview: ${file.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPreviewable(file.mimeType)) {
                          handleFileAction('preview', file.id, file.name);
                        } else {
                          handleFileAction('download', file.id, file.name);
                        }
                      }}
                    >
                      {file.name}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-muted-foreground">
                      <span>{file.size ? formatFileSize(file.size) : '-'}</span>
                      <span>{formatDate(file.modifiedTime)}</span>
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
                              className="h-5 w-5" 
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
                                title={`Click to preview: ${item.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isPreviewable(item.mimeType)) {
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
                          {formatDate(item.createdTime)}
                        </TableCell>
                      )}
                      {visibleColumns.modifiedTime && (
                        <TableCell className="text-muted-foreground">
                          {formatDate(item.modifiedTime)}
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

      {/* Floating Bulk Actions Toolbar */}
      {(folders.length > 0 || files.length > 0) && (
        <BulkActionsToolbar
          selectedCount={selectedItems.size}
          totalCount={folders.length + files.length}
          isSelectMode={isSelectMode}
          isAllSelected={selectedItems.size === folders.length + files.length && folders.length + files.length > 0}
          isInTrash={searchQuery === 'trashed:true'}
          bulkOperationProgress={bulkOperationProgress}
          onToggleSelectMode={toggleSelectMode}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onBulkDownload={handleBulkDownload}
          onBulkDelete={() => setIsBulkDeleteDialogOpen(true)}
          onBulkMove={() => setIsBulkMoveDialogOpen(true)}
          onBulkCopy={() => setIsBulkCopyDialogOpen(true)}
          onBulkExport={() => setIsBulkExportDialogOpen(true)}
          onBulkRename={() => setIsBulkRenameDialogOpen(true)}
          onBulkRestore={() => setIsBulkRestoreDialogOpen(true)}
          onBulkPermanentDelete={() => setIsBulkPermanentDeleteDialogOpen(true)}
        />
      )}
    </div>
  );
}