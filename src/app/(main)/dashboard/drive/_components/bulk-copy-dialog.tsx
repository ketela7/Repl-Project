"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, AlertTriangle } from "lucide-react";
import { FileCopyDialog } from "./file-copy-dialog";

interface BulkCopyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetFolderId: string) => void;
  selectedItems: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
  }>;
}

export function BulkCopyDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems
}: BulkCopyDialogProps) {
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);

  const files = selectedItems.filter(item => item.type === 'file');
  const folders = selectedItems.filter(item => item.type === 'folder');

  const handleCopyConfirm = (targetFolderId: string) => {
    onConfirm(targetFolderId);
    setIsCopyDialogOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Copy Items
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <div>
                You are about to copy {files.length} file{files.length > 1 ? 's' : ''} to a new location.
              </div>
              
              <div className="flex gap-2">
                {files.length > 0 && (
                  <Badge variant="secondary">
                    {files.length} file{files.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {folders.length > 0 && (
                  <Badge variant="destructive">
                    {folders.length} folder{folders.length > 1 ? 's' : ''} (cannot copy)
                  </Badge>
                )}
              </div>

              {folders.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    Folders cannot be copied through the Google Drive API. Only files will be copied.
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <>
                  {files.length <= 5 ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Files to be copied:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {files.map((item) => (
                          <li key={item.id} className="truncate">
                            • {item.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">First 3 files:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {files.slice(0, 3).map((item) => (
                          <li key={item.id} className="truncate">
                            • {item.name}
                          </li>
                        ))}
                        <li className="text-muted-foreground/70">
                          ... and {files.length - 3} more files
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Click "Choose Destination" to select where you want to copy these files.
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {files.length > 0 && (
              <Button onClick={() => setIsCopyDialogOpen(true)}>
                Choose Destination
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileCopyDialog
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        onConfirm={handleCopyConfirm}
        selectedFile={files.length > 0 ? { 
          id: files[0].id, 
          name: `${files.length} files`,
          parentId: undefined
        } : null}
      />
    </>
  );
}