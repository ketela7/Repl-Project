"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Package, 
  Filter, 
  Settings, 
  RefreshCw,
  FolderPlus,
  Grid3X3,
  List,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Star,
  Clock,
  Share2,
  Trash2,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the toolbar
export type FloatingToolbarTab = 
  | 'search' 
  | 'batch' 
  | 'filter' 
  | 'actions';

interface FloatingToolbarProps {
  activeTab: FloatingToolbarTab | null;
  onTabChange: (tab: FloatingToolbarTab | null) => void;
  totalFiles: number;
  selectedCount: number;
  fileTypeCounts: Record<string, number>;
  onRefresh: () => void;
  onCreateFolder: () => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: any) => void;
  className?: string;
}

export function FloatingToolbar({
  activeTab,
  onTabChange,
  totalFiles,
  selectedCount,
  fileTypeCounts,
  onRefresh,
  onCreateFolder,
  viewMode,
  onViewModeChange,
  onSearch,
  onFilterChange,
  className
}: FloatingToolbarProps) {
  
  const handleTabClick = (tab: FloatingToolbarTab) => {
    if (activeTab === tab) {
      onTabChange(null); // Close if already active
    } else {
      onTabChange(tab);
    }
  };

  const getFileTypeTotal = () => {
    return Object.values(fileTypeCounts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm",
      className
    )}>
      {/* Floating Tabs */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 overflow-x-scroll scrollbar-hide scroll-smooth"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Search Tab */}
          <Button
            variant={activeTab === 'search' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabClick('search')}
            className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>

          {/* Batch Operations Tab */}
          <Button
            variant={activeTab === 'batch' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabClick('batch')}
            className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            disabled={selectedCount === 0}
          >
            <Package className="h-4 w-4" />
            Batch
            {selectedCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedCount}
              </Badge>
            )}
          </Button>

          {/* Smart Filters Tab */}
          <Button
            variant={activeTab === 'filter' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabClick('filter')}
            className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>

          {/* File Counter Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full flex-shrink-0">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{totalFiles}</span>
          </div>

          {/* File Type Counters */}
          {Object.entries(fileTypeCounts).map(([type, count]) => (
            count > 0 && (
              <Badge key={type} variant="outline" className="flex items-center gap-1 flex-shrink-0">
                {getFileTypeIcon(type)}
                <span>{count}</span>
              </Badge>
            )
          ))}
        </div>

        {/* Actions Tab */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'actions' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabClick('actions')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dynamic Content Area */}
      {activeTab && (
        <div className="border-t bg-muted/30 p-4">
          {activeTab === 'search' && <SearchContent onSearch={onSearch} />}
          {activeTab === 'batch' && <BatchContent selectedCount={selectedCount} />}
          {activeTab === 'filter' && <FilterContent onFilterChange={onFilterChange} />}
          {activeTab === 'actions' && (
            <ActionsContent 
              onRefresh={onRefresh}
              onCreateFolder={onCreateFolder}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get file type icons
function getFileTypeIcon(type: string) {
  const iconMap: Record<string, React.ReactNode> = {
    document: <FileText className="h-3 w-3" />,
    image: <Image className="h-3 w-3" />,
    video: <Video className="h-3 w-3" />,
    audio: <Music className="h-3 w-3" />,
    archive: <Archive className="h-3 w-3" />,
  };
  return iconMap[type] || <FileText className="h-3 w-3" />;
}

// Search Content Component
function SearchContent({ onSearch }: { onSearch?: (query: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchQuery);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Try: "presentation 2024" or "shared by john"</span>
      </div>
    </div>
  );
}

// Batch Operations Content
function BatchContent({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{selectedCount} items selected</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button size="sm" variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button size="sm" variant="outline">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}

// Smart Filters Content
function FilterContent({ onFilterChange }: { onFilterChange?: (filters: any) => void }) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const toggleFilter = (filter: string) => {
    const newFilters = activeFilters.includes(filter) 
      ? activeFilters.filter(f => f !== filter)
      : [...activeFilters, filter];
    
    setActiveFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange({ fileTypeFilter: newFilters });
    }
  };

  const quickFilters = [
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'shared', label: 'Shared', icon: Share2 },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const fileTypeFilters = [
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'archives', label: 'Archives', icon: Archive },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div>
        <h4 className="text-sm font-medium mb-2">Quick Filters</h4>
        <div className="flex items-center gap-2 flex-wrap">
          {quickFilters.map((filter) => (
            <Button
              key={filter.id}
              size="sm"
              variant={activeFilters.includes(filter.id) ? 'default' : 'outline'}
              onClick={() => toggleFilter(filter.id)}
              className="flex items-center gap-2"
            >
              <filter.icon className="h-4 w-4" />
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* File Type Filters */}
      <div>
        <h4 className="text-sm font-medium mb-2">File Types</h4>
        <div className="flex items-center gap-2 flex-wrap">
          {fileTypeFilters.map((filter) => (
            <Button
              key={filter.id}
              size="sm"
              variant={activeFilters.includes(filter.id) ? 'default' : 'outline'}
              onClick={() => toggleFilter(filter.id)}
              className="flex items-center gap-2"
            >
              <filter.icon className="h-4 w-4" />
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Actions Content
function ActionsContent({ 
  onRefresh, 
  onCreateFolder, 
  viewMode, 
  onViewModeChange 
}: {
  onRefresh: () => void;
  onCreateFolder: () => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={onCreateFolder} variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <div className="flex border rounded-md">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange('table')}
              className="rounded-l-none border-l"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}