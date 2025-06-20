"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Share2, 
  Copy, 
  Users, 
  Globe, 
  Lock, 
  Mail,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

interface EnhancedShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { id: string; name: string; type: 'file' | 'folder' } | null;
  onShare?: (shareData: ShareData) => void;
}

interface ShareData {
  action: 'get_share_link' | 'add_permission' | 'remove_permission';
  role: 'reader' | 'writer' | 'commenter';
  type: 'anyone' | 'anyoneWithLink' | 'domain' | 'user';
  emailAddress?: string;
  message?: string;
  allowFileDiscovery?: boolean;
  expirationTime?: string;
}

export function EnhancedShareDialog({ 
  open, 
  onOpenChange, 
  item, 
  onShare 
}: EnhancedShareDialogProps) {
  const [shareType, setShareType] = useState<'link' | 'email'>('link');
  const [accessLevel, setAccessLevel] = useState<'reader' | 'writer' | 'commenter'>('reader');
  const [linkAccess, setLinkAccess] = useState<'anyone' | 'anyoneWithLink' | 'domain'>('anyoneWithLink');
  const [emailAddress, setEmailAddress] = useState('');
  const [message, setMessage] = useState('');
  const [allowDiscovery, setAllowDiscovery] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    if (!item) return;

    setIsLoading(true);
    try {
      let shareData: ShareData;

      if (shareType === 'link') {
        shareData = {
          action: 'get_share_link',
          role: accessLevel,
          type: linkAccess,
          allowFileDiscovery: allowDiscovery,
        };

        if (expirationDays) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));
          shareData.expirationTime = expirationDate.toISOString();
        }
      } else {
        if (!emailAddress.trim()) {
          toast.error('Please enter an email address');
          return;
        }

        shareData = {
          action: 'add_permission',
          role: accessLevel,
          type: 'user',
          emailAddress: emailAddress.trim(),
          message: message.trim(),
        };
      }

      const response = await fetch(`/api/drive/files/${item.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.needsReauth) {
          toast.error('Google Drive access expired. Please reconnect your account.');
          window.location.reload();
          return;
        }

        if (response.status === 403) {
          toast.error(`You don't have permission to share "${item.name}".`);
          return;
        }

        throw new Error(errorData.error || 'Failed to share item');
      }

      const result = await response.json();

      if (shareType === 'link' && result.webViewLink) {
        try {
          await navigator.clipboard.writeText(result.webViewLink);
          toast.success(`Share link for "${item.name}" copied to clipboard!`);
        } catch (clipboardError) {
          toast.success(`Share link generated for "${item.name}": ${result.webViewLink}`);
        }
      } else if (shareType === 'email') {
        toast.success(`"${item.name}" shared with ${emailAddress}`);
      }

      onOpenChange(false);
      
      // Reset form
      setEmailAddress('');
      setMessage('');
      setExpirationDays('');
      
    } catch (error) {
      console.error('Error sharing item:', error);
      toast.error('Failed to share item');
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{item.name}"
          </DialogTitle>
          <DialogDescription>
            Configure sharing settings and privacy options for this {item.type}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Share method</Label>
            <RadioGroup
              value={shareType}
              onValueChange={(value: 'link' | 'email') => setShareType(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="h-4 w-4" />
                  Share link
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Invite people
                </Label>
              </div>
            </RadioGroup>
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

          {/* Link Sharing Options */}
          {shareType === 'link' && (
            <>
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

              {/* Expiration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Link expiration (optional)</Label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="No expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No expiration</SelectItem>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Email Sharing Options */}
          {shareType === 'email' && (
            <>
              <div className="space-y-3">
                <Label htmlFor="email-input" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email-input"
                  type="email"
                  placeholder="Enter email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="message-input" className="text-sm font-medium">Message (optional)</Label>
                <Input
                  id="message-input"
                  placeholder="Add a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isLoading}>
            {isLoading ? 'Sharing...' : shareType === 'link' ? 'Copy Link' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}