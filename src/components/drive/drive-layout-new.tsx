"use client";

import React, { useState, useEffect } from 'react';
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { FloatingToolbar, FloatingToolbarTab } from './floating-toolbar';
import { DriveContentArea } from './drive-content-area';
import { FileBreadcrumb } from '../../app/(main)/dashboard/drive/_components/file-breadcrumb';
import { DriveConnectionCard } from '../../app/(main)/dashboard/drive/_components/drive-connection-card';
import { toast } from "sonner";
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface DriveLayoutNewProps {
  initialFiles?: DriveFile[];
  initialFolders?: DriveFolder[];
  hasAccess?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  onCreateFolder?: () => void;
  className?: string;
}

export function DriveLayoutNew({
  initialFiles = [],
  initialFolders = [],
  hasAccess = true,
  isLoading = false,
  onRefresh,
  onCreateFolder,
  className
}: DriveLayoutNewProps) {
  // State management
  const [files, setFiles] = useState<DriveFile[]>(initialFiles);
  const [folders, setFolders] = useState<DriveFolder[]>(initialFolders);
  const [activeTab, setActiveTab] = useState<FloatingToolbarTab | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Filter states
  const [activeView, setActiveView] = useState<'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash'>('all');
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<{
    sizeRange?: { min?: number; max?: number; unit: 'B' | 'KB' | 'MB' | 'GB' };
    createdDateRange?: { from?: Date; to?: Date };
    modifiedDateRange?: { from?: Date; to?: Date };
    owner?: string;
  }>({});

  // Debounced search for performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);

  // File type counters
  const fileTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    files.forEach(file => {
      const type = getFileType(file.mimeType);
      counts[type] = (counts[type] || 0) + 1;
    });
    
    if (folders.length > 0) {
      counts.folder = folders.length;
    }
    
    return counts;
  }, [files, folders]);

  // Apply filters
  const { filteredFiles, filteredFolders } = React.useMemo(() => {
    return applyFilters(files, folders, {
      fileTypeFilter,
      searchQuery: debouncedSearchQuery,
      activeView,
      advancedFilters
    });
  }, [files, folders, fileTypeFilter, debouncedSearchQuery, activeView, advancedFilters]);

  // Handle item selection
  const handleItemSelect = (itemId: string, isSelected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  // Handle item double click (navigation)
  const handleItemDoubleClick = (item: DriveFile | DriveFolder) => {
    if ('mimeType' in item && item.mimeType === 'application/vnd.google-apps.folder') {
      // Navigate to folder
      setCurrentFolderId(item.id);
      // Here you would typically fetch folder contents
      toast.info(`Navigating to ${item.name}`);
    } else if ('mimeType' in item) {
      // Open file preview/action
      toast.info(`Opening ${item.name}`);
    }
  };

  // Handle item actions
  const handleItemAction = (action: string, item: DriveFile | DriveFolder) => {
    switch (action) {
      case 'download':
        toast.info(`Downloading ${item.name}`);
        break;
      case 'share':
        toast.info(`Sharing ${item.name}`);
        break;
      case 'rename':
        toast.info(`Renaming ${item.name}`);
        break;
      case 'delete':
        toast.info(`Moving ${item.name} to trash`);
        break;
      case 'preview':
        toast.info(`Previewing ${item.name}`);
        break;
      default:
        toast.info(`Action: ${action} on ${item.name}`);
    }
  };

  // Handle search from floating toolbar
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle filter changes from floating toolbar
  const handleFilterChange = (filters: any) => {
    if (filters.fileTypeFilter) {
      setFileTypeFilter(filters.fileTypeFilter);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    toast.success("Drive refreshed");
  };

  // Handle create folder
  const handleCreateFolder = () => {
    if (onCreateFolder) {
      onCreateFolder();
    }
    toast.success("Create folder dialog opened");
  };

  // Update files and folders when props change
  useEffect(() => {
    console.log('DriveLayoutNew received props:', {
      initialFiles: initialFiles.length,
      initialFolders: initialFolders.length
    });
    setFiles(initialFiles);
    setFolders(initialFolders);
  }, [initialFiles, initialFolders]);

  console.log('DriveLayoutNew render - hasAccess:', hasAccess, 'files:', files.length, 'folders:', folders.length);
  
  if (!hasAccess) {
    return <DriveConnectionCard />;
  }

  return (
    <div className={className}>
      {/* Breadcrumb Navigation */}
      <div className="px-6 pt-6">
        <FileBreadcrumb 
          currentFolderId={currentFolderId}
          onNavigate={setCurrentFolderId}
        />
      </div>

      {/* Floating Toolbar */}
      <FloatingToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalFiles={filteredFiles.length + filteredFolders.length}
        selectedCount={selectedItems.size}
        fileTypeCounts={fileTypeCounts}
        onRefresh={handleRefresh}
        onCreateFolder={handleCreateFolder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      {/* Main Content Area */}
      <DriveContentArea
        files={filteredFiles}
        folders={filteredFolders}
        viewMode={viewMode}
        selectedItems={selectedItems}
        onItemSelect={handleItemSelect}
        onItemDoubleClick={handleItemDoubleClick}
        onItemAction={handleItemAction}
        isLoading={isLoading}
      />
    </div>
  );
}

// Helper function to categorize file types
function getFileType(mimeType: string | undefined): string {
  if (!mimeType) return 'other';
  
  if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) {
    return 'document';
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'spreadsheet';
  }
  if (mimeType.includes('presentation')) {
    return 'presentation';
  }
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return 'archive';
  }
  
  return 'other';
}

// Filter application function
function applyFilters(
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
) {
  let filteredFiles = [...files];
  let filteredFolders = [...folders];

  // Apply search filter
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const searchTerm = filters.searchQuery.toLowerCase();
    filteredFiles = filteredFiles.filter(file => 
      file.name?.toLowerCase().includes(searchTerm)
    );
    filteredFolders = filteredFolders.filter(folder => 
      folder.name?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply file type filter
  if (filters.fileTypeFilter.length > 0) {
    filteredFiles = filteredFiles.filter(file => {
      const fileType = getFileType(file.mimeType);
      return filters.fileTypeFilter.includes(fileType);
    });

    // Only show folders if 'folder' is in filter
    if (!filters.fileTypeFilter.includes('folder')) {
      filteredFolders = [];
    }
  }

  // Apply view filter
  switch (filters.activeView) {
    case 'starred':
      filteredFiles = filteredFiles.filter(file => file.starred);
      filteredFolders = filteredFolders.filter(folder => folder.starred);
      break;
    case 'shared':
      filteredFiles = filteredFiles.filter(file => file.shared);
      filteredFolders = filteredFolders.filter(folder => folder.shared);
      break;
    case 'recent':
      // Filter files modified in the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredFiles = filteredFiles.filter(file => 
        new Date(file.modifiedTime) > weekAgo
      );
      filteredFolders = filteredFolders.filter(folder => 
        new Date(folder.modifiedTime) > weekAgo
      );
      break;
    case 'trash':
      filteredFiles = filteredFiles.filter(file => file.trashed);
      filteredFolders = filteredFolders.filter(folder => folder.trashed);
      break;
  }

  return { filteredFiles, filteredFolders };
}