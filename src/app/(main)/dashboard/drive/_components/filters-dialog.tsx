"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { useIsMobile } from "@/hooks/use-mobile";
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

interface FiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilterChange: (filters: any) => void;
  currentFilters: any;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FiltersDialog({
  open,
  onOpenChange,
  onFilterChange,
  currentFilters,
  hasActiveFilters,
  onClearFilters
}: FiltersDialogProps) {
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [showViewStatus, setShowViewStatus] = useState(false);
  const [showFileTypes, setShowFileTypes] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isMobile = useIsMobile();

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
  const fileTypeFilters = [
    { id: 'folder', label: 'Folders', icon: Folder, color: 'text-blue-600' },
    { id: 'document', label: 'Documents', icon: FileText, color: 'text-blue-600' },
    { id: 'spreadsheet', label: 'Spreadsheets', icon: FileText, color: 'text-green-600' },
    { id: 'presentation', label: 'Presentations', icon: FileText, color: 'text-orange-600' },
    { id: 'image', label: 'Images', icon: Image, color: 'text-purple-600' },
    { id: 'video', label: 'Videos', icon: Video, color: 'text-red-600' },
    { id: 'audio', label: 'Audio', icon: Music, color: 'text-blue-600' },
    { id: 'archive', label: 'Archives', icon: Archive, color: 'text-amber-600' },
    { id: 'code', label: 'Code Files', icon: Code, color: 'text-slate-600' },
  ];

  const handleBasicFilter = (viewId: string) => {
    onFilterChange({ activeView: viewId });
    // Close dialog after selection
    onOpenChange(false);
  };

  const handleFileTypeFilter = (typeId: string) => {
    // Check if this filter is already active
    const currentFilter = currentFilters?.fileTypeFilter;
    const isArray = Array.isArray(currentFilter);
    
    if (isArray) {
      // Handle array-based filter (toggle behavior)
      const newFilter = currentFilter.includes(typeId)
        ? currentFilter.filter((type: string) => type !== typeId)
        : [...currentFilter, typeId];
      onFilterChange({ fileTypeFilter: newFilter });
    } else {
      // Handle single value filter (replacement behavior)
      const newFilter = currentFilter === typeId ? '' : typeId;
      onFilterChange({ fileTypeFilter: newFilter });
    }
  };

  const handleAdvancedFiltersChange = (newFilters: AdvancedFilters) => {
    setAdvancedFilters(newFilters);
    onFilterChange({ advancedFilters: newFilters });
  };

  const handleClearAdvanced = () => {
    setAdvancedFilters({});
    onFilterChange({ advancedFilters: {} });
  };

  const handleClearAll = () => {
    setAdvancedFilters({});
    onClearFilters();
    onOpenChange(false);
  };

  const renderContent = () => (
    <>
      <div className="space-y-6 pt-2">
        {/* View Status Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => setShowViewStatus(!showViewStatus)}
            className="w-full justify-between p-0 h-auto"
          >
            <h3 className="text-sm font-semibold">View Status</h3>
            {showViewStatus ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showViewStatus && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {basicMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentFilters?.activeView === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "outline"}
                    className={`justify-start h-auto p-3 ${isActive ? 'ring-2 ring-primary/20' : ''}`}
                    onClick={() => handleBasicFilter(item.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* File Types Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => setShowFileTypes(!showFileTypes)}
            className="w-full justify-between p-0 h-auto"
          >
            <h3 className="text-sm font-semibold">File Types</h3>
            {showFileTypes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showFileTypes && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {fileTypeFilters.map((filter) => {
                const Icon = filter.icon;
                const currentFilter = currentFilters?.fileTypeFilter;
                const isArray = Array.isArray(currentFilter);
                const isActive = isArray 
                  ? currentFilter.includes(filter.id)
                  : currentFilter === filter.id;
                
                return (
                  <Button
                    key={filter.id}
                    variant={isActive ? "default" : "outline"}
                    className={`justify-start h-12 ${isActive ? 'ring-2 ring-primary/20' : ''}`}
                    onClick={() => handleFileTypeFilter(filter.id)}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${filter.color}`} />
                    <span className="text-sm">{filter.label}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Advanced Filters Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between p-0 h-auto"
          >
            <h3 className="text-sm font-semibold">Advanced Filters</h3>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showAdvanced && (
            <div className="space-y-4 pt-2">
              {/* Size Range Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">File Size Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Min Size</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="0"
                        className="text-sm"
                        value={advancedFilters.sizeRange?.min || ''}
                        onChange={(e) => handleAdvancedFiltersChange({
                          ...advancedFilters,
                          sizeRange: {
                            ...advancedFilters.sizeRange,
                            min: Number(e.target.value) || undefined,
                            unit: advancedFilters.sizeRange?.unit || 'MB'
                          }
                        })}
                      />
                      <Select
                        value={advancedFilters.sizeRange?.unit || 'MB'}
                        onValueChange={(unit: 'B' | 'KB' | 'MB' | 'GB') => handleAdvancedFiltersChange({
                          ...advancedFilters,
                          sizeRange: {
                            ...advancedFilters.sizeRange,
                            unit
                          }
                        })}
                      >
                        <SelectTrigger className="w-16 text-xs">
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
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Max Size</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="∞"
                        className="text-sm"
                        value={advancedFilters.sizeRange?.max || ''}
                        onChange={(e) => handleAdvancedFiltersChange({
                          ...advancedFilters,
                          sizeRange: {
                            ...advancedFilters.sizeRange,
                            max: Number(e.target.value) || undefined,
                            unit: advancedFilters.sizeRange?.unit || 'MB'
                          }
                        })}
                      />
                      <Select
                        value={advancedFilters.sizeRange?.unit || 'MB'}
                        onValueChange={(unit: 'B' | 'KB' | 'MB' | 'GB') => handleAdvancedFiltersChange({
                          ...advancedFilters,
                          sizeRange: {
                            ...advancedFilters.sizeRange,
                            unit
                          }
                        })}
                      >
                        <SelectTrigger className="w-16 text-xs">
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

              {/* Date Range Filters */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <SimpleDatePicker
                        date={advancedFilters.createdDateRange?.from}
                        onDateChange={(date) => handleAdvancedFiltersChange({
                          ...advancedFilters,
                          createdDateRange: {
                            ...advancedFilters.createdDateRange,
                            from: date || undefined
                          }
                        })}
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <SimpleDatePicker
                        date={advancedFilters.createdDateRange?.to}
                        onDateChange={(date) => handleAdvancedFiltersChange({
                          ...advancedFilters,
                          createdDateRange: {
                            ...advancedFilters.createdDateRange,
                            to: date || undefined
                          }
                        })}
                        placeholder="End date"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Modified Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <SimpleDatePicker
                        date={advancedFilters.modifiedDateRange?.from}
                        onDateChange={(date) => handleAdvancedFiltersChange({
                          ...advancedFilters,
                          modifiedDateRange: {
                            ...advancedFilters.modifiedDateRange,
                            from: date || undefined
                          }
                        })}
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <SimpleDatePicker
                        date={advancedFilters.modifiedDateRange?.to}
                        onDateChange={(date) => handleAdvancedFiltersChange({
                          ...advancedFilters,
                          modifiedDateRange: {
                            ...advancedFilters.modifiedDateRange,
                            to: date || undefined
                          }
                        })}
                        placeholder="End date"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Owner
                </Label>
                <Input
                  placeholder="Search by owner name or email"
                  className="text-sm"
                  value={advancedFilters.owner || ''}
                  onChange={(e) => handleAdvancedFiltersChange({
                    ...advancedFilters,
                    owner: e.target.value || undefined
                  })}
                />
              </div>

              {/* Clear Advanced Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAdvanced}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear Advanced
              </Button>
            </div>
          )}
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200 dark:border-blue-800">
            <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Active filters are applied. Use "Clear All" to reset all filters.
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <BottomSheetTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Filters & Search</div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="text-xs mr-1">Active</Badge>
                      )}
                      Filter files by type, size, date, and owner
                    </div>
                  </div>
                </BottomSheetTitle>
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

          <div className="px-4 pb-4 overflow-y-auto flex-1">
            {renderContent()}
          </div>

          <BottomSheetFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
            {hasActiveFilters && (
              <Button onClick={handleClearAll} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Filters & Search</div>
              <div className="text-sm font-normal text-muted-foreground">
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs mr-1">Active</Badge>
                )}
                Filter files by type, size, date, and owner
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-2">
            {renderContent()}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hasActiveFilters && (
            <Button onClick={handleClearAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}