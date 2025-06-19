"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Tag,
  Wand2,
  Plus,
  Settings,
  Filter,
  Search,
  Brain,
  Target,
  Zap
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateAutoTags, suggestTags, getSmartCategory } from '@/lib/google-drive/utils';
import { SmartCategoryBadge } from '@/components/ui/smart-category-badge';
import { toast } from "sonner";

interface AutoTaggingPanelProps {
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size?: string;
  }>;
  selectedFiles: string[];
  onTagsUpdate: (fileId: string, tags: string[]) => void;
  className?: string;
}

interface TaggingSettings {
  autoTagging: boolean;
  smartCategorization: boolean;
  tagSuggestions: boolean;
  bulkTagging: boolean;
  confidence: number;
}

export function AutoTaggingPanel({ 
  files, 
  selectedFiles, 
  onTagsUpdate, 
  className 
}: AutoTaggingPanelProps) {
  const [settings, setSettings] = useState<TaggingSettings>({
    autoTagging: true,
    smartCategorization: true,
    tagSuggestions: true,
    bulkTagging: false,
    confidence: 0.7
  });

  const [customTag, setCustomTag] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [filterTag, setFilterTag] = useState('');

  // Get all unique tags from files
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    files.forEach(file => {
      const autoTags = generateAutoTags(file);
      autoTags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [files]);

  // Filter tags based on search
  const filteredTags = React.useMemo(() => {
    if (!filterTag) return allTags;
    return allTags.filter(tag => 
      tag.toLowerCase().includes(filterTag.toLowerCase())
    );
  }, [allTags, filterTag]);

  // Generate suggestions for selected files
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setTagSuggestions([]);
      return;
    }

    const selectedFile = files.find(f => f.id === selectedFiles[0]);
    if (selectedFile && settings.tagSuggestions) {
      const suggestions = suggestTags(selectedFile);
      setTagSuggestions(suggestions);
    }
  }, [selectedFiles, files, settings.tagSuggestions]);

  const handleSettingChange = (key: keyof TaggingSettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleAutoTagAll = async () => {
    if (!settings.autoTagging) {
      toast.error('Auto-tagging is disabled');
      return;
    }

    setProcessing(true);
    try {
      const targetFiles = selectedFiles.length > 0 
        ? files.filter(f => selectedFiles.includes(f.id))
        : files;

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

  const handleSmartCategorizeAll = async () => {
    if (!settings.smartCategorization) {
      toast.error('Smart categorization is disabled');
      return;
    }

    setProcessing(true);
    try {
      const targetFiles = selectedFiles.length > 0 
        ? files.filter(f => selectedFiles.includes(f.id))
        : files;

      let processed = 0;
      for (const file of targetFiles) {
        const category = getSmartCategory(file);
        if (category.confidence >= settings.confidence) {
          const categoryTags = [category.primary];
          if (category.secondary) categoryTags.push(category.secondary);
          onTagsUpdate(file.id, categoryTags);
          processed++;
        }
      }

      toast.success(`Smart categorized ${processed} files`);
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
      : files;

    targetFiles.forEach(file => {
      onTagsUpdate(file.id, [customTag.trim()]);
    });

    setCustomTag('');
    toast.success(`Added tag "${customTag}" to ${targetFiles.length} files`);
  };

  const handleApplySuggestion = (tag: string) => {
    const targetFiles = selectedFiles.length > 0 
      ? files.filter(f => selectedFiles.includes(f.id))
      : files;

    targetFiles.forEach(file => {
      onTagsUpdate(file.id, [tag]);
    });

    toast.success(`Applied tag "${tag}" to ${targetFiles.length} files`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Settings Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Auto-Organization Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-tagging" className="text-sm">Auto-tagging</Label>
              <Switch
                id="auto-tagging"
                checked={settings.autoTagging}
                onCheckedChange={(checked) => handleSettingChange('autoTagging', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="smart-categorization" className="text-sm">Smart categorization</Label>
              <Switch
                id="smart-categorization"
                checked={settings.smartCategorization}
                onCheckedChange={(checked) => handleSettingChange('smartCategorization', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="tag-suggestions" className="text-sm">Tag suggestions</Label>
              <Switch
                id="tag-suggestions"
                checked={settings.tagSuggestions}
                onCheckedChange={(checked) => handleSettingChange('tagSuggestions', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="bulk-tagging" className="text-sm">Bulk tagging</Label>
              <Switch
                id="bulk-tagging"
                checked={settings.bulkTagging}
                onCheckedChange={(checked) => handleSettingChange('bulkTagging', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Confidence Threshold: {Math.round(settings.confidence * 100)}%</Label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.confidence}
              onChange={(e) => handleSettingChange('confidence', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={handleAutoTagAll}
          disabled={processing || !settings.autoTagging}
          className="w-full"
          variant="default"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          {processing ? 'Processing...' : 'Auto-tag Files'}
        </Button>

        <Button
          onClick={handleSmartCategorizeAll}
          disabled={processing || !settings.smartCategorization}
          className="w-full"
          variant="outline"
        >
          <Brain className="h-4 w-4 mr-2" />
          Smart Categorize
        </Button>
      </div>

      {/* Custom Tag Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Add Custom Tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddCustomTag}
              disabled={!customTag.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tag Suggestions */}
      {settings.tagSuggestions && tagSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Smart Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tagSuggestions.map((tag) => (
                <TooltipProvider key={tag}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleApplySuggestion(tag)}
                      >
                        {tag}
                        <Plus className="h-3 w-3 ml-1" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to apply this tag</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Tags Browser */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Available Tags ({allTags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <ScrollArea className="h-40">
              <div className="flex flex-wrap gap-2">
                {filteredTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                    onClick={() => handleApplySuggestion(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* File Preview with Categories */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Selected Files ({selectedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {files
                  .filter(f => selectedFiles.includes(f.id))
                  .map((file) => {
                    const category = getSmartCategory(file);
                    const autoTags = generateAutoTags(file);
                    
                    return (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <SmartCategoryBadge category={category} showTooltip={false} />
                            <div className="flex flex-wrap gap-1">
                              {autoTags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {autoTags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{autoTags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Performance Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{files.length}</p>
              <p className="text-xs text-muted-foreground">Total Files</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{allTags.length}</p>
              <p className="text-xs text-muted-foreground">Auto Tags</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{tagSuggestions.length}</p>
              <p className="text-xs text-muted-foreground">Suggestions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{selectedFiles.length}</p>
              <p className="text-xs text-muted-foreground">Selected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}