"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedItems: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
  }>;
}

export function BulkDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems
}: BulkDeleteDialogProps) {
  const fileCount = selectedItems.filter(item => item.type === 'file').length;
  const folderCount = selectedItems.filter(item => item.type === 'folder').length;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Move to Trash
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              Are you sure you want to move {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} to trash?
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
                <div className="text-sm font-medium">Items to be deleted:</div>
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
              These items will be moved to your Google Drive trash and can be restored later.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Move to Trash
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}