"use client";

import React, { useState } from 'react';
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTouchButtonClasses } from "@/lib/mobile-optimization";
import { 
  CalendarDays,
  HardDrive,
  User,
  Filter,
  X
} from "lucide-react";

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  fileType: string;
  minSize?: string;
  maxSize?: string;
  createdAfter?: string;
  createdBefore?: string;
  modifiedAfter?: string;
  modifiedBefore?: string;
  owner?: string;
  viewStatus: string;
}

export function AdvancedFilters({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters
}: AdvancedFiltersProps) {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  const fileTypeOptions = [
    { value: 'all', label: 'All Files' },
    { value: 'documents', label: 'Documents' },
    { value: 'spreadsheets', label: 'Spreadsheets' },
    { value: 'presentations', label: 'Presentations' },
    { value: 'images', label: 'Images' },
    { value: 'videos', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'pdfs', label: 'PDFs' },
    { value: 'archives', label: 'Archives' },
    { value: 'folders', label: 'Folders Only' }
  ];

  const viewStatusOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'owned', label: 'Owned by Me' },
    { value: 'shared', label: 'Shared with Me' },
    { value: 'starred', label: 'Starred' },
    { value: 'recent', label: 'Recent' }
  ];

  const sizeUnits = [
    { value: 'MB', label: 'MB' },
    { value: 'GB', label: 'GB' }
  ];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      fileType: 'all',
      viewStatus: 'all'
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.fileType !== 'all') count++;
    if (filters.viewStatus !== 'all') count++;
    if (filters.minSize) count++;
    if (filters.maxSize) count++;
    if (filters.createdAfter) count++;
    if (filters.createdBefore) count++;
    if (filters.modifiedAfter) count++;
    if (filters.modifiedBefore) count++;
    if (filters.owner) count++;
    return count;
  };

  const renderContent = () => (
    <div className="space-y-6">
      {/* Active filters indicator */}
      {getActiveFilterCount() > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <Filter className="h-3 w-3 mr-1" />
            {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}

      {/* File type filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">File Type</Label>
        <Select
          value={filters.fileType}
          onValueChange={(value) => handleFilterChange('fileType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select file type" />
          </SelectTrigger>
          <SelectContent>
            {fileTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View status filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">View Status</Label>
        <Select
          value={filters.viewStatus}
          onValueChange={(value) => handleFilterChange('viewStatus', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select view status" />
          </SelectTrigger>
          <SelectContent>
            {viewStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* File size filters */}
      <div className="space-y-4">
        <Label className="text-sm font-medium flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          File Size
        </Label>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Minimum Size</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minSize || ''}
              onChange={(e) => handleFilterChange('minSize', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Maximum Size</Label>
            <Input
              type="number"
              placeholder="∞"
              value={filters.maxSize || ''}
              onChange={(e) => handleFilterChange('maxSize', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Date filters */}
      <div className="space-y-4">
        <Label className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Date Range
        </Label>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Created After</Label>
            <Input
              type="date"
              value={filters.createdAfter || ''}
              onChange={(e) => handleFilterChange('createdAfter', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Created Before</Label>
            <Input
              type="date"
              value={filters.createdBefore || ''}
              onChange={(e) => handleFilterChange('createdBefore', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Modified After</Label>
            <Input
              type="date"
              value={filters.modifiedAfter || ''}
              onChange={(e) => handleFilterChange('modifiedAfter', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Modified Before</Label>
            <Input
              type="date"
              value={filters.modifiedBefore || ''}
              onChange={(e) => handleFilterChange('modifiedBefore', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Owner filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Owner
        </Label>
        <Input
          placeholder="Enter owner email..."
          value={filters.owner || ''}
          onChange={(e) => handleFilterChange('owner', e.target.value)}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={onClose}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Advanced Filters</BottomSheetTitle>
            <BottomSheetDescription>
              Refine your search with advanced filtering options
            </BottomSheetDescription>
          </BottomSheetHeader>
          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            {renderContent()}
          </div>
          <BottomSheetFooter className="flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className={getTouchButtonClasses('default')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className={getTouchButtonClasses('default')}
            >
              Apply Filters
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Refine your search with advanced filtering options
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}