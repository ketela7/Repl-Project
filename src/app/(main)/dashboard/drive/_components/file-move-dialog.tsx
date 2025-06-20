"use client";

import { useState, useEffect } from 'react';
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
import { 
  BottomSheet, 
  BottomSheetContent, 
  BottomSheetHeader, 
  BottomSheetTitle, 
  BottomSheetDescription,
  BottomSheetFooter 
} from "@/components/ui/bottom-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { FolderIcon, Move, ExternalLink } from "lucide-react";
import { DriveFolder } from '@/lib/google-drive/types';
import { extractFolderIdFromUrl, isValidFolderId } from '@/lib/google-drive/utils';
import { toast } from "sonner";

interface FileMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  currentParentId: string | null;
  onMove: (newParentId: string, currentParentId?: string) => Promise<void>;
}

export function FileMoveDialog({ 
  isOpen, 
  onClose, 
  fileName,
  currentParentId,
  onMove
}: FileMoveDialogProps) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [customTargetInput, setCustomTargetInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('select');
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const isMobile = useIsMobile();

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/drive/folders');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch folders');
      }
      
      const foldersData = await response.json();
      
      // Add root folder option
      const allFolders = [
        { id: 'root', name: 'My Drive', createdTime: '', modifiedTime: '', parents: [], shared: false, trashed: false },
        ...foldersData
      ];
      
      setFolders(allFolders);
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching folders:', error);
      }
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const getTargetFolderId = (): string | null => {
    if (activeTab === 'select') {
      return selectedFolderId || null;
    } else {
      // Custom input tab
      const extractedId = extractFolderIdFromUrl(customTargetInput);
      return extractedId && isValidFolderId(extractedId) ? extractedId : null;
    }
  };

  const handleMove = async () => {
    const targetFolderId = getTargetFolderId();
    
    if (!targetFolderId) {
      toast.error('Please select a valid destination folder');
      return;
    }
    
    if (targetFolderId === currentParentId) {
      toast.error('Cannot move to the same folder');
      return;
    }

    try {
      setMoving(true);
      // Log for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Moving to folder ID: ${targetFolderId}`);
      }
      await onMove(targetFolderId, currentParentId || undefined);
      handleClose();
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Move operation failed:', error);
      }
      // Error is handled by parent component
    } finally {
      setMoving(false);
    }
  };

  const handleClose = () => {
    if (!moving) {
      setSelectedFolderId('');
      setCustomTargetInput('');
      setActiveTab('select');
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  const renderContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="select">Select Folder</TabsTrigger>
        <TabsTrigger value="custom">Custom Target</TabsTrigger>
      </TabsList>
      
      <TabsContent value="select" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="folder-select">Destination Folder</Label>
          <Select 
            value={selectedFolderId} 
            onValueChange={setSelectedFolderId}
            disabled={loading || moving}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading folders..." : "Select a folder"} />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem 
                  key={folder.id} 
                  value={folder.id}
                  disabled={folder.id === currentParentId}
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4" />
                    <span>{folder.name}</span>
                    {folder.id === currentParentId && (
                      <span className="text-xs text-muted-foreground">(current)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>
      
      <TabsContent value="custom" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom-target">Custom Destination</Label>
          <Input
            id="custom-target"
            value={customTargetInput}
            onChange={(e) => setCustomTargetInput(e.target.value)}
            placeholder="Enter folder ID or Google Drive URL..."
            disabled={moving}
            className="font-mono text-sm"
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Supports full URLs like: https://drive.google.com/drive/folders/1h7S-ebE1A5sEREQhawwWLVrqTZe47fez
            </p>
            <p>Or direct folder ID: 1h7S-ebE1A5sEREQhawwWLVrqTZe47fez</p>
            {customTargetInput && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <span className="font-medium">Extracted ID: </span>
                <span className="font-mono">
                  {extractFolderIdFromUrl(customTargetInput) || 'Invalid ID/URL'}
                </span>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={handleOpenChange}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle>Move File</BottomSheetTitle>
            <BottomSheetDescription>
              Select a destination folder for "{fileName}".
            </BottomSheetDescription>
          </BottomSheetHeader>

          <div className="px-4 pb-4">
            {renderContent()}
          </div>

          <BottomSheetFooter className="flex-row gap-2">
            <Button variant="outline" onClick={handleClose} disabled={moving} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleMove} 
              disabled={!getTargetFolderId() || getTargetFolderId() === currentParentId || moving || loading}
              className="flex-1"
            >
              {moving ? (
                <>
                  <Move className="h-4 w-4 mr-2 animate-pulse" />
                  Moving...
                </>
              ) : (
                <>
                  <Move className="h-4 w-4 mr-2" />
                  Move File
                </>
              )}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move File</DialogTitle>
          <DialogDescription>
            Select a destination folder for "{fileName}".
          </DialogDescription>
        </DialogHeader>

        <div className="px-1">
          {renderContent()}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={moving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!getTargetFolderId() || getTargetFolderId() === currentParentId || moving || loading}
            className="w-full sm:w-auto"
          >
            {moving ? (
              <>
                <Move className="h-4 w-4 mr-2 animate-pulse" />
                Moving...
              </>
            ) : (
              <>
                <Move className="h-4 w-4 mr-2" />
                Move File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}