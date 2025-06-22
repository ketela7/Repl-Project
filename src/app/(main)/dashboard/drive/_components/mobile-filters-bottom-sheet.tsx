"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Folder,
  Code,
  Calendar,
  User,
  HardDrive,
  X,
  Filter,
  Star,
  Clock,
  Trash,
  Share,
  Home,
  RefreshCw,
  ChevronDown,
  ChevronUp
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
  onFilterChange: (filters: any) => void;
  currentFilters: any;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function MobileFiltersBottomSheet({
  open,
  onOpenChange,
  onFilterChange,
  currentFilters,
  hasActiveFilters,
  onClearFilters
}: MobileFiltersBottomSheetProps) {
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Basic Menu Items
  const basicMenuItems = [
    { id: 'all', label: 'All Files', icon: Home, description: 'Show all files and folders' },
    { id: 'my-drive', label: 'My Drive', icon: HardDrive, description: 'Files you own' },
    { id: 'shared', label: 'Shared with me', icon: Share, description: 'Files shared by others' },
    { id: 'starred', label: 'Starred', icon: Star, description: 'Files you starred' },
    { id: 'recent', label: 'Recent', icon: Clock, description: 'Recently viewed files' },
    { id: 'trash', label: 'Trash', icon: Trash, description: 'Deleted items' },
  ];

  // File Type Filters
  const fileTypes = [
    { id: 'folders', label: 'Folders', icon: Folder, color: 'text-blue-600' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'text-blue-500' },
    { id: 'spreadsheets', label: 'Spreadsheets', icon: FileText, color: 'text-green-600' },
    { id: 'presentations', label: 'Presentations', icon: FileText, color: 'text-orange-600' },
    { id: 'images', label: 'Images', icon: Image, color: 'text-purple-600' },
    { id: 'videos', label: 'Videos', icon: Video, color: 'text-red-600' },
    { id: 'audio', label: 'Audio', icon: Music, color: 'text-indigo-600' },
    { id: 'archives', label: 'Archives', icon: Archive, color: 'text-yellow-600' },
    { id: 'code', label: 'Code Files', icon: Code, color: 'text-gray-600' },
  ];

  const handleBasicMenuClick = (menuId: string) => {
    onFilterChange({ viewFilter: menuId });
    onOpenChange(false);
  };

  const handleFileTypeClick = (typeId: string) => {
    const currentTypes = currentFilters?.fileTypes || [];
    const newTypes = currentTypes.includes(typeId) 
      ? currentTypes.filter((t: string) => t !== typeId)
      : [...currentTypes, typeId];
    
    onFilterChange({ ...currentFilters, fileTypes: newTypes });
  };

  const handleAdvancedFilterChange = (key: string, value: any) => {
    const newFilters = { ...advancedFilters, [key]: value };
    setAdvancedFilters(newFilters);
    onFilterChange({ ...(currentFilters || {}), advanced: newFilters });
  };

  const handleClearAll = () => {
    setAdvancedFilters({});
    onClearFilters();
    onOpenChange(false);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="max-h-[90vh] overflow-y-auto">
        <BottomSheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <BottomSheetTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Search
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
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
          {/* Basic Menu */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">View Status</h3>
              <Badge variant="outline" className="text-xs">Quick Access</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {basicMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentFilters?.viewFilter === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "outline"}
                    className="h-auto p-3 text-left justify-start"
                    onClick={() => handleBasicMenuClick(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{item.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* File Types */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">File Types</h3>
            <div className="grid grid-cols-2 gap-2">
              {fileTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = currentFilters?.fileTypes?.includes(type.id);
                return (
                  <Button
                    key={type.id}
                    variant={isSelected ? "default" : "outline"}
                    className="h-12 text-left justify-start"
                    onClick={() => handleFileTypeClick(type.id)}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${isSelected ? 'text-white' : type.color}`} />
                    <span className="text-sm">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Advanced Filters Toggle */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <h3 className="font-medium text-sm">Advanced Filters</h3>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAdvanced && (
              <div className="space-y-4 pt-2">
                {/* File Size Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">File Size Range</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Min Size</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-9"
                        value={advancedFilters.sizeRange?.min || ''}
                        onChange={(e) => handleAdvancedFilterChange('sizeRange', {
                          ...advancedFilters.sizeRange,
                          min: Number(e.target.value)
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max Size</Label>
                      <Input
                        type="number"
                        placeholder="∞"
                        className="h-9"
                        value={advancedFilters.sizeRange?.max || ''}
                        onChange={(e) => handleAdvancedFilterChange('sizeRange', {
                          ...advancedFilters.sizeRange,
                          max: Number(e.target.value)
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Unit</Label>
                      <Select
                        value={advancedFilters.sizeRange?.unit || 'MB'}
                        onValueChange={(value) => handleAdvancedFilterChange('sizeRange', {
                          ...advancedFilters.sizeRange,
                          unit: value
                        })}
                      >
                        <SelectTrigger className="h-9">
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

                {/* Created Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Created Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <SimpleDatePicker
                        date={advancedFilters.createdDateRange?.from}
                        onDateChange={(date) => handleAdvancedFilterChange('createdDateRange', {
                          ...advancedFilters.createdDateRange,
                          from: date
                        })}
                        placeholder="Select date"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <SimpleDatePicker
                        date={advancedFilters.createdDateRange?.to}
                        onDateChange={(date) => handleAdvancedFilterChange('createdDateRange', {
                          ...advancedFilters.createdDateRange,
                          to: date
                        })}
                        placeholder="Select date"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Modified Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Modified Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <SimpleDatePicker
                        date={advancedFilters.modifiedDateRange?.from}
                        onDateChange={(date) => handleAdvancedFilterChange('modifiedDateRange', {
                          ...advancedFilters.modifiedDateRange,
                          from: date
                        })}
                        placeholder="Select date"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <SimpleDatePicker
                        date={advancedFilters.modifiedDateRange?.to}
                        onDateChange={(date) => handleAdvancedFilterChange('modifiedDateRange', {
                          ...advancedFilters.modifiedDateRange,
                          to: date
                        })}
                        placeholder="Select date"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Owner Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter owner email"
                    className="h-9"
                    value={advancedFilters.owner || ''}
                    onChange={(e) => handleAdvancedFilterChange('owner', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <BottomSheetFooter className="flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setAdvancedFilters({})}
            className="flex-1"
            disabled={!showAdvanced}
          >
            Clear Advanced
          </Button>
          <Button
            variant="ghost"
            onClick={handleClearAll}
            className="flex-1"
          >
            Clear All
          </Button>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}