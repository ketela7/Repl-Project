"use client";

import { useState } from 'react';
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
import { Edit } from "lucide-react";

interface FileRenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onRename: (newName: string) => Promise<void>;
}

export function FileRenameDialog({ 
  isOpen, 
  onClose, 
  fileName,
  onRename
}: FileRenameDialogProps) {
  const [newName, setNewName] = useState(fileName);
  const [renaming, setRenaming] = useState(false);

  const handleRename = async () => {
    if (!newName.trim() || newName === fileName) {
      onClose();
      return;
    }

    try {
      setRenaming(true);
      await onRename(newName.trim());
      handleClose();
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setRenaming(false);
    }
  };

  const handleClose = () => {
    if (!renaming) {
      setNewName(fileName);
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
          <DialogDescription>
            Enter a new name for the file.
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
                // Select filename without extension for easier editing
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
            disabled={!newName.trim() || newName === fileName || renaming}
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