"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Sparkles,
  Tag,
  Wand2,
  Plus,
  Brain,
  Zap,
  Filter,
  Settings
} from "lucide-react";
import { generateAutoTags, getSmartCategory } from '@/lib/google-drive/utils';
import { SmartCategoryBadge } from '@/components/ui/smart-category-badge';
import { toast } from "sonner";

interface MobileAutoTaggingProps {
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size?: string;
  }>;
  selectedFiles: string[];
  onTagsUpdate: (fileId: string, tags: string[]) => void;
}

export function MobileAutoTagging({ 
  files, 
  selectedFiles, 
  onTagsUpdate 
}: MobileAutoTaggingProps) {
  const [customTag, setCustomTag] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleQuickAutoTag = async () => {
    setProcessing(true);
    try {
      const targetFiles = selectedFiles.length > 0 
        ? files.filter(f => selectedFiles.includes(f.id))
        : files.slice(0, 10); // Limit for mobile performance

      let processed = 0;
      for (const file of targetFiles) {
        const autoTags = generateAutoTags(file);
        onTagsUpdate(file.id, autoTags);
        processed++;
      }

      toast.success(`Auto-tagged ${processed} files`);
    } catch (error) {
      toast.error('Failed to auto-tag files');
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickCategorize = async () => {
    setProcessing(true);
    try {
      const targetFiles = selectedFiles.length > 0 
        ? files.filter(f => selectedFiles.includes(f.id))
        : files.slice(0, 10);

      let processed = 0;
      for (const file of targetFiles) {
        const category = getSmartCategory(file);
        if (category.confidence >= 0.7) {
          const categoryTags = [category.primary];
          if (category.secondary) categoryTags.push(category.secondary);
          onTagsUpdate(file.id, categoryTags);
          processed++;
        }
      }

      toast.success(`Categorized ${processed} files`);
    } catch (error) {
      toast.error('Failed to categorize files');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddCustomTag = () => {
    if (!customTag.trim()) return;

    const targetFiles = selectedFiles.length > 0 
      ? files.filter(f => selectedFiles.includes(f.id))
      : files.slice(0, 5); // Conservative limit for mobile

    targetFiles.forEach(file => {
      onTagsUpdate(file.id, [customTag.trim()]);
    });

    setCustomTag('');
    toast.success(`Tagged ${targetFiles.length} files`);
  };

  // Get popular tags for quick access
  const popularTags = React.useMemo(() => {
    const tagCounts = new Map<string, number>();
    files.forEach(file => {
      const autoTags = generateAutoTags(file);
      autoTags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [files]);

  return (
    <div className="space-y-4">
      {/* Quick Actions Row */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleQuickAutoTag}
            disabled={processing}
            className="w-full h-12"
            variant="default"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {processing ? 'Processing...' : 'Auto-tag'}
          </Button>

          <Button
            onClick={handleQuickCategorize}
            disabled={processing}
            className="w-full h-12"
            variant="outline"
          >
            <Brain className="h-4 w-4 mr-2" />
            Categorize
          </Button>
        </div>

        {/* Custom Tag Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add custom tag..."
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
            className="flex-1"
          />
          <Button 
            onClick={handleAddCustomTag}
            disabled={!customTag.trim()}
            size="sm"
            className="px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Popular Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Quick Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                onClick={() => {
                  const targetFiles = selectedFiles.length > 0 
                    ? files.filter(f => selectedFiles.includes(f.id))
                    : files.slice(0, 5);

                  targetFiles.forEach(file => {
                    onTagsUpdate(file.id, [tag]);
                  });

                  toast.success(`Applied "${tag}" to ${targetFiles.length} files`);
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Selected ({selectedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-24">
              <div className="space-y-2">
                {files
                  .filter(f => selectedFiles.includes(f.id))
                  .slice(0, 3)
                  .map((file) => {
                    const category = getSmartCategory(file);
                    
                    return (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                        </div>
                        <SmartCategoryBadge category={category} showTooltip={false} />
                      </div>
                    );
                  })}
                {selectedFiles.length > 3 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{selectedFiles.length - 3} more files
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{files.length}</p>
              <p className="text-xs text-muted-foreground">Files</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{popularTags.length}</p>
              <p className="text-xs text-muted-foreground">Tags</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{selectedFiles.length}</p>
              <p className="text-xs text-muted-foreground">Selected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Options
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Advanced Auto-Tagging
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {/* Confidence threshold slider and other advanced options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Confidence Threshold</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                defaultValue="0.7"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
            
            <Button 
              onClick={handleQuickAutoTag}
              disabled={processing}
              className="w-full"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Apply Advanced Auto-Tagging
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}