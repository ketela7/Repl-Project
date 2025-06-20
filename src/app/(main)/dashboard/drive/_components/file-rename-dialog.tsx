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
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock renamed file response
      const renamedFile = {
        ...file,
        name: newName.trim()
      };
      
      onFileRenamed(renamedFile);
      handleClose();
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error renaming file:', error);
      }
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
                className="h-12 text-base"
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

          <BottomSheetFooter className="flex-row gap-2">
            <Button variant="outline" onClick={handleClose} disabled={renaming} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={!newName?.trim() || newName === file?.name || renaming}
              className="flex-1"
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
            Cancel
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