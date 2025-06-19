"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  Package, 
  Filter, 
  Tag,
  MoreHorizontal,
  RefreshCw,
  FolderPlus
} from "lucide-react";

interface FloatingMenuProps {
  className?: string;
  children?: React.ReactNode;
}

export type FloatingMenuTab = 'search' | 'batch' | 'filter' | 'badges' | 'actions';

interface FloatingMenuTabData {
  id: FloatingMenuTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  description?: string;
}

interface FloatingMenuContextType {
  activeTab: FloatingMenuTab | null;
  setActiveTab: (tab: FloatingMenuTab | null) => void;
  selectedCount: number;
  setSelectedCount: (count: number) => void;
  activeFilters: number;
  setActiveFilters: (count: number) => void;
}

const FloatingMenuContext = React.createContext<FloatingMenuContextType | null>(null);

export function useFloatingMenu() {
  const context = React.useContext(FloatingMenuContext);
  if (!context) {
    throw new Error('useFloatingMenu must be used within FloatingMenuProvider');
  }
  return context;
}

export function FloatingMenuProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<FloatingMenuTab | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [activeFilters, setActiveFilters] = useState(0);

  return (
    <FloatingMenuContext.Provider value={{
      activeTab,
      setActiveTab,
      selectedCount,
      setSelectedCount,
      activeFilters,
      setActiveFilters
    }}>
      {children}
    </FloatingMenuContext.Provider>
  );
}

export function FloatingMenu({ className, children }: FloatingMenuProps) {
  const { activeTab, setActiveTab, selectedCount, activeFilters } = useFloatingMenu();

  const tabs: FloatingMenuTabData[] = [
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="h-4 w-4" />,
      description: 'Search files and folders'
    },
    {
      id: 'batch',
      label: 'Batch',
      icon: <Package className="h-4 w-4" />,
      badge: selectedCount > 0 ? selectedCount : undefined,
      description: 'Bulk operations'
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: <Filter className="h-4 w-4" />,
      badge: activeFilters > 0 ? activeFilters : undefined,
      description: 'Filter files'
    },
    {
      id: 'badges',
      label: 'Categories',
      icon: <Tag className="h-4 w-4" />,
      description: 'File categories'
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <MoreHorizontal className="h-4 w-4" />,
      description: 'Quick actions'
    }
  ];

  const handleTabClick = (tabId: FloatingMenuTab) => {
    if (activeTab === tabId) {
      setActiveTab(null);
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Floating Tabs */}
      <Card className="border-0 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="p-1">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={tab.description}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <Badge 
                    variant={activeTab === tab.id ? "secondary" : "default"}
                    className="ml-1 h-5 min-w-[20px] text-xs"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Content Area */}
      {activeTab && (
        <Card className="mt-2 border-0 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="p-4">
            {children}
          </div>
        </Card>
      )}
    </div>
  );
}

export function FloatingMenuSearch({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search files and folders..." 
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}) {
  const { activeTab } = useFloatingMenu();

  if (activeTab !== 'search') return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Search Files</h3>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Start typing to search through your files and folders
      </div>
    </div>
  );
}

export function FloatingMenuBatch({ 
  selectedItems,
  onBulkAction
}: {
  selectedItems: any[];
  onBulkAction: (action: string) => void;
}) {
  const { activeTab } = useFloatingMenu();

  if (activeTab !== 'batch') return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Batch Operations</h3>
        <Badge variant="secondary">{selectedItems.length} selected</Badge>
      </div>

      {selectedItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select files to enable batch operations</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onBulkAction('download')}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Download
          </button>
          <button
            onClick={() => onBulkAction('move')}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Move
          </button>
          <button
            onClick={() => onBulkAction('copy')}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Copy
          </button>
          <button
            onClick={() => onBulkAction('delete')}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function FloatingMenuFilter({ 
  filters,
  onFilterChange
}: {
  filters: any;
  onFilterChange: (filters: any) => void;
}) {
  const { activeTab } = useFloatingMenu();

  if (activeTab !== 'filter') return null;

  const quickFilters = [
    { id: 'all', label: 'All Files' },
    { id: 'my-drive', label: 'My Drive' },
    { id: 'shared', label: 'Shared' },
    { id: 'recent', label: 'Recent' },
    { id: 'starred', label: 'Starred' },
    { id: 'trash', label: 'Trash' }
  ];

  const fileTypes = [
    { id: 'documents', label: 'Documents' },
    { id: 'spreadsheets', label: 'Spreadsheets' },
    { id: 'presentations', label: 'Presentations' },
    { id: 'images', label: 'Images' },
    { id: 'videos', label: 'Videos' },
    { id: 'audio', label: 'Audio' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Filters</h3>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium mb-2">Quick Filters</h4>
          <div className="flex flex-wrap gap-1">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFilterChange({ view: filter.id })}
                className={cn(
                  "px-2 py-1 rounded-md text-xs border transition-colors",
                  filters.view === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">File Types</h4>
          <div className="flex flex-wrap gap-1">
            {fileTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => onFilterChange({ fileType: type.id })}
                className={cn(
                  "px-2 py-1 rounded-md text-xs border transition-colors",
                  filters.fileType === type.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {(filters.view || filters.fileType) && (
          <button
            onClick={() => onFilterChange({})}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}

export function FloatingMenuBadges({ 
  categories,
  onCategoryClick
}: {
  categories: any[];
  onCategoryClick: (category: string) => void;
}) {
  const { activeTab } = useFloatingMenu();

  if (activeTab !== 'badges') return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">File Categories</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onCategoryClick(category.name)}
            className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{category.name}</div>
              <div className="text-xs text-muted-foreground">{category.count} files</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function FloatingMenuActions({ 
  onAction
}: {
  onAction: (action: string) => void;
}) {
  const { activeTab } = useFloatingMenu();

  if (activeTab !== 'actions') return null;

  const actions = [
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <RefreshCw className="h-4 w-4" />,
      description: 'Reload files'
    },
    {
      id: 'create-folder',
      label: 'New Folder',
      icon: <FolderPlus className="h-4 w-4" />,
      description: 'Create new folder'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="flex items-center gap-2 p-3 rounded-md border hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            title={action.description}
          >
            {action.icon}
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}