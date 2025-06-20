"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { 
  BottomSheet, 
  BottomSheetContent, 
  BottomSheetHeader, 
  BottomSheetTitle, 
  BottomSheetDescription,
  BottomSheetFooter 
} from "@/components/ui/bottom-sheet";
import { 
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Folder,
  Code,
  Calendar,
  User,
  HardDrive,
  X,
  Filter
} from "lucide-react";

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

interface MobileFiltersBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileTypeFilter: string[];
  advancedFilters: AdvancedFilters;
  onFileTypeChange: (fileTypes: string[]) => void;
  onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
  onClearAdvanced: () => void;
  onClearAll: () => void;
}

const fileTypeOptions = [
  { key: 'folder', label: 'Folders', icon: Folder, color: 'text-blue-600' },
  { key: 'document', label: 'Documents', icon: FileText, color: 'text-blue-500' },
  { key: 'spreadsheet', label: 'Spreadsheets', icon: FileText, color: 'text-green-600' },
  { key: 'presentation', label: 'Presentations', icon: FileText, color: 'text-orange-600' },
  { key: 'image', label: 'Images', icon: Image, color: 'text-purple-600' },
  { key: 'video', label: 'Videos', icon: Video, color: 'text-red-600' },
  { key: 'audio', label: 'Audio', icon: Music, color: 'text-indigo-600' },
  { key: 'archive', label: 'Archives', icon: Archive, color: 'text-yellow-600' },
  { key: 'code', label: 'Code Files', icon: Code, color: 'text-yellow-600' },
];

export function MobileFiltersBottomSheet({
  open,
  onOpenChange,
  fileTypeFilter,
  advancedFilters,
  onFileTypeChange,
  onAdvancedFiltersChange,
  onClearAdvanced,
  onClearAll
}: MobileFiltersBottomSheetProps) {
  const [localAdvancedFilters, setLocalAdvancedFilters] = useState<AdvancedFilters>(advancedFilters);

  const handleFileTypeToggle = (fileType: string) => {
    const newFileTypes = fileTypeFilter.includes(fileType)
      ? fileTypeFilter.filter(t => t !== fileType)
      : [...fileTypeFilter, fileType];
    onFileTypeChange(newFileTypes);
  };

  const handleAdvancedFilterChange = (key: keyof AdvancedFilters, value: any) => {
    const newFilters = { ...localAdvancedFilters, [key]: value };
    setLocalAdvancedFilters(newFilters);
  };

  const applyAdvancedFilters = () => {
    onAdvancedFiltersChange(localAdvancedFilters);
    onOpenChange(false);
  };

  const hasActiveFilters = fileTypeFilter.length > 0 || 
                          Object.keys(advancedFilters).some(key => {
                            const value = advancedFilters[key as keyof AdvancedFilters];
                            return value !== undefined && value !== null && 
                                   (typeof value === 'object' ? Object.keys(value).length > 0 : true);
                          });

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="max-h-[90vh] overflow-y-auto">
        <BottomSheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <BottomSheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </BottomSheetTitle>
              <BottomSheetDescription>
                Filter files by type, size, date, and owner
              </BottomSheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </BottomSheetHeader>

        <div className="px-4 pb-4 space-y-6">
          {/* File Type Filters */}
          <div>
            <Label className="text-sm font-medium mb-3 block">File Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {fileTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = fileTypeFilter.includes(option.key);
                
                return (
                  <Button
                    key={option.key}
                    variant={isSelected ? "default" : "outline"}
                    className="h-12 justify-start text-left p-3"
                    onClick={() => handleFileTypeToggle(option.key)}
                  >
                    <IconComponent className={`h-4 w-4 mr-2 ${isSelected ? 'text-primary-foreground' : option.color}`} />
                    <span className="text-sm">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Size Range Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">File Size Range</Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Min Size</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={localAdvancedFilters.sizeRange?.min || ''}
                    onChange={(e) => handleAdvancedFilterChange('sizeRange', {
                      ...localAdvancedFilters.sizeRange,
                      min: e.target.value ? parseInt(e.target.value) : undefined,
                      unit: localAdvancedFilters.sizeRange?.unit || 'MB'
                    })}
                    className="h-10"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Max Size</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={localAdvancedFilters.sizeRange?.max || ''}
                    onChange={(e) => handleAdvancedFilterChange('sizeRange', {
                      ...localAdvancedFilters.sizeRange,
                      max: e.target.value ? parseInt(e.target.value) : undefined,
                      unit: localAdvancedFilters.sizeRange?.unit || 'MB'
                    })}
                    className="h-10"
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Select
                    value={localAdvancedFilters.sizeRange?.unit || 'MB'}
                    onValueChange={(value) => handleAdvancedFilterChange('sizeRange', {
                      ...localAdvancedFilters.sizeRange,
                      unit: value as 'B' | 'KB' | 'MB' | 'GB'
                    })}
                  >
                    <SelectTrigger className="h-10">
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
            </div>
          </div>

          <Separator />

          {/* Date Range Filters */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Created Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <SimpleDatePicker
                  date={localAdvancedFilters.createdDateRange?.from}
                  onDateChange={(date) => handleAdvancedFilterChange('createdDateRange', {
                    ...localAdvancedFilters.createdDateRange,
                    from: date
                  })}
                  placeholder="Select date"
                  className="w-full h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <SimpleDatePicker
                  date={localAdvancedFilters.createdDateRange?.to}
                  onDateChange={(date) => handleAdvancedFilterChange('createdDateRange', {
                    ...localAdvancedFilters.createdDateRange,
                    to: date
                  })}
                  placeholder="Select date"
                  className="w-full h-10"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Modified Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <SimpleDatePicker
                  date={localAdvancedFilters.modifiedDateRange?.from}
                  onDateChange={(date) => handleAdvancedFilterChange('modifiedDateRange', {
                    ...localAdvancedFilters.modifiedDateRange,
                    from: date
                  })}
                  placeholder="Select date"
                  className="w-full h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <SimpleDatePicker
                  date={localAdvancedFilters.modifiedDateRange?.to}
                  onDateChange={(date) => handleAdvancedFilterChange('modifiedDateRange', {
                    ...localAdvancedFilters.modifiedDateRange,
                    to: date
                  })}
                  placeholder="Select date"
                  className="w-full h-10"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Owner Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Owner</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by owner name or email..."
                value={localAdvancedFilters.owner || ''}
                onChange={(e) => handleAdvancedFilterChange('owner', e.target.value || undefined)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </div>

        <BottomSheetFooter>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={onClearAll}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={applyAdvancedFilters}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}