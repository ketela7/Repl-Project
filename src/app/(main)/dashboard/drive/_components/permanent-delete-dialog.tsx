"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PermanentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  itemName: string | null;
  itemType: 'file' | 'folder';
  onSuccess: () => void;
}

export function PermanentDeleteDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  itemType,
  onSuccess
}: PermanentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePermanentDelete = async () => {
    if (!itemId || !itemName) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/drive/files/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.needsReauth) {
          toast.error('Google Drive access expired. Please reconnect your account.');
          window.location.reload();
          return;
        }
        
        // Handle specific permission errors
        if (response.status === 403) {
          toast.error(`You don't have permission to permanently delete "${itemName}". This may be a shared file or folder with restricted access.`);
          onOpenChange(false);
          return;
        }
        
        if (response.status === 404) {
          toast.error(`"${itemName}" was not found. It may have already been deleted.`);
          onSuccess(); // Refresh the list
          onOpenChange(false);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to permanently delete item');
      }

      toast.success(`${itemName} permanently deleted`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Permanent delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to permanently delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete {itemType === 'folder' ? 'Folder' : 'File'}
          </DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <p>
              Are you sure you want to <strong>permanently delete</strong> "{itemName}"?
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
              <p className="font-medium mb-1">⚠️ Warning: This action cannot be undone</p>
              <p>
                This will permanently remove the {itemType} from Google Drive. 
                {itemType === 'folder' && ' All contents within this folder will also be permanently deleted.'}
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              If you're not sure, consider moving it to trash instead, where it can be restored later.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handlePermanentDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Trash2 className="h-4 w-4 mr-2 animate-pulse" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Permanently Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}