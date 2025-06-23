"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileIcon } from "@/components/file-icon";
import { FileThumbnailPreview } from "@/components/ui/file-thumbnail-preview";
import { DriveManagerSkeleton } from "./drive-manager-skeleton";
import { FileList } from "./file-list";
import { useTimezone } from "@/hooks/use-timezone";
import { formatFileTime } from "@/lib/timezone";
import { isPreviewable } from "@/lib/google-drive/utils";
import {
  MoreVertical,
  Eye,
  Download,
  Edit,
  Move,
  Copy,
  Share,
  Info,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { DriveFile, DriveFolder } from "@/lib/google-drive/types";

interface DriveDataViewProps {
  loading: boolean;
  files: DriveFile[];
  folders: DriveFolder[];
  sortedFiles: DriveFile[];
  sortedFolders: DriveFolder[];
  viewMode: 'grid' | 'table';
  searchQuery: string;
  currentFolderId: string | null;
  isSelectMode: boolean;
  selectedItems: Set<string>;
  activeView: string;
  visibleColumns: {
    name: boolean;
    size: boolean;
    owners: boolean;
    mimeType: boolean;
    createdTime: boolean;
    modifiedTime: boolean;
  };
  toggleItemSelection: (id: string) => void;
  handleFolderClick: (id: string) => void;
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
  const { timezone } = useTimezone();

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <DriveManagerSkeleton />
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

            {/* Files */}
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
                  <p className="font-medium truncate text-xs sm:text-sm md:text-base" title={file.name}>{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}</span>
                    <span>•</span>
                    <span>{formatFileTime(file.modifiedTime, timezone)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <FileList
            files={sortedFiles}
            folders={sortedFolders}
            selectedItems={Array.from(selectedItems)}
            isSelectMode={isSelectMode}
            visibleColumns={visibleColumns}
            activeView={activeView}
            toggleItemSelection={toggleItemSelection}
            handleFolderClick={handleFolderClick}
            handleFileAction={handleFileAction}
            getFileActions={getFileActions}
          />
        )}
      </CardContent>
    </Card>
  );
}