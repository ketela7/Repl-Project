"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { 
  Folder,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileVideo,
  Music,
  Archive,
  FileCode,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  HardDrive,
  User,
  Clock,
  SlidersHorizontal,
  Search,
  Trash2,
  Share2,
  Star,
  Download,
  Plus
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface DriveFiltersSidebarProps {
  activeView: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash';
  fileTypeFilter: string[];
  onViewChange: (view: 'all' | 'my-drive' | 'shared' | 'starred' | 'recent' | 'trash') => void;
  onFileTypeChange: (fileTypes: string[]) => void;
  onAdvancedFiltersChange?: (filters: AdvancedFilters) => void;
  isCollapsed?: boolean;
}

interface AdvancedFilters {
  sizeRange?: {
    min?: number;
    max?: number;
    unit: 'B' | 'KB' | 'MB' | 'GB';
  };
  createdDateRange?: {
    from?: Date;
    to?: Date;
  };
  modifiedDateRange?: {
    from?: Date;
    to?: Date;
  };
  owner?: string;
}

const viewOptions = [
  { key: 'all', label: 'All Files', icon: Home, description: 'All accessible files' },
  { key: 'my-drive', label: 'My Drive', icon: Folder, description: 'Files I own' },
  { key: 'shared', label: 'Shared with Me', icon: Share, description: 'Files shared by others' },
  { key: 'starred', label: 'Starred', icon: Star, description: 'Favorite files' },
  { key: 'recent', label: 'Recent', icon: Clock, description: 'Recently accessed' },
  { key: 'trash', label: 'Trash', icon: Trash2, description: 'Deleted files' },
] as const;

const fileTypeOptions = [
  { key: 'folder', label: 'Folders', icon: Folder, count: 0, description: 'Google Drive folders' },
  { key: 'document', label: 'Documents', icon: FileText, count: 0, description: 'Text documents, PDFs, Word files' },
  { key: 'spreadsheet', label: 'Spreadsheets', icon: FileText, count: 0, description: 'Excel files, Google Sheets, CSV' },
  { key: 'presentation', label: 'Presentations', icon: FileText, count: 0, description: 'PowerPoint, Google Slides' },
  { key: 'image', label: 'Images', icon: Image, count: 0, description: 'Photos, graphics, icons' },
  { key: 'video', label: 'Videos', icon: Video, count: 0, description: 'Movies, clips, recordings' },
  { key: 'audio', label: 'Audio', icon: Music, count: 0, description: 'Music, podcasts, recordings' },
  { key: 'archive', label: 'Archives', icon: Archive, count: 0, description: 'ZIP, RAR, compressed files' },
  { key: 'code', label: 'Code Files', icon: FileText, count: 0, description: 'Programming files, scripts' },
];

export function DriveFiltersSidebar({ 
  activeView, 
  fileTypeFilter, 
  onViewChange, 
  onFileTypeChange,
  onAdvancedFiltersChange,
  isCollapsed = false 
}: DriveFiltersSidebarProps) {

  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  // Advanced filter states
  const [sizeFilter, setSizeFilter] = useState<{
    min: string;
    max: string;
    unit: 'B' | 'KB' | 'MB' | 'GB';
  }>({
    min: '',
    max: '',
    unit: 'MB'
  });

  const [createdDateRange, setCreatedDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  const [modifiedDateRange, setModifiedDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  const [ownerFilter, setOwnerFilter] = useState('');

  const handleFileTypeToggle = (fileTypeKey: string) => {
    const newFilter = fileTypeFilter.includes(fileTypeKey)
      ? fileTypeFilter.filter(type => type !== fileTypeKey)
      : [...fileTypeFilter, fileTypeKey];
    onFileTypeChange(newFilter);
  };

  // Utility functions for advanced filters
  const updateAdvancedFilters = () => {
    if (onAdvancedFiltersChange) {
      const filters: AdvancedFilters = {};

      if (sizeFilter.min || sizeFilter.max) {
        filters.sizeRange = {
          min: sizeFilter.min ? parseFloat(sizeFilter.min) : undefined,
          max: sizeFilter.max ? parseFloat(sizeFilter.max) : undefined,
          unit: sizeFilter.unit
        };
      }

      if (createdDateRange.from || createdDateRange.to) {
        filters.createdDateRange = createdDateRange;
      }

      if (modifiedDateRange.from || modifiedDateRange.to) {
        filters.modifiedDateRange = modifiedDateRange;
      }

      if (ownerFilter.trim()) {
        filters.owner = ownerFilter.trim();
      }

      onAdvancedFiltersChange(filters);
    }
  };

  const clearAllFilters = () => {
    onViewChange('all');
    onFileTypeChange([]);
    setSizeFilter({ min: '', max: '', unit: 'MB' });
    setCreatedDateRange({});
    setModifiedDateRange({});
    setOwnerFilter('');
    updateAdvancedFilters();
  };

  const removeFileTypeFilter = (fileTypeKey: string) => {
    const newFilter = fileTypeFilter.filter(type => type !== fileTypeKey);
    onFileTypeChange(newFilter);
  };

  const hasAdvancedFilters = sizeFilter.min || sizeFilter.max || 
                           createdDateRange.from || createdDateRange.to ||
                           modifiedDateRange.from || modifiedDateRange.to ||
                           ownerFilter.trim();

  const hasActiveFilters = activeView !== 'all' || fileTypeFilter.length > 0 || hasAdvancedFilters;

  // Apply advanced filters when they change
  React.useEffect(() => {
    updateAdvancedFilters();
  }, [sizeFilter, createdDateRange, modifiedDateRange, ownerFilter, onAdvancedFiltersChange]);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-background to-accent/5">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Smart Filters</h3>
              </div>

              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {(activeView !== 'all' ? 1 : 0) + fileTypeFilter.length} active
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 px-2"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick View Filters - Always Visible */}
          <div className="flex flex-wrap gap-2">
            {viewOptions.map(({ key, label, icon: Icon }) => {
              const isActive = activeView === key;
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onViewChange(key as any)}
                  className={`h-8 px-3 text-xs transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
                      : 'hover:bg-accent hover:scale-105'
                  }`}
                >
                  <Icon className="h-3 w-3 mr-2" />
                  {label}
                  {isActive && <div className="ml-1 w-1 h-1 bg-primary-foreground rounded-full" />}
                </Button>
              );
            })}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground">Active:</span>
              {activeView !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20"
                >
                  {viewOptions.find(v => v.key === activeView)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewChange('all')}
                    className="ml-1 h-3 w-3 p-0 hover:bg-destructive/20"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {fileTypeFilter.map(type => (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="text-xs px-2 py-1 bg-accent/50 hover:bg-accent"
                >
                  {fileTypeOptions.find(ft => ft.key === type)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFileTypeFilter(type)}
                    className="ml-1 h-3 w-3 p-0 hover:bg-destructive/20"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Expanded File Type Filters */}
          {isExpanded && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">File Types</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {fileTypeOptions.map(({ key, label, icon: Icon }) => {
                    const isActive = fileTypeFilter.includes(key);
                    return (
                      <div 
                        key={key} 
                        className={`flex items-center space-x-2 p-2 rounded-md border transition-all duration-200 cursor-pointer hover:bg-accent hover:scale-105 ${
                          isActive 
                            ? 'bg-primary/10 border-primary/30 shadow-sm' 
                            : 'border-border hover:border-primary/20'
                        }`}
                        onClick={() => handleFileTypeToggle(key)}
                      >
                        <Checkbox
                          id={key}
                          checked={isActive}
                          onCheckedChange={() => handleFileTypeToggle(key)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          <label 
                            htmlFor={key} 
                            className={`text-xs font-medium cursor-pointer truncate ${
                              isActive ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {label}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Filters Section */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Advanced Filters</span>
                    {hasAdvancedFilters && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        Active
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                    className="h-7 px-2"
                  >
                    {isAdvancedExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {isAdvancedExpanded && (
                  <div className="space-y-4">
                    {/* Size Range Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">File Size Range</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={sizeFilter.min}
                          onChange={(e) => setSizeFilter(prev => ({ ...prev, min: e.target.value }))}
                          className="h-8 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={sizeFilter.max}
                          onChange={(e) => setSizeFilter(prev => ({ ...prev, max: e.target.value }))}
                          className="h-8 text-xs"
                        />
                        <Select
                          value={sizeFilter.unit}
                          onValueChange={(value: 'B' | 'KB' | 'MB' | 'GB') => 
                            setSizeFilter(prev => ({ ...prev, unit: value }))
                          }
                        >
                          <SelectTrigger className="h-8 w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="KB">KB</SelectItem>
                            <SelectItem value="MB">MB</SelectItem>
                            <SelectItem value="GB">GB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Created Date Range Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Created Date Range</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SimpleDatePicker
                          date={createdDateRange.from}
                          onDateChange={(date) => setCreatedDateRange(prev => ({ ...prev, from: date }))}
                          placeholder="From date"
                        />
                        <SimpleDatePicker
                          date={createdDateRange.to}
                          onDateChange={(date) => setCreatedDateRange(prev => ({ ...prev, to: date }))}
                          placeholder="To date"
                        />
                      </div>
                    </div>

                    {/* Modified Date Range Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Modified Date Range</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SimpleDatePicker
                          date={modifiedDateRange.from}
                          onDateChange={(date) => setModifiedDateRange(prev => ({ ...prev, from: date }))}
                          placeholder="From date"
                        />
                        <SimpleDatePicker
                          date={modifiedDateRange.to}
                          onDateChange={(date) => setModifiedDateRange(prev => ({ ...prev, to: date }))}
                          placeholder="To date"
                        />
                      </div>
                    </div>

                    {/* Owner Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Owner</Label>
                      </div>
                      <Input
                        type="text"
                        placeholder="Enter owner name or email"
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}