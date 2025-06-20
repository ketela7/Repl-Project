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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

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

  const renderContent = () => (
    <>
      <div className="space-y-4 pt-2">
        <div className="text-base">
          Generate share links for <span className="font-semibold">{selectedItems.length}</span> item{selectedItems.length > 1 ? 's' : ''} with customizable privacy settings.
        </div>
        
        <div className="flex flex-wrap gap-2">
          {fileCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              <FileText className="h-3 w-3 mr-1" />
              {fileCount} file{fileCount > 1 ? 's' : ''}
            </Badge>
          )}
          {folderCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              <Folder className="h-3 w-3 mr-1" />
              {folderCount} folder{folderCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {selectedItems.length <= 5 ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Items to share:</div>
            <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 dark:bg-slate-900/50 p-3">
              <ul className="text-sm space-y-1">
                {selectedItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 truncate">
                    <FileIcon mimeType={item.mimeType || 'application/octet-stream'} className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Preview (first 3 items):</div>
            <div className="rounded-md bg-slate-50 dark:bg-slate-900/50 p-3">
              <ul className="text-sm space-y-1">
                {selectedItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center gap-2 truncate">
                    <FileIcon mimeType={item.mimeType || 'application/octet-stream'} className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2 text-muted-foreground/70 italic">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                  and {selectedItems.length - 3} more items...
                </li>
              </ul>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Access level</Label>
            <Select
              value={accessLevel}
              onValueChange={(value: 'reader' | 'writer' | 'commenter') => setAccessLevel(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-muted-foreground">Can view only</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="commenter">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Commenter</div>
                      <div className="text-xs text-muted-foreground">Can view and comment</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="writer">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Editor</div>
                      <div className="text-xs text-muted-foreground">Can view and edit</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Who has access</Label>
            <Select
              value={linkAccess}
              onValueChange={(value: 'anyone' | 'anyoneWithLink' | 'domain') => setLinkAccess(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anyoneWithLink">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Anyone with the link</div>
                      <div className="text-xs text-muted-foreground">Anyone who has the link can access</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="domain">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Anyone in your organization</div>
                      <div className="text-xs text-muted-foreground">People in your domain can find and access</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="anyone">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Anyone on the internet</div>
                      <div className="text-xs text-muted-foreground">Anyone can search and access</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-800">
          <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
          <div className="text-sm text-green-800 dark:text-green-200">
            Share links will be generated for all selected items with the chosen access settings.
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Share Items</div>
                <div className="text-sm font-normal text-muted-foreground">
                  Bulk share operation
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="px-4 pb-4 space-y-4">
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
                  Generate {selectedItems.length} Share Links
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
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Share Items</div>
              <div className="text-sm font-normal text-muted-foreground">
                Bulk share operation
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-2">
            {renderContent()}
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