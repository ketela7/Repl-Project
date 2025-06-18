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
  FileText
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
import { formatFileSize, formatDate, isPreviewable } from '@/lib/google-drive/utils';
import { FileIcon } from '@/components/file-icon';
import { toast } from "sonner";
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
import { BulkActionsToolbar } from './bulk-actions-toolbar';
import { BulkDeleteDialog } from './bulk-delete-dialog';
import { BulkMoveDialog } from './bulk-move-dialog';
import { BulkCopyDialog } from './bulk-copy-dialog';

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
    key: 'name' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType';
    direction: 'asc' | 'desc';
  } | null>(null);

  // Bulk operations state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkMoveDialogOpen, setIsBulkMoveDialogOpen] = useState(false);
  const [isBulkCopyDialogOpen, setIsBulkCopyDialogOpen] = useState(false);
  const [bulkOperationProgress, setBulkOperationProgress] = useState<{
    isRunning: boolean;
    current: number;
    total: number;
    operation: string;
  }>({ isRunning: false, current: 0, total: 0, operation: '' });

  // Sorting functionality
  const handleSort = (key: 'name' | 'size' | 'modifiedTime' | 'createdTime' | 'mimeType') => {
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

  // Sort files and folders based on current sort configuration
  const sortedFiles = React.useMemo(() => {
    if (!sortConfig) return files;
    
    return [...files].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue: any, bValue: any;
      
      switch (key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'modifiedTime':
          aValue = new Date(a.modifiedTime).getTime();
          bValue = new Date(b.modifiedTime).getTime();
          break;
        case 'createdTime':
          aValue = new Date(a.createdTime).getTime();
          bValue = new Date(b.createdTime).getTime();
          break;
        case 'mimeType':
          aValue = a.mimeType.toLowerCase();
          bValue = b.mimeType.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [files, sortConfig]);

  const sortedFolders = React.useMemo(() => {
    if (!sortConfig) return folders;
    
    return [...folders].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue: any, bValue: any;
      
      switch (key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'modifiedTime':
          aValue = new Date(a.modifiedTime).getTime();
          bValue = new Date(b.modifiedTime).getTime();
          break;
        case 'createdTime':
          aValue = new Date(a.createdTime).getTime();
          bValue = new Date(b.createdTime).getTime();
          break;
        case 'mimeType':
          aValue = 'folder';
          bValue = 'folder';
          break;
        case 'size':
          aValue = 0;
          bValue = 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [folders, sortConfig]);

  // Bulk operations utility functions
  const getAllItems = () => [...folders, ...files];
  
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
        toast.warning(`Copied ${successCount} files. ${failedItems.length} files failed: ${failedItems.slice(0, 3).join(', ')}${failedItems.length > 3 ? '...' : ''}`);
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

          // First, get file details to ensure it can be downloaded
          const fileResponse = await fetch(`/api/drive/files/${item.id}`);
          if (!fileResponse.ok) {
            const errorData = await fileResponse.json();
            
            if (errorData.needsReauth) {
              toast.error('Google Drive access expired. Please reconnect your account.');
              window.location.reload();
              return;
            }
            
            if (fileResponse.status === 403) {
              failedItems.push(`${item.name} (permission denied)`);
              continue;
            }
            
            if (fileResponse.status === 404) {
              failedItems.push(`${item.name} (not found)`);
              continue;
            }
            
            throw new Error(errorData.error || 'Failed to get file info');
          }
          
          const fileData = await fileResponse.json();
          
          // Use webContentLink for direct download if available
          if (fileData.webContentLink) {
            const link = document.createElement('a');
            link.href = fileData.webContentLink;
            link.download = item.name;
            link.style.display = 'none';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            successCount++;
          } else {
            // Fallback to custom download endpoint
            const downloadUrl = `/api/drive/download/${item.id}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = item.name;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            successCount++;
          }
          
          // Add delay between downloads to avoid overwhelming the browser
          if (i < selectedItemsData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (downloadError) {
          failedItems.push(item.name);
          console.error(`Failed to download ${item.name}:`, downloadError);
        }
      }

      deselectAll();
      setIsSelectMode(false);

      // Show comprehensive result notification
      const totalProcessed = successCount + failedItems.length + skippedItems.length;
      let message = '';
      
      if (successCount > 0) {
        message += `${successCount} file${successCount > 1 ? 's' : ''} downloaded`;
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
        toast.success(`Successfully downloaded ${successCount} file${successCount > 1 ? 's' : ''}`);
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

  const fetchFiles = async (parentId?: string, query?: string, pageToken?: string, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      const params = new URLSearchParams();
      if (parentId) params.append('parentId', parentId);
      if (query) params.append('query', query);
      if (pageToken) params.append('pageToken', pageToken);
      // Reduced page size for faster initial load
      params.append('pageSize', '20');
      
      console.log('=== Fetching files with params:', params.toString(), '===');
      
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
        setFiles(prev => [...prev, ...fileList]);
        setFolders(prev => [...prev, ...folderList]);
      } else {
        setFiles(fileList);
        setFolders(folderList);
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
      toast.error(error instanceof Error ? error.message : 'Failed to fetch files');
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

  // Debounced search function
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      if (value.trim()) {
        fetchFiles(undefined, value);
      } else {
        fetchFiles(currentFolderId || undefined);
      }
    }, 300); // 300ms delay
    
    setSearchTimeout(timeout);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchFiles(undefined, searchQuery);
    } else {
      fetchFiles(currentFolderId || undefined);
    }
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
    setNextPageToken(null); // Reset pagination
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
          
          const downloadResponse = await fetch(`/api/drive/files/${fileId}`);
          if (!downloadResponse.ok) {
            const errorData = await downloadResponse.json();
            if (errorData.needsReauth) {
              toast.error('Google Drive access expired. Please reconnect your account.');
              window.location.reload();
              return;
            }
            
            if (downloadResponse.status === 403) {
              toast.error(`You don't have permission to download "${fileName}". This may be a shared file with restricted access.`);
              return;
            }
            
            if (downloadResponse.status === 404) {
              toast.error(`"${fileName}" was not found. It may have been moved or deleted.`);
              await handleRefresh();
              return;
            }
            
            throw new Error(errorData.error || 'Failed to get file info');
          }
          
          const fileData = await downloadResponse.json();
          
          // Additional check for folder mimeType from API response
          if (fileData.mimeType === 'application/vnd.google-apps.folder') {
            toast.warning(`Cannot download folders. "${fileName}" is a folder.`);
            return;
          }
          
          if (fileData.webContentLink) {
            window.open(fileData.webContentLink, '_blank');
            toast.success(`Download started for "${fileName}"`);
          } else {
            toast.error(`"${fileName}" cannot be downloaded directly. This file type may require special handling or viewing in Google Drive.`);
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
      toast.error(error instanceof Error ? error.message : 'Failed to perform action');
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
        body: JSON.stringify({ 
          action: 'rename',
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
      toast.error(error instanceof Error ? error.message : 'Failed to rename file');
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
      toast.error(error instanceof Error ? error.message : 'Failed to copy file');
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

  // Show connection card if no access to Google Drive
  if (hasAccess === false) {
    return <DriveConnectionCard />;
  }

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-sm"
          />
          <Button onClick={handleSearch} size="sm" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
            className="whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:ml-2 sm:inline">Refresh</span>
          </Button>
          <Button 
            onClick={() => setIsCreateFolderDialogOpen(true)} 
            variant="outline" 
            size="sm"
            className="whitespace-nowrap"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:ml-2 sm:inline">New Folder</span>
          </Button>
          <Button 
            onClick={() => toast.info("Upload feature coming soon!")} 
            size="sm"
            variant="outline"
            disabled
            className="whitespace-nowrap opacity-60"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:ml-2 sm:inline">Upload Soon</span>
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <FileBreadcrumb 
        currentFolderId={currentFolderId}
        loading={loading || refreshing}
        onNavigate={(folderId) => {
          setCurrentFolderId(folderId);
          fetchFiles(folderId || undefined);
        }}
      />

      {/* Files and Folders Grid */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-lg sm:text-xl">Files & Folders</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {folders.length + files.length} items
              </Badge>
              {(folders.length > 0 || files.length > 0) && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <span className="flex items-center gap-1">
                    {folders.length > 0 && (
                      <>
                        {folders.length}
                        <Folder className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    {files.length > 0 && (
                      <>
                        {files.length}
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
                    onValueChange={(value: 'grid' | 'table') => value && setViewMode(value)}
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
          {/* Bulk Actions Toolbar */}
          {(folders.length > 0 || files.length > 0) && (
            <div className="mb-4">
              <BulkActionsToolbar
                selectedCount={selectedItems.size}
                totalCount={folders.length + files.length}
                isSelectMode={isSelectMode}
                isAllSelected={selectedItems.size === folders.length + files.length && folders.length + files.length > 0}
                bulkOperationProgress={bulkOperationProgress}
                onToggleSelectMode={toggleSelectMode}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onBulkDownload={handleBulkDownload}
                onBulkDelete={() => setIsBulkDeleteDialogOpen(true)}
                onBulkMove={() => setIsBulkMoveDialogOpen(true)}
                onBulkCopy={() => setIsBulkCopyDialogOpen(true)}
              />
            </div>
          )}

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
              {/* Folders */}
              {folders.map((folder) => (
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
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('rename', folder.id, folder.name);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('move', folder.id, folder.name);
                        }}>
                          <Move className="h-4 w-4 mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('copy', folder.id, folder.name);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('share', folder.id, folder.name);
                        }}>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('details', folder.id, folder.name);
                        }}>
                          <Info className="h-4 w-4 mr-2" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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

              {/* Files */}
              {files.map((file) => (
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
                      <FileIcon mimeType={file.mimeType} className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('preview', file.id, file.name);
                        }}>
                          <Play className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('download', file.id, file.name);
                        }}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('rename', file.id, file.name);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('move', file.id, file.name);
                        }}>
                          <Move className="h-4 w-4 mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('copy', file.id, file.name);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('share', file.id, file.name);
                        }}>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('details', file.id, file.name);
                        }}>
                          <Info className="h-4 w-4 mr-2" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
                    {visibleColumns.id && <TableHead>ID</TableHead>}
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
                    {visibleColumns.owners && <TableHead>Owners</TableHead>}
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
                  {/* Folders in table */}
                  {sortedFolders.map((folder) => (
                    <TableRow 
                      key={folder.id}
                      className={`cursor-pointer hover:bg-accent transition-colors ${
                        selectedItems.has(folder.id) ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => isSelectMode ? toggleItemSelection(folder.id) : handleFolderClick(folder.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isSelectMode && (
                            <Checkbox
                              checked={selectedItems.has(folder.id)}
                              onCheckedChange={() => toggleItemSelection(folder.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          )}
                          <FileIcon mimeType="application/vnd.google-apps.folder" className="h-5 w-5" />
                        </div>
                      </TableCell>
                      {visibleColumns.name && (
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span className="truncate">{folder.name}</span>
                            <Badge variant="outline" className="text-xs">Folder</Badge>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.id && (
                        <TableCell className="text-muted-foreground">
                          <code className="text-xs bg-muted px-1 rounded">{folder.id}</code>
                        </TableCell>
                      )}
                      {visibleColumns.size && (
                        <TableCell className="text-muted-foreground">
                          -
                        </TableCell>
                      )}
                      {visibleColumns.owners && (
                        <TableCell className="text-muted-foreground">
                          {folder.owners?.map(owner => owner.displayName || owner.emailAddress).join(', ') || '-'}
                        </TableCell>
                      )}
                      {visibleColumns.mimeType && (
                        <TableCell className="text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">Folder</Badge>
                        </TableCell>
                      )}
                      {visibleColumns.createdTime && (
                        <TableCell className="text-muted-foreground">
                          {formatDate(folder.createdTime)}
                        </TableCell>
                      )}
                      {visibleColumns.modifiedTime && (
                        <TableCell className="text-muted-foreground">
                          {formatDate(folder.modifiedTime)}
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
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('rename', folder.id, folder.name);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('move', folder.id, folder.name);
                            }}>
                              <Move className="h-4 w-4 mr-2" />
                              Move
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('copy', folder.id, folder.name);
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('share', folder.id, folder.name);
                            }}>
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('details', folder.id, folder.name);
                            }}>
                              <Info className="h-4 w-4 mr-2" />
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Files in table */}
                  {sortedFiles.map((file) => (
                    <TableRow 
                      key={file.id}
                      className={`cursor-pointer hover:bg-accent transition-colors ${
                        selectedItems.has(file.id) ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => isSelectMode ? toggleItemSelection(file.id) : undefined}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isSelectMode && (
                            <Checkbox
                              checked={selectedItems.has(file.id)}
                              onCheckedChange={() => toggleItemSelection(file.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          )}
                          <FileIcon mimeType={file.mimeType} className="h-5 w-5" />
                        </div>
                      </TableCell>
                      {visibleColumns.name && (
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="truncate hover:text-blue-600 hover:underline"
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
                            </span>
                            {file.shared && <Badge variant="secondary" className="text-xs">Shared</Badge>}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.id && (
                        <TableCell className="text-muted-foreground">
                          <code className="text-xs bg-muted px-1 rounded">{file.id}</code>
                        </TableCell>
                      )}
                      {visibleColumns.size && (
                        <TableCell className="text-muted-foreground">
                          {file.size ? formatFileSize(file.size) : '-'}
                        </TableCell>
                      )}
                      {visibleColumns.owners && (
                        <TableCell className="text-muted-foreground">
                          {file.owners?.map(owner => owner.displayName || owner.emailAddress).join(', ') || '-'}
                        </TableCell>
                      )}
                      {visibleColumns.mimeType && (
                        <TableCell className="text-muted-foreground">
                          <code className="text-xs bg-muted px-1 rounded">{file.mimeType}</code>
                        </TableCell>
                      )}
                      {visibleColumns.createdTime && (
                        <TableCell className="text-muted-foreground">
                          {formatDate(file.createdTime)}
                        </TableCell>
                      )}
                      {visibleColumns.modifiedTime && (
                        <TableCell className="text-muted-foreground">
                          {formatDate(file.modifiedTime)}
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
                            {isPreviewable(file.mimeType) && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleFileAction('preview', file.id, file.name);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('download', file.id, file.name);
                            }}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('rename', file.id, file.name);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('move', file.id, file.name);
                            }}>
                              <Move className="h-4 w-4 mr-2" />
                              Move
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('copy', file.id, file.name);
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('share', file.id, file.name);
                            }}>
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction('details', file.id, file.name);
                            }}>
                              <Info className="h-4 w-4 mr-2" />
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
    </div>
  );
}