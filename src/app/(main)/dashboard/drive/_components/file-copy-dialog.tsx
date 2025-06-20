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
import { FolderIcon, Copy, ExternalLink } from "lucide-react";
import { DriveFolder } from '@/lib/google-drive/types';
import { extractFolderIdFromUrl, isValidFolderId } from '@/lib/google-drive/utils';
import { toast } from "sonner";

interface FileCopyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  currentParentId: string | null;
  onCopy: (newName: string, parentId: string) => Promise<void>;
}

export function FileCopyDialog({ 
  isOpen, 
  onClose, 
  fileName,
  currentParentId,
  onCopy
}: FileCopyDialogProps) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [customTargetInput, setCustomTargetInput] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('select');
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
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
      console.error('Error fetching folders:', error);
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

  const handleCopy = async () => {
    const targetFolderId = getTargetFolderId();
    
    if (!targetFolderId) {
      toast.error('Please select a valid destination folder');
      return;
    }

    const copyName = newFileName.trim() || `Copy of ${fileName}`;

    try {
      setCopying(true);
      console.log(`Copying to folder ID: ${targetFolderId} with name: ${copyName}`);
      await onCopy(copyName, targetFolderId);
      handleClose();
    } catch (error) {
      console.error('Copy operation failed:', error);
      // Error is handled by parent component
    } finally {
      setCopying(false);
    }
  };

  const handleClose = () => {
    if (!copying) {
      setSelectedFolderId('');
      setCustomTargetInput('');
      setNewFileName('');
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
      setNewFileName(`Copy of ${fileName}`);
    }
  }, [isOpen, fileName]);

  const renderContent = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="copy-name">Copy Name</Label>
        <Input
          id="copy-name"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          placeholder="Enter name for the copy..."
          disabled={copying}
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
              disabled={loading || copying}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading folders..." : "Select a folder"} />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem 
                    key={folder.id} 
                    value={folder.id}
                  >
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4" />
                      <span>{folder.name}</span>
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
              disabled={copying}
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
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={handleOpenChange}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle>Copy File</BottomSheetTitle>
            <BottomSheetDescription>
              Create a copy of "{fileName}" in a destination folder.
            </BottomSheetDescription>
          </BottomSheetHeader>

          <div className="px-4 pb-4 space-y-4">
            {renderContent()}
          </div>

          <BottomSheetFooter className="flex-row gap-2">
            <Button variant="outline" onClick={handleClose} disabled={copying} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCopy} 
              disabled={!getTargetFolderId() || !newFileName.trim() || copying || loading}
              className="flex-1"
            >
              {copying ? (
                <>
                  <Copy className="h-4 w-4 mr-2 animate-pulse" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy File
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
          <DialogTitle>Copy File</DialogTitle>
          <DialogDescription>
            Create a copy of "{fileName}" in a destination folder.
          </DialogDescription>
        </DialogHeader>

        <div className="px-1">
          {renderContent()}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={copying} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleCopy} 
            disabled={!getTargetFolderId() || !newFileName.trim() || copying || loading}
            className="w-full sm:w-auto"
          >
            {copying ? (
              <>
                <Copy className="h-4 w-4 mr-2 animate-pulse" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}