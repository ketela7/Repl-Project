"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// Force rebuild to include useRef import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// Import essential icons (keeping all used icons to avoid runtime errors)
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
  FileVideo,
  FileAudio,
  Archive,
  FileCode,
  FileImage
} from "lucide-react";

import { lazy, Suspense } from "react";
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
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { formatFileSize, formatDriveFileDate, isPreviewable, getFileActions } from '@/lib/google-drive/utils';
import { formatFileTime, getRelativeTime } from '@/lib/timezone';
import { useTimezoneContext } from '@/components/timezone-provider';
import { FileIcon } from '@/components/file-icon';
import { toast } from "sonner";
import { successToast, errorToast, warningToast, infoToast, loadingToast, toastUtils } from '@/lib/toast';
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
import { DriveToolbar } from './drive-toolbar';
import { DriveDataView } from './drive-data-view';

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
// Removed applyClientSideFilters - now using Google Drive API directly with proper query parameters;

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
  const [selectedItemForShare, setSelectedItemForShare] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get timezone context for consistent date formatting
  const { timezone, isLoading: timezoneLoading } = useTimezoneContext();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [driveAccessError, setDriveAccessError] = useState<any>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  const lastFetchCallRef = useRef<string>('');
  const fetchThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestsRef = useRef<Set<string>>(new Set());

  // Manual search state - no debounce, only process on submit
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Table column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
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

  // Direct API filtering - no client-side processing needed
  const { filteredFiles: clientFilteredFiles, filteredFolders: clientFilteredFolders } = React.useMemo(() => {
    return { filteredFiles: files, filteredFolders: folders };
  }, [files, folders]);

  // Sort items based on current sort configuration
  const sortedAllItems = React.useMemo(() => {
    const allItems = [
      ...clientFilteredFolders.map((folder: any) => ({ ...folder, itemType: 'folder' as const })),
      ...clientFilteredFiles.map((file: any) => ({ ...file, itemType: 'file' as const }))
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
        type: ('mimeType' in item ? 'file' : 'folder') as 'file' | 'folder',
        mimeType: 'mimeType' in item ? item.mimeType : 'application/vnd.google-apps.folder'
      } : null;
    }).filter((item): item is { id: string; name: string; type: 'file' | 'folder'; mimeType: string } => item !== null);
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

        if (i < itemsWithPermissions.length - 1) {
        }
      }

      await fetchFiles(currentFolderId || undefined, searchQuery || undefined);
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

        if (i < itemsWithPermissions.length - 1) {
        }
      }

      await fetchFiles(currentFolderId || undefined, searchQuery || undefined);
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

        if (i < itemsWithPermissions.length - 1) {
        }
      }

      await fetchFiles(currentFolderId || undefined, searchQuery || undefined);
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
        }
      }

      await fetchFiles(currentFolderId || undefined, searchQuery || undefined);
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
        }
      }

      await fetchFiles(currentFolderId || undefined, searchQuery || undefined);
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

  const handleBulkShare = async (shareData: { role: string; type: string }): Promise<Array<{ id: string; name: string; shareLink: string; success: boolean; error?: string }>> => {
    const selectedItemsData = getSelectedItemsData().filter(item => item !== null);
    if (selectedItemsData.length === 0) return [];

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
      return [];
    }

    setBulkOperationProgress({
      isRunning: true,
      current: 0,
      total: itemsWithPermissions.length,
      operation: 'Generating share links'
    });

    const results: Array<{ id: string; name: string; shareLink: string; success: boolean; error?: string }> = [];

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
              results.push({
                id: item.id,
                name: item.name,
                shareLink: result.webViewLink,
                success: true
              });
            } else {
              results.push({
                id: item.id,
                name: item.name,
                shareLink: '',
                success: false,
                error: 'No share link returned'
              });
            }
          } else {
            const errorData = await response.json();
            if (errorData.needsReauth) {
              toast.error('Google Drive access expired. Please reconnect your account.');
              window.location.reload();
              return [];
            }
            results.push({
              id: item.id,
              name: item.name,
              shareLink: '',
              success: false,
              error: errorData.error || 'Failed to share'
            });
          }
        } catch (error) {
          results.push({
            id: item.id,
            name: item.name,
            shareLink: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        if (i < itemsWithPermissions.length - 1) {
        }
      }

      // Add skipped items to results
      itemsWithoutPermissions.forEach(item => {
        results.push({
          id: item.id,
          name: item.name,
          shareLink: '',
          success: false,
          error: 'No permission to share'
        });
      });

      deselectAll();
      setIsSelectMode(false);

      return results;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Bulk share error:', error);
      }
      toast.error('An error occurred during bulk share operation');
      return results;
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
        throw new Error('Failed to share item');
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
        }
      }

      await fetchFiles(currentFolderId || undefined, searchQuery || undefined);
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

  const fetchFiles = useCallback(async (parentId?: string, query?: string, pageToken?: string, append = false, viewFilter?: string) => {
    const requestId = `fetch-files-${parentId || 'root'}-${query || ''}-${pageToken || ''}`;

    // Check if the same request is already active
    if (activeRequestsRef.current.has(requestId)) {
      console.log('[Request Dedup] Skipping duplicate active request:', requestId);
      return;
    }

    // Check throttle for recent identical requests
    if (lastFetchCallRef.current === requestId && !append) {
      console.log('[Throttle] Skipping recent duplicate request:', requestId);
      return;
    }

    // Mark request as active
    activeRequestsRef.current.add(requestId);
    lastFetchCallRef.current = requestId;

    // Clear any existing throttle timeout
    if (fetchThrottleTimeoutRef.current) {
      clearTimeout(fetchThrottleTimeoutRef.current);
    }

    // Set timeout to reset throttle after 300ms
    fetchThrottleTimeoutRef.current = setTimeout(() => {
      lastFetchCallRef.current = '';
    }, 300);

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

      // Add view filter parameters for proper Google Drive API querying
      const currentView = viewFilter || activeView;
      if (currentView !== 'all') {
        params.append('view', currentView);
        params.append('viewStatus', currentView); // Add viewStatus for backend API compatibility
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
        }        if (response.status === 401 || response.status === 403 || errorData.needsReauth) {
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
      // Always cleanup active request tracking
      activeRequestsRef.current.delete(requestId);
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, fileTypeFilter, advancedFilters, activeView]);

  // Instant search input handler - no processing while typing
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  // Manual search submission - only process when user submits
  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    setSubmittedSearchQuery(query);
    if (query) {
      fetchFiles(currentFolderId || undefined, query);
    } else {
      fetchFiles(currentFolderId || undefined);
    }
  }, [searchQuery, currentFolderId, fetchFiles]);

  const handleViewChange = useCallback((view: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash') => {
    setActiveView(view);
    setCurrentFolderId(null); // Reset to root when changing views
    setSearchQuery(''); // Clear search

    // Clear selection when changing views
    setSelectedItems(new Set());
    setIsSelectMode(false);

    fetchFiles(undefined, undefined, undefined, false, view);
  }, [fetchFiles]);

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

  const handleFolderClick = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
    setNextPageToken(null); // Reset pagination

    // Track folder access for navigation

    fetchFiles(folderId);
  }, [fetchFiles]);

  const handleFolderNavigation = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
    setNextPageToken(null); // Reset pagination
    fetchFiles(folderId || undefined);
  }, [fetchFiles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setNextPageToken(null); // Reset pagination
    await fetchFiles(currentFolderId || undefined, undefined, undefined, false, activeView);
    setRefreshing(false);
  }, [fetchFiles, currentFolderId, activeView]);

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

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/drive/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trash' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsReauth) {
          toast.error('Google Drive access expired. Please reconnect your account.');
          window.location.reload();
          return;
        }
        throw new Error(errorData.error || 'Failed to delete file');
      }

      const fileName = selectedItemForDelete?.name || 'File';
      toast.success(`${fileName} moved to trash`);
      setIsDeleteDialogOpen(false);
      setSelectedItemForDelete(null);
      await handleRefresh();
    } catch (error) {
      console.error('Error deleting file:', error);
      handleError(error, 'Failed to delete file');
    }
  };

  const handlePermanentDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/drive/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsReauth) {
          toast.error('Google Drive access expired. Please reconnect your account.');
          window.location.reload();
          return;
        }
        throw new Error(errorData.error || 'Failed to permanently delete file');
      }

      const fileName = selectedItemForDelete?.name || 'File';
      toast.success(`${fileName} permanently deleted`);
      setIsDeleteDialogOpen(false);
      setSelectedItemForDelete(null);
      await handleRefresh();
    } catch (error) {
      console.error('Error permanently deleting file:', error);
      handleError(error, 'Failed to permanently delete file');
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

  // Manual search effect - only run when submitted search changes
  useEffect(() => {
    // Skip if this is the initial load (handled by main useEffect)
    if (hasAccess === null) return;

    if (submittedSearchQuery.trim()) {
      fetchFiles(currentFolderId || undefined, submittedSearchQuery.trim());
    } else {
      fetchFiles(currentFolderId || undefined);
    }
  }, [submittedSearchQuery, currentFolderId, hasAccess]);

  // Force re-render when filters change to update the visual display
  useEffect(() => {
    // Only trigger re-render if we have data and access is confirmed
    // This prevents unnecessary API calls during initial load
    if ((files.length > 0 || folders.length > 0) && hasAccess === true) {
      // Force a minimal state update to trigger re-render without API calls
      setFiles(prev => [...prev]);
      setFolders(prev => [...prev]);
    }
  }, [fileTypeFilter, advancedFilters, activeView, files.length, folders.length, hasAccess]);

  // Handle view mode change for toggle group
  const handleViewModeChange = (value: string) => {
    if (value && (value === 'grid' || value === 'table')) {
      setViewMode(value as 'grid' | 'table');
    }
  };

  // Pagination state
  const hasNextPage = !!nextPageToken;
  const loadMore = handleLoadMore;

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

  // Cleanup throttle timeout and active requests on unmount
  useEffect(() => {
    return () => {
      if (fetchThrottleTimeoutRef.current) {
        clearTimeout(fetchThrottleTimeoutRef.current);
      }
      // Clear all active request tracking
      activeRequestsRef.current.clear();
    };
  }, []);  // Show permission required card if no access to Google Drive
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
      {/* DriveManager Toolbar - Refactored into separate component */}
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

      {/* Breadcrumb Navigation - Between toolbar and data */}
      <div className="px-4 py-3 bg-background border-b">
        <FileBreadcrumb
          currentFolderId={currentFolderId}
          loading={loading || refreshing}
          onNavigate={handleFolderNavigation}
        />
      </div>

      {/* Data Container - Refactored into separate component */}
      <DriveDataView
        loading={loading}
        files={files}
        folders={folders}
        sortedFiles={sortedFiles}
        sortedFolders={sortedFolders}
        viewMode={viewMode}
        searchQuery={searchQuery}
        currentFolderId={currentFolderId}
        isSelectMode={isSelectMode}
        selectedItems={selectedItems}
        activeView={activeView}
        visibleColumns={visibleColumns}
        sortConfig={sortConfig}
        onSort={(field: string) => handleSort(field as "name" | "id" | "size" | "modifiedTime" | "createdTime" | "mimeType" | "owners")}
        selectAll={selectAll}
        deselectAll={deselectAll}
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
        onFolderCreated={() => {
          setIsCreateFolderDialogOpen(false);
          handleRefresh();
        }}
        currentFolderId={currentFolderId}
      />

      <FileRenameDialog
        open={isRenameDialogOpen}
        onOpenChange={(open) => setIsRenameDialogOpen(open)}
        onConfirm={async (newName: string) => {
          if (selectedFileForAction) {
            await handleRenameFile(newName);
          }
        }}
        fileName={selectedFileForAction?.name || ''}
        fileId={selectedFileForAction?.id || ''}
      />

      <FileMoveDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        onMove={async (targetFolderId) => {
          if (selectedFileForAction) {
            await handleMoveFile(targetFolderId, selectedFileForAction.parentId);
          }
        }}
        fileName={selectedFileForAction?.name || ''}
        currentParentId={selectedFileForAction?.parentId || null}
      />

      <FileCopyDialog
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        onCopy={async (targetFolderId, newName) => {
          if (selectedFileForAction) {
            await handleCopyFile(newName, targetFolderId);
          }
        }}
        fileName={selectedFileForAction?.name || ''}
        currentParentId={selectedFileForAction?.parentId || null}
      />

      <BulkDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          if (selectedItemForDelete) {
            if (activeView === 'trash') {
              await handlePermanentDeleteFile(selectedItemForDelete.id);
            } else {
              await handleDeleteFile(selectedItemForDelete.id);
            }
          }
        }}
        selectedItems={selectedItemForDelete ? [selectedItemForDelete] : []}
      />

      <FileDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        fileId={selectedItemForDetails?.id || ''}
        fileName={selectedItemForDetails?.name || ''}
        fileType={selectedItemForDetails?.type || 'file'}
      />

      <FileShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        item={selectedItemForShare ? { 
          id: selectedItemForShare.id, 
          name: selectedItemForShare.name, 
          type: selectedItemForShare.type === 'folder' ? 'folder' : 'file' 
        } : null}
      />

      <FilePreviewDialog
        open={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        file={selectedFileForPreview}
      />

      {/* Bulk Operation Dialogs */}
      <BulkDeleteDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={async () => {
          const items = getSelectedItemsData();
          if (activeView === 'trash') {
            await handleBulkPermanentDelete();
          } else {
            await handleBulkDelete();
          }
        }}
        selectedItems={getSelectedItemsData()}
      />

      <BulkMoveDialog
        isOpen={isBulkMoveDialogOpen}
        onClose={() => setIsBulkMoveDialogOpen(false)}
        onConfirm={async (targetFolderId) => {
          const items = getSelectedItemsData();
          await handleBulkMove(targetFolderId);
        }}
        selectedItems={getSelectedItemsData()}
      />

      <BulkCopyDialog
        isOpen={isBulkCopyDialogOpen}
        onClose={() => setIsBulkCopyDialogOpen(false)}
        onConfirm={async (targetFolderId) => {
          const items = getSelectedItemsData();
          await handleBulkCopy(targetFolderId);
        }}
        selectedItems={getSelectedItemsData()}
      />

      <BulkRenameDialog
        isOpen={isBulkRenameDialogOpen}
        onClose={() => setIsBulkRenameDialogOpen(false)}
        onConfirm={async (renamePattern: string, renameType: string) => {
          await handleBulkRename(renamePattern, renameType);
        }}
        selectedItems={getSelectedItemsData()}
      />

      <BulkRestoreDialog
        isOpen={isBulkRestoreDialogOpen}
        onClose={() => setIsBulkRestoreDialogOpen(false)}
        onConfirm={async () => {
          const items = getSelectedItemsData();
          await handleBulkRestore();
        }}
        selectedItems={getSelectedItemsData()}
      />

      <BulkExportDialog
        isOpen={isBulkExportDialogOpen}
        onClose={() => setIsBulkExportDialogOpen(false)}
        onConfirm={async (exportFormat: string) => {
          await handleBulkExport(exportFormat);
        }}
        selectedItems={getSelectedItemsData()}
      />

      <BulkPermanentDeleteDialog
        isOpen={isBulkPermanentDeleteDialogOpen}
        onClose={() => setIsBulkPermanentDeleteDialogOpen(false)}
        onConfirm={async () => {
          await handleBulkPermanentDelete();
        }}
        selectedItems={getSelectedItemsData()}
      />

      <BulkShareDialog
        open={isBulkShareDialogOpen}
        onOpenChange={setIsBulkShareDialogOpen}
        selectedItems={getSelectedItemsData()}
      />

      {/* Mobile Components */}
      <MobileActionsBottomSheet
        open={isMobileActionsOpen}
        onOpenChange={setIsMobileActionsOpen}
        selectedCount={selectedItems.size}
        selectedItems={getSelectedItemsData().filter(item => item !== null).map(item => ({ ...item, type: item.type as 'file' | 'folder' }))}
        isInTrash={activeView === 'trash' || searchQuery.includes('trashed:true')}
        onBulkDownload={handleBulkDownload}
        onBulkDelete={() => setIsBulkDeleteDialogOpen(true)}
        onBulkMove={() => setIsBulkMoveDialogOpen(true)}
        onBulkCopy={() => setIsBulkCopyDialogOpen(true)}
        onBulkRename={() => setIsBulkRenameDialogOpen(true)}
        onBulkExport={() => setIsBulkExportDialogOpen(true)}
        onBulkShare={() => setIsBulkShareDialogOpen(true)}
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