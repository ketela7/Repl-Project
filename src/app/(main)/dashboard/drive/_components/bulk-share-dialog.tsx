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

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleBulkShare} disabled={isLoading || selectedItems.length === 0}>
            {isLoading ? 'Sharing...' : `Generate ${selectedItems.length} Share Links`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}