"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { getTouchButtonClasses, getMobileGridClasses, getMobileInputClasses } from "@/lib/mobile-optimization";
import { 
  BottomSheet, 
  BottomSheetContent, 
  BottomSheetHeader, 
  BottomSheetTitle, 
  BottomSheetDescription,
  BottomSheetFooter 
} from "@/components/ui/bottom-sheet";
import { Edit } from "lucide-react";

interface FileRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: { id: string; name: string; parentId?: string } | null;
  onFileRenamed: (renamedFile: any) => void;
}

export function FileRenameDialog({ 
  open, 
  onOpenChange, 
  file,
  onFileRenamed
}: FileRenameDialogProps) {
  const [newName, setNewName] = useState(file?.name || '');
  const [renaming, setRenaming] = useState(false);
  const isMobile = useIsMobile();

  const handleRename = async () => {
    if (!newName?.trim() || !file || newName === file.name) {
      handleClose();
      return;
    }

    try {
      setRenaming(true);
      
      // Call the actual Google Drive API
      const response = await fetch(`/api/drive/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          name: newName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.needsReauth) {
          toast.error('Google Drive access expired. Please reconnect your account.');
          window.location.reload();
          return;
        }

        if (response.status === 403) {
          toast.error(`You don't have permission to rename "${file.name}". This may be a shared file with restricted access.`);
          return;
        }

        if (response.status === 404) {
          toast.error(`"${file.name}" was not found. It may have already been moved or deleted.`);
          handleClose();
          return;
        }

        throw new Error(errorData.error || 'Failed to rename file');
      }

      const renamedFile = await response.json();
      
      toast.success(`Successfully renamed to "${newName.trim()}"`);
      onFileRenamed(renamedFile);
      handleClose();
    } catch (error) {
      console.error('Error renaming file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to rename file');
    } finally {
      setRenaming(false);
    }
  };

  const handleClose = () => {
    if (!renaming) {
      setNewName(file?.name || '');
      onOpenChange(false);
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    }
  };

  // Update newName when file prop changes
  React.useEffect(() => {
    if (file?.name) {
      setNewName(file.name);
    }
  }, [file?.name]);

  // Add React import
  if (!file) {
    return null;
  }

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={handleDialogOpenChange}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Rename File
            </BottomSheetTitle>
            <BottomSheetDescription>
              Enter a new name for "{file?.name}"
            </BottomSheetDescription>
          </BottomSheetHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-name-mobile" className="text-sm font-medium">File Name</Label>
              <Input
                id="file-name-mobile"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new file name..."
                disabled={renaming}
                className={`${getMobileInputClasses()} text-base`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  }
                }}
                autoFocus
                onFocus={(e) => {
                  const name = e.target.value;
                  const lastDot = name.lastIndexOf('.');
                  if (lastDot > 0) {
                    e.target.setSelectionRange(0, lastDot);
                  } else {
                    e.target.select();
                  }
                }}
              />
            </div>
          </div>

          <BottomSheetFooter className={getMobileGridClasses({ columns: 2, gap: 'normal' })}>
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={renaming} 
              className={getTouchButtonClasses('secondary')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={!newName?.trim() || newName === file?.name || renaming}
              className={getTouchButtonClasses('primary')}
            >
              {renaming ? (
                <>
                  <Edit className="h-4 w-4 mr-2 animate-pulse" />
                  Renaming...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </>
              )}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Rename File
          </DialogTitle>
          <DialogDescription>
            Enter a new name for "{file?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-name">File Name</Label>
            <Input
              id="file-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new file name..."
              disabled={renaming}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
              autoFocus
              onFocus={(e) => {
                const name = e.target.value;
                const lastDot = name.lastIndexOf('.');
                if (lastDot > 0) {
                  e.target.setSelectionRange(0, lastDot);
                } else {
                  e.target.select();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={renaming}>
            Apply Filter
          </Button>
          <Button 
            onClick={handleRename} 
            disabled={!newName?.trim() || newName === file?.name || renaming}
          >
            {renaming ? (
              <>
                <Edit className="h-4 w-4 mr-2 animate-pulse" />
                Renaming...
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}