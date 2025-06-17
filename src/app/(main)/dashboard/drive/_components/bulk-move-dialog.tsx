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
import { Move } from "lucide-react";
import { FileMoveDialog } from "./file-move-dialog";

interface BulkMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetFolderId: string) => void;
  selectedItems: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
  }>;
}

export function BulkMoveDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems
}: BulkMoveDialogProps) {
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const fileCount = selectedItems.filter(item => item.type === 'file').length;
  const folderCount = selectedItems.filter(item => item.type === 'folder').length;

  const handleMoveConfirm = (targetFolderId: string) => {
    onConfirm(targetFolderId);
    setIsMoveDialogOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="h-5 w-5" />
              Move Items
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <div>
                You are about to move {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} to a new location.
              </div>
              
              <div className="flex gap-2">
                {fileCount > 0 && (
                  <Badge variant="secondary">
                    {fileCount} file{fileCount > 1 ? 's' : ''}
                  </Badge>
                )}
                {folderCount > 0 && (
                  <Badge variant="secondary">
                    {folderCount} folder{folderCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {selectedItems.length <= 5 ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Items to be moved:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedItems.map((item) => (
                      <li key={item.id} className="truncate">
                        • {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-sm font-medium">First 3 items:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedItems.slice(0, 3).map((item) => (
                      <li key={item.id} className="truncate">
                        • {item.name}
                      </li>
                    ))}
                    <li className="text-muted-foreground/70">
                      ... and {selectedItems.length - 3} more items
                    </li>
                  </ul>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Click "Choose Destination" to select where you want to move these items.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setIsMoveDialogOpen(true)}>
              Choose Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileMoveDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        onConfirm={handleMoveConfirm}
        selectedFile={selectedItems.length > 0 ? { 
          id: selectedItems[0].id, 
          name: `${selectedItems.length} items`,
          parentId: undefined
        } : null}
      />
    </>
  );
}