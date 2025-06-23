"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Download,
  Trash2,
  Share,
  Edit,
  Eye,
  RefreshCw,
  Move,
  Copy,
  AlertTriangle,
  Info,
  Play,
  Star,
  Link,
} from "lucide-react";
import { DriveFile, DriveFolder } from '@/lib/google-drive/types';
import { formatFileSize, formatDriveFileDate, isPreviewable, getFileActions } from '@/lib/google-drive/utils';
import { formatFileTime, getRelativeTime } from '@/lib/timezone';
import { FileIcon } from '@/components/file-icon';
import { DriveGridSkeleton } from './drive-skeleton';

interface DriveDataViewProps {
  // Data
  loading: boolean;
  files: DriveFile[];
  folders: DriveFolder[];
  sortedFiles: DriveFile[];
  sortedFolders: DriveFolder[];
  
  // View state
  viewMode: 'grid' | 'table';
  searchQuery: string;
  currentFolderId: string | null;
  isSelectMode: boolean;
  selectedItems: Set<string>;
  activeView: string;
  
  // Table columns
  visibleColumns: {
    name: boolean;
    id: boolean;
    size: boolean;
    mimeType: boolean;
    owners: boolean;
    createdTime: boolean;
    modifiedTime: boolean;
  };
  
  // Actions
  toggleItemSelection: (id: string) => void;
  handleFolderClick: (folderId: string) => void;
  handleFileAction: (action: string, fileId: string, fileName: string) => void;
  getFileActions: (file: DriveFile | DriveFolder, view: string) => any;
}

export function DriveDataView({
  loading,
  files,
  folders,
  sortedFiles,
  sortedFolders,
  viewMode,
  searchQuery,
  currentFolderId,
  isSelectMode,
  selectedItems,
  activeView,
  visibleColumns,
  toggleItemSelection,
  handleFolderClick,
  handleFileAction,
  getFileActions,
}: DriveDataViewProps) {
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <DriveGridSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (folders.length === 0 && files.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {viewMode === 'grid' ? (
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
                <div className="min-h-0 flex-1">
                  <p className="font-medium text-sm truncate" title={folder.name}>
                    {folder.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileTime(folder.modifiedTime)}
                  </p>
                </div>
              </div>
            ))}

            {/* Files - using filtered/sorted data */}
            {sortedFiles.map((file) => {
              const fileActions = getFileActions(file, activeView);
              return (
                <div
                  key={file.id}
                  className={`border rounded-lg p-2 sm:p-3 md:p-4 hover:bg-accent cursor-pointer transition-colors relative ${
                    selectedItems.has(file.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleItemSelection(file.id);
                    } else if (isPreviewable(file.mimeType)) {
                      handleFileAction('preview', file.id, file.name);
                    } else {
                      handleFileAction('download', file.id, file.name);
                    }
                  }}
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
                      <FileIcon mimeType={file.mimeType} fileName={file.name} className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                      {file.mimeType === 'application/vnd.google-apps.shortcut' && (
                        <Badge variant="outline" className="ml-1 h-5 text-xs px-1 border-blue-300 text-blue-600 bg-blue-50">
                          <Link className="h-3 w-3" />
                        </Badge>
                      )}
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
                              {actions.canPreview && (
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

                              {actions.canStar && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction('star', file.id, file.name);
                                }}>
                                  <Star className="h-4 w-4 mr-2" />
                                  {file.starred ? 'Unstar' : 'Star'}
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
                  
                  <div className="min-h-0 flex-1">
                    <p className="font-medium text-sm truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(file.size || '0')}</span>
                      <span>{formatFileTime(file.modifiedTime)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  {isSelectMode && (
                    <th className="w-12 p-2 text-left">
                      <Checkbox className="h-4 w-4" />
                    </th>
                  )}
                  {visibleColumns.name && (
                    <th className="p-3 text-left font-medium">Name</th>
                  )}
                  {visibleColumns.size && (
                    <th className="p-3 text-left font-medium">Size</th>
                  )}
                  {visibleColumns.mimeType && (
                    <th className="p-3 text-left font-medium">Type</th>
                  )}
                  {visibleColumns.owners && (
                    <th className="p-3 text-left font-medium">Owner</th>
                  )}
                  {visibleColumns.modifiedTime && (
                    <th className="p-3 text-left font-medium">Modified</th>
                  )}
                  {visibleColumns.createdTime && (
                    <th className="p-3 text-left font-medium">Created</th>
                  )}
                  <th className="w-12 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {/* Folders in table view */}
                {sortedFolders.map((folder) => (
                  <tr
                    key={folder.id}
                    className={`border-b hover:bg-accent cursor-pointer ${
                      selectedItems.has(folder.id) ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => isSelectMode ? toggleItemSelection(folder.id) : handleFolderClick(folder.id)}
                  >
                    {isSelectMode && (
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedItems.has(folder.id)}
                          onCheckedChange={() => toggleItemSelection(folder.id)}
                          className="h-4 w-4"
                        />
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileIcon mimeType="application/vnd.google-apps.folder" className="h-5 w-5" />
                          <span className="truncate">{folder.name}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.size && (
                      <td className="p-3 text-muted-foreground">—</td>
                    )}
                    {visibleColumns.mimeType && (
                      <td className="p-3 text-muted-foreground">Folder</td>
                    )}
                    {visibleColumns.owners && (
                      <td className="p-3 text-muted-foreground">
                        {folder.owners?.[0]?.displayName || 'Unknown'}
                      </td>
                    )}
                    {visibleColumns.modifiedTime && (
                      <td className="p-3 text-muted-foreground">
                        {formatFileTime(folder.modifiedTime)}
                      </td>
                    )}
                    {visibleColumns.createdTime && (
                      <td className="p-3 text-muted-foreground">
                        {folder.createdTime ? formatFileTime(folder.createdTime) : '—'}
                      </td>
                    )}
                    <td className="p-3">
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
                    </td>
                  </tr>
                ))}

                {/* Files in table view */}
                {sortedFiles.map((file) => (
                  <tr
                    key={file.id}
                    className={`border-b hover:bg-accent cursor-pointer ${
                      selectedItems.has(file.id) ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (isSelectMode) {
                        toggleItemSelection(file.id);
                      } else if (isPreviewable(file.mimeType)) {
                        handleFileAction('preview', file.id, file.name);
                      } else {
                        handleFileAction('download', file.id, file.name);
                      }
                    }}
                  >
                    {isSelectMode && (
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedItems.has(file.id)}
                          onCheckedChange={() => toggleItemSelection(file.id)}
                          className="h-4 w-4"
                        />
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileIcon mimeType={file.mimeType} fileName={file.name} className="h-5 w-5" />
                          <span className="truncate">{file.name}</span>
                          {file.mimeType === 'application/vnd.google-apps.shortcut' && (
                            <Badge variant="outline" className="h-5 text-xs px-1 border-blue-300 text-blue-600 bg-blue-50">
                              <Link className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.size && (
                      <td className="p-3 text-muted-foreground">
                        {formatFileSize(file.size || '0')}
                      </td>
                    )}
                    {visibleColumns.mimeType && (
                      <td className="p-3 text-muted-foreground font-mono text-xs">
                        {file.mimeType}
                      </td>
                    )}
                    {visibleColumns.owners && (
                      <td className="p-3 text-muted-foreground">
                        {file.owners?.[0]?.displayName || 'Unknown'}
                      </td>
                    )}
                    {visibleColumns.modifiedTime && (
                      <td className="p-3 text-muted-foreground">
                        {formatFileTime(file.modifiedTime)}
                      </td>
                    )}
                    {visibleColumns.createdTime && (
                      <td className="p-3 text-muted-foreground">
                        {file.createdTime ? formatFileTime(file.createdTime) : '—'}
                      </td>
                    )}
                    <td className="p-3">
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
                                {actions.canPreview && (
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
                                {actions.canStar && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileAction('star', file.id, file.name);
                                  }}>
                                    <Star className="h-4 w-4 mr-2" />
                                    {file.starred ? 'Unstar' : 'Star'}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}