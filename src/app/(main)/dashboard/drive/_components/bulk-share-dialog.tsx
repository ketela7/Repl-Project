"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Share2, 
  Globe, 
  Users, 
  Lock,
  Eye,
  Edit,
  FileText,
  Folder
} from "lucide-react";
import { FileIcon } from '@/components/file-icon';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetDescription, BottomSheetFooter } from '@/components/ui/bottom-sheet';

interface BulkShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: Array<{ id: string; name: string; type: 'file' | 'folder'; mimeType?: string }>;
  onShare?: (shareData: BulkShareData) => void;
}

interface BulkShareData {
  role: 'reader' | 'writer' | 'commenter';
  type: 'anyone' | 'anyoneWithLink' | 'domain';
}

export function BulkShareDialog({ 
  open, 
  onOpenChange, 
  selectedItems, 
  onShare 
}: BulkShareDialogProps) {
  const [accessLevel, setAccessLevel] = useState<'reader' | 'writer' | 'commenter'>('reader');
  const [linkAccess, setLinkAccess] = useState<'anyone' | 'anyoneWithLink' | 'domain'>('anyoneWithLink');
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkShare = async () => {
    setIsLoading(true);
    
    try {
      if (onShare) {
        await onShare({
          role: accessLevel,
          type: linkAccess
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fileCount = selectedItems.filter(item => item.type === 'file').length;
  const folderCount = selectedItems.filter(item => item.type === 'folder').length;
  const isMobile = useIsMobile();

  const renderContent = () => (
    <div className="space-y-4">
          {/* Selected Items Summary */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Selected items</Label>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total items:</span>
                <Badge variant="secondary">{selectedItems.length}</Badge>
              </div>
              {fileCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Files:</span>
                  <Badge variant="outline">{fileCount}</Badge>
                </div>
              )}
              {folderCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Folders:</span>
                  <Badge variant="outline">{folderCount}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Preview of items */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Items to share</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm p-1">
                  <FileIcon 
                    mimeType={item.type === 'folder' ? 'application/vnd.google-apps.folder' : item.mimeType || 'application/octet-stream'} 
                    className="h-4 w-4 flex-shrink-0" 
                  />
                  <span className="truncate" title={item.name}>{item.name}</span>
                </div>
              ))}
              {selectedItems.length > 5 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  and {selectedItems.length - 5} more items...
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Access Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Access level</Label>
            <Select value={accessLevel} onValueChange={(value: any) => setAccessLevel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Viewer</p>
                      <p className="text-xs text-muted-foreground">Can view only</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="commenter">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Commenter</p>
                      <p className="text-xs text-muted-foreground">Can view and comment</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="writer">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Editor</p>
                      <p className="text-xs text-muted-foreground">Can view, comment, and edit</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Link Access */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Who has access</Label>
            <Select value={linkAccess} onValueChange={(value: any) => setLinkAccess(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anyoneWithLink">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Anyone with the link</p>
                      <p className="text-xs text-muted-foreground">Anyone who has the link can access</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="anyone">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Anyone on the internet</p>
                      <p className="text-xs text-muted-foreground">Public on the web</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="domain">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Anyone in your organization</p>
                      <p className="text-xs text-muted-foreground">People in your organization can find and access</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Share {selectedItems.length} Items</div>
                <div className="text-sm font-normal text-muted-foreground">
                  Generate share links
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="px-4 pb-4 overflow-y-auto">
            {renderContent()}
          </div>

          <BottomSheetFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleBulkShare} disabled={isLoading || selectedItems.length === 0} className="flex-1">
              {isLoading ? (
                <>
                  <Share2 className="h-4 w-4 mr-2 animate-pulse" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate {selectedItems.length} Links
                </>
              )}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {selectedItems.length} Items
          </DialogTitle>
          <DialogDescription>
            Generate share links for the selected items with customizable privacy settings.
          </DialogDescription>
        </DialogHeader>

        <div className="px-1">
          {renderContent()}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleBulkShare} disabled={isLoading || selectedItems.length === 0} className="w-full sm:w-auto">
            {isLoading ? 'Sharing...' : `Generate ${selectedItems.length} Share Links`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}