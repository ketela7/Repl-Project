"use client";

import React, { useState, useEffect } from 'react';
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { DriveLayoutNew } from '@/components/drive/drive-layout-new';
import { toast } from "sonner";
import { driveCache } from '@/lib/cache';

// File operation imports
import { FileUploadDialog } from './file-upload-dialog';
import { CreateFolderDialog } from './create-folder-dialog';
import { FileRenameDialog } from './file-rename-dialog';
import { FileMoveDialog } from './file-move-dialog';
import { FileCopyDialog } from './file-copy-dialog';
import { PermanentDeleteDialog } from './permanent-delete-dialog';
import { FileDetailsDialog } from './file-details-dialog';
import { FilePreviewDialog } from './file-preview-dialog';
import { BulkDeleteDialog } from './bulk-delete-dialog';
import { BulkMoveDialog } from './bulk-move-dialog';
import { BulkExportDialog } from './bulk-export-dialog';
import { BulkRenameDialog } from './bulk-rename-dialog';
import { BulkRestoreDialog } from './bulk-restore-dialog';
import { BulkPermanentDeleteDialog } from './bulk-permanent-delete-dialog';
import { BulkCopyDialog } from './bulk-copy-dialog';

export function DriveManagerClean() {
  // Core state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Dialog states
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Bulk operation dialogs
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkMoveDialogOpen, setIsBulkMoveDialogOpen] = useState(false);
  const [isBulkCopyDialogOpen, setIsBulkCopyDialogOpen] = useState(false);
  const [isBulkExportDialogOpen, setIsBulkExportDialogOpen] = useState(false);
  const [isBulkRenameDialogOpen, setIsBulkRenameDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const [isBulkPermanentDeleteDialogOpen, setIsBulkPermanentDeleteDialogOpen] = useState(false);

  // Selected items for operations
  const [selectedFileForAction, setSelectedFileForAction] = useState<{ id: string; name: string; parentId?: string } | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | null>(null);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);

  // Fetch files from API
  const fetchFiles = async (options: {
    folderId?: string | null;
    query?: string;
    pageToken?: string;
    refresh?: boolean;
    view?: string;
    fileTypes?: string[];
  } = {}) => {
    try {
      setLoading(true);
      
      // Clear cache if refresh is requested
      if (options.refresh) {
        driveCache.clear();
      }

      // Build API params
      const params = new URLSearchParams({
        pageSize: '50',
        ...(options.folderId && { parentId: options.folderId }),
        ...(options.query && { q: options.query }),
        ...(options.pageToken && { pageToken: options.pageToken }),
        ...(options.view && { view: options.view }),
        ...(options.fileTypes?.length && { fileTypes: options.fileTypes.join(',') }),
      });

      const response = await fetch(`/api/drive/files?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsReauth(true);
          toast.error("Authentication required. Please reconnect your Google Drive.");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
        setFolders(data.folders || []);
        setNextPageToken(data.nextPageToken || null);
        setHasAccess(true);
        setNeedsReauth(false);
      } else {
        throw new Error(data.error || 'Failed to fetch files');
      }
    } catch (error: any) {
      console.error('Error fetching files:', error);
      
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        setNeedsReauth(true);
        setHasAccess(false);
        toast.error("Please reconnect your Google Drive account");
      } else {
        toast.error(`Failed to load files: ${error.message}`);
        setHasAccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchFiles({ 
      folderId: currentFolderId, 
      refresh: true 
    });
  };

  // Handle create folder
  const handleCreateFolder = () => {
    setIsCreateFolderDialogOpen(true);
  };

  // Handle successful folder creation
  const handleFolderCreated = (newFolder: DriveFolder) => {
    setFolders(prev => [newFolder, ...prev]);
    setIsCreateFolderDialogOpen(false);
    toast.success(`Folder "${newFolder.name}" created successfully`);
  };

  // Handle successful file upload
  const handleFileUploaded = (newFile: DriveFile) => {
    setFiles(prev => [newFile, ...prev]);
    setIsUploadDialogOpen(false);
    toast.success(`File "${newFile.name}" uploaded successfully`);
  };

  // Handle file/folder operations
  const handleFileRenamed = (renamedItem: DriveFile | DriveFolder) => {
    if ('mimeType' in renamedItem) {
      // It's a file
      setFiles(prev => prev.map(file => 
        file.id === renamedItem.id ? renamedItem as DriveFile : file
      ));
    } else {
      // It's a folder
      setFolders(prev => prev.map(folder => 
        folder.id === renamedItem.id ? renamedItem as DriveFolder : folder
      ));
    }
    setIsRenameDialogOpen(false);
    toast.success(`"${renamedItem.name}" renamed successfully`);
  };

  const handleItemDeleted = (deletedId: string, type: 'file' | 'folder') => {
    if (type === 'file') {
      setFiles(prev => prev.filter(file => file.id !== deletedId));
    } else {
      setFolders(prev => prev.filter(folder => folder.id !== deletedId));
    }
    setIsPermanentDeleteDialogOpen(false);
    toast.success("Item deleted successfully");
  };

  // Initial load
  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="w-full min-h-screen">
      <DriveLayoutNew
        initialFiles={files}
        initialFolders={folders}
        hasAccess={hasAccess ?? true}
        onRefresh={handleRefresh}
        onCreateFolder={handleCreateFolder}
      />

      {/* File Operation Dialogs */}
      <FileUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        currentFolderId={currentFolderId}
        onFileUploaded={handleFileUploaded}
      />

      <CreateFolderDialog
        open={isCreateFolderDialogOpen}
        onOpenChange={setIsCreateFolderDialogOpen}
        currentFolderId={currentFolderId}
        onFolderCreated={handleFolderCreated}
      />

      <FileRenameDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        file={selectedFileForAction}
        onFileRenamed={handleFileRenamed}
      />

      <FileMoveDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        file={selectedFileForAction}
        onFileMoved={(movedFile) => {
          // Remove from current view if moved to different folder
          setFiles(prev => prev.filter(f => f.id !== movedFile.id));
          setFolders(prev => prev.filter(f => f.id !== movedFile.id));
          setIsMoveDialogOpen(false);
          toast.success(`"${movedFile.name}" moved successfully`);
        }}
      />

      <FileCopyDialog
        open={isCopyDialogOpen}
        onOpenChange={setIsCopyDialogOpen}
        file={selectedFileForAction}
        onFileCopied={(copiedFile) => {
          setFiles(prev => [copiedFile, ...prev]);
          setIsCopyDialogOpen(false);
          toast.success(`"${copiedFile.name}" copied successfully`);
        }}
      />

      <PermanentDeleteDialog
        open={isPermanentDeleteDialogOpen}
        onOpenChange={setIsPermanentDeleteDialogOpen}
        item={selectedItemForDelete}
        onItemDeleted={handleItemDeleted}
      />

      <FileDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        item={selectedItemForDetails}
      />

      <FilePreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        file={selectedFileForPreview}
      />

      {/* Bulk Operation Dialogs */}
      <BulkDeleteDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        selectedItems={[]}
        onItemsDeleted={() => {
          // Refresh the view
          handleRefresh();
          setIsBulkDeleteDialogOpen(false);
        }}
      />

      <BulkMoveDialog
        open={isBulkMoveDialogOpen}
        onOpenChange={setIsBulkMoveDialogOpen}
        selectedItems={[]}
        onItemsMoved={() => {
          handleRefresh();
          setIsBulkMoveDialogOpen(false);
        }}
      />

      <BulkCopyDialog
        open={isBulkCopyDialogOpen}
        onOpenChange={setIsBulkCopyDialogOpen}
        selectedItems={[]}
        onItemsCopied={() => {
          handleRefresh();
          setIsBulkCopyDialogOpen(false);
        }}
      />

      <BulkExportDialog
        open={isBulkExportDialogOpen}
        onOpenChange={setIsBulkExportDialogOpen}
        selectedItems={[]}
        onExportCompleted={() => {
          setIsBulkExportDialogOpen(false);
        }}
      />

      <BulkRenameDialog
        open={isBulkRenameDialogOpen}
        onOpenChange={setIsBulkRenameDialogOpen}
        selectedItems={[]}
        onItemsRenamed={() => {
          handleRefresh();
          setIsBulkRenameDialogOpen(false);
        }}
      />

      <BulkRestoreDialog
        open={isBulkRestoreDialogOpen}
        onOpenChange={setIsBulkRestoreDialogOpen}
        selectedItems={[]}
        onItemsRestored={() => {
          handleRefresh();
          setIsBulkRestoreDialogOpen(false);
        }}
      />

      <BulkPermanentDeleteDialog
        open={isBulkPermanentDeleteDialogOpen}
        onOpenChange={setIsBulkPermanentDeleteDialogOpen}
        selectedItems={[]}
        onItemsDeleted={() => {
          handleRefresh();
          setIsBulkPermanentDeleteDialogOpen(false);
        }}
      />
    </div>
  );
}