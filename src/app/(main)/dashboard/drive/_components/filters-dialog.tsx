'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
} from '@/components/ui/bottom-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SimpleDatePicker } from '@/components/ui/simple-date-picker'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  Archive,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  FileText,
  Filter,
  Folder,
  HardDrive,
  Home,
  Image,
  Link,
  Music,
  RefreshCw,
  Share,
  Star,
  Trash,
  User,
  Video,
  X,
} from 'lucide-react'
import { cn } from '@/shared/utils'

interface AdvancedFilters {
  sizeRange?: {
    min?: number
    max?: number
    unit: 'B' | 'KB' | 'MB' | 'GB'
  }
  createdDateRange?: {
    from?: Date
    to?: Date
  }
  modifiedDateRange?: {
    from?: Date
    to?: Date
  }
  owner?: string
  sortBy?: 'name' | 'modified' | 'created' | 'size'
  sortOrder?: 'asc' | 'desc'
}

interface FiltersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilterChange: (filters: any) => void
  onApplyFilters?: () => void
  currentFilters: any
  hasActiveFilters: boolean
  onClearFilters: () => void
  isApplying?: boolean
}

export function FiltersDialog({
  open,
  onOpenChange,
  onFilterChange,
  onApplyFilters,
  currentFilters,
  hasActiveFilters,
  onClearFilters,
  isApplying = false,
}: FiltersDialogProps) {
  // Temporary state for filter changes (not applied until "Apply Filter" is clicked)
  const [tempActiveView, setTempActiveView] = useState(
    currentFilters?.activeView || 'all'
  )
  const [tempFileTypeFilter, setTempFileTypeFilter] = useState(
    currentFilters?.fileTypeFilter || []
  )
  const [tempAdvancedFilters, setTempAdvancedFilters] =
    useState<AdvancedFilters>(currentFilters?.advancedFilters || {})

  const [showViewStatus, setShowViewStatus] = useState(false)
  const [showFileTypes, setShowFileTypes] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const isMobile = useIsMobile()

  // Update temp states when current filters change
  React.useEffect(() => {
    if (open) {
      setTempActiveView(currentFilters?.activeView || 'all')
      setTempFileTypeFilter(currentFilters?.fileTypeFilter || [])
      setTempAdvancedFilters(currentFilters?.advancedFilters || {})
    }
  }, [open, currentFilters])

  // Calculate if there are active temp filters to show Clear All button
  const hasTempActiveFilters =
    tempActiveView !== 'all' ||
    tempFileTypeFilter.length > 0 ||
    tempAdvancedFilters.sizeRange?.min ||
    tempAdvancedFilters.sizeRange?.max ||
    tempAdvancedFilters.createdDateRange?.from ||
    tempAdvancedFilters.createdDateRange?.to ||
    tempAdvancedFilters.modifiedDateRange?.from ||
    tempAdvancedFilters.modifiedDateRange?.to ||
    tempAdvancedFilters.owner?.trim()

  // Basic Menu Items
  const basicMenuItems = [
    {
      id: 'all',
      label: 'All Files',
      icon: Home,
      description: 'Show all files and folders',
    },
    {
      id: 'my-drive',
      label: 'My Drive',
      icon: HardDrive,
      description: 'Files you own',
    },
    {
      id: 'shared',
      label: 'Shared with me',
      icon: Share,
      description: 'Files shared by others',
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      description: 'Files you starred',
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: Clock,
      description: 'Recently viewed files',
    },
    { id: 'trash', label: 'Trash', icon: Trash, description: 'Deleted items' },
  ]

  // File Type Filters
  const fileTypeFilters = [
    { id: 'folder', label: 'Folders', icon: Folder, color: 'text-blue-600' },
    {
      id: 'document',
      label: 'Documents',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      id: 'spreadsheet',
      label: 'Spreadsheets',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      id: 'presentation',
      label: 'Presentations',
      icon: FileText,
      color: 'text-orange-600',
    },
    { id: 'image', label: 'Images', icon: Image, color: 'text-purple-600' },
    { id: 'video', label: 'Videos', icon: Video, color: 'text-red-600' },
    { id: 'audio', label: 'Audio', icon: Music, color: 'text-blue-600' },
    {
      id: 'archive',
      label: 'Archives',
      icon: Archive,
      color: 'text-amber-600',
    },
    { id: 'code', label: 'Code Files', icon: Code, color: 'text-slate-600' },
    { id: 'shortcut', label: 'Shortcuts', icon: Link, color: 'text-blue-700' },
    { id: 'pdf', label: 'PDF Files', icon: FileText, color: 'text-rose-600' },
    {
      id: 'text',
      label: 'Text Files',
      icon: FileText,
      color: 'text-slate-600',
    },
    {
      id: 'design',
      label: 'Design Files',
      icon: Image,
      color: 'text-pink-600',
    },
    {
      id: 'database',
      label: 'Database Files',
      icon: FileText,
      color: 'text-indigo-600',
    },
    { id: 'ebook', label: 'E-books', icon: FileText, color: 'text-teal-600' },
    { id: 'font', label: 'Font Files', icon: FileText, color: 'text-gray-600' },
    {
      id: 'calendar',
      label: 'Calendar Files',
      icon: Calendar,
      color: 'text-emerald-600',
    },
    {
      id: 'contact',
      label: 'Contact Files',
      icon: User,
      color: 'text-cyan-600',
    },
  ]

  const handleBasicFilter = (viewId: string) => {
    setTempActiveView(viewId)
    // Don't apply immediately - wait for Apply Filter button
  }

  const handleFileTypeFilter = (typeId: string) => {
    // Always handle as array for consistency
    const currentFilter = tempFileTypeFilter || []
    const isArray = Array.isArray(currentFilter)

    const currentArray = isArray
      ? currentFilter
      : currentFilter
        ? [currentFilter]
        : []

    // Toggle behavior - add if not present, remove if present
    const newFilter = currentArray.includes(typeId)
      ? currentArray.filter((type: string) => type !== typeId)
      : [...currentArray, typeId]

    setTempFileTypeFilter(newFilter)
    // Don't apply immediately - wait for Apply Filter button
  }

  const handleAdvancedFiltersChange = (newFilters: AdvancedFilters) => {
    setTempAdvancedFilters(newFilters)
    // Don't apply immediately - wait for Apply Filter button
  }



  const handleClearAll = () => {
    setTempActiveView('all')
    setTempFileTypeFilter([])
    setTempAdvancedFilters({})
    // Apply the clear immediately to reset the data view
    onFilterChange({
      activeView: 'all',
      fileTypeFilter: [],
      advancedFilters: {},
    })
    onClearFilters()
    onOpenChange(false)
  }

  const renderContent = () => (
    <>
      <div className="space-y-6 pt-2">
        {/* View Status Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => setShowViewStatus(!showViewStatus)}
            className="h-auto w-full justify-between p-0"
          >
            <h3 className="text-sm font-semibold">View Status</h3>
            {showViewStatus ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showViewStatus && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {basicMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = tempActiveView === item.id

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'outline'}
                    className={`h-auto justify-start p-3 ${isActive ? 'ring-primary/20 ring-2' : ''}`}
                    onClick={() => handleBasicFilter(item.id)}
                  >
                    <div className="flex w-full items-center gap-2">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-medium">
                          {item.label}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
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
            className="h-auto w-full justify-between p-0"
          >
            <h3 className="text-sm font-semibold">File Types</h3>
            {showFileTypes ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showFileTypes && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {fileTypeFilters.map((filter) => {
                const Icon = filter.icon
                const currentFilter = tempFileTypeFilter || []
                const isArray = Array.isArray(currentFilter)
                const currentArray = isArray
                  ? currentFilter
                  : currentFilter
                    ? [currentFilter]
                    : []
                const isActive = currentArray.includes(filter.id)

                return (
                  <Button
                    key={filter.id}
                    variant={isActive ? 'default' : 'outline'}
                    className={`h-12 justify-start ${isActive ? 'ring-primary/20 ring-2' : ''}`}
                    onClick={() => {
                      handleFileTypeFilter(filter.id)
                      // Apply immediately like View Status
                      // onFilterChange({
                      //   activeView: tempActiveView,
                      //   fileTypeFilter: tempFileTypeFilter.includes(filter.id)
                      //     ? tempFileTypeFilter.filter(
                      //         (t: string) => t !== filter.id
                      //       )
                      //     : [...tempFileTypeFilter, filter.id],
                      //   advancedFilters: tempAdvancedFilters,
                      // })
                    }}
                  >
                    <Icon className={`mr-2 h-4 w-4 ${filter.color}`} />
                    <span className="text-sm">{filter.label}</span>
                  </Button>
                )
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
            className="h-auto w-full justify-between p-0"
          >
            <h3 className="text-sm font-semibold">Advanced Filters</h3>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showAdvanced && (
            <div className="space-y-4 pt-2">
              {/* Size Range Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">File Size Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      Min Size
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="0"
                        className="text-sm"
                        value={tempAdvancedFilters.sizeRange?.min || ''}
                        onChange={(e) =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            sizeRange: {
                              ...tempAdvancedFilters.sizeRange,
                              min: Number(e.target.value) || undefined,
                              unit: tempAdvancedFilters.sizeRange?.unit || 'MB',
                            },
                          })
                        }
                      />
                      <Select
                        value={tempAdvancedFilters.sizeRange?.unit || 'MB'}
                        onValueChange={(unit: 'B' | 'KB' | 'MB' | 'GB') =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            sizeRange: {
                              ...tempAdvancedFilters.sizeRange,
                              unit,
                            },
                          })
                        }
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
                    <Label className="text-muted-foreground text-xs">
                      Max Size
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="∞"
                        className="text-sm"
                        value={tempAdvancedFilters.sizeRange?.max || ''}
                        onChange={(e) =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            sizeRange: {
                              ...tempAdvancedFilters.sizeRange,
                              max: Number(e.target.value) || undefined,
                              unit: tempAdvancedFilters.sizeRange?.unit || 'MB',
                            },
                          })
                        }
                      />
                      <Select
                        value={tempAdvancedFilters.sizeRange?.unit || 'MB'}
                        onValueChange={(unit: 'B' | 'KB' | 'MB' | 'GB') =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            sizeRange: {
                              ...tempAdvancedFilters.sizeRange,
                              unit,
                            },
                          })
                        }
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
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <Calendar className="h-3 w-3" />
                    Created Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">
                        From
                      </Label>
                      <SimpleDatePicker
                        date={tempAdvancedFilters.createdDateRange?.from}
                        onDateChange={(date) =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            createdDateRange: {
                              ...tempAdvancedFilters.createdDateRange,
                              from: date || undefined,
                            },
                          })
                        }
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">
                        To
                      </Label>
                      <SimpleDatePicker
                        date={tempAdvancedFilters.createdDateRange?.to}
                        onDateChange={(date) =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            createdDateRange: {
                              ...tempAdvancedFilters.createdDateRange,
                              to: date || undefined,
                            },
                          })
                        }
                        placeholder="End date"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <Calendar className="h-3 w-3" />
                    Modified Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">
                        From
                      </Label>
                      <SimpleDatePicker
                        date={tempAdvancedFilters.modifiedDateRange?.from}
                        onDateChange={(date) =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            modifiedDateRange: {
                              ...tempAdvancedFilters.modifiedDateRange,
                              from: date || undefined,
                            },
                          })
                        }
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">
                        To
                      </Label>
                      <SimpleDatePicker
                        date={tempAdvancedFilters.modifiedDateRange?.to}
                        onDateChange={(date) =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            modifiedDateRange: {
                              ...tempAdvancedFilters.modifiedDateRange,
                              to: date || undefined,
                            },
                          })
                        }
                        placeholder="End date"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1 text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  Sort Options
                </Label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      Sort By
                    </Label>
                    <Select
                      value={tempAdvancedFilters.sortBy || 'modified'}
                      onValueChange={(
                        value: 'name' | 'modified' | 'created' | 'size'
                      ) =>
                        handleAdvancedFiltersChange({
                          ...tempAdvancedFilters,
                          sortBy: value,
                        })
                      }
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modified">Last Modified</SelectItem>
                        <SelectItem value="created">Date Created</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="size">File Size</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      Order
                    </Label>
                    <Select
                      value={tempAdvancedFilters.sortOrder || 'desc'}
                      onValueChange={(value: 'asc' | 'desc') =>
                        handleAdvancedFiltersChange({
                          ...tempAdvancedFilters,
                          sortOrder: value,
                        })
                      }
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest First</SelectItem>
                        <SelectItem value="asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Owner Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs font-medium">
                  <User className="h-3 w-3" />
                  Owner
                </Label>
                <Input
                  type="email"
                  placeholder="Search by owner email"
                  className={`${cn('min-h-[44px]')} text-sm`}
                  value={tempAdvancedFilters.owner || ''}
                  onChange={(e) =>
                    handleAdvancedFiltersChange({
                      ...tempAdvancedFilters,
                      owner: e.target.value || undefined,
                    })
                  }
                />
              </div>


            </div>
          )}
        </div>


      </div>
    </>
  )

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
                    <div className="text-lg font-semibold">
                      Filters
                    </div>
                    <div className="text-muted-foreground text-sm font-normal">
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="mr-1 text-xs">
                          Active
                        </Badge>
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

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {renderContent()}
          </div>

          <BottomSheetFooter className={cn('grid gap-4')}>
            <Button
              variant="outline"
              disabled={isApplying}
              onClick={() => {
                console.log('📱 MOBILE FILTER APPLY - Complete Parameters:', {
                  activeView: tempActiveView,
                  fileTypeFilter: tempFileTypeFilter,
                  advancedFilters: tempAdvancedFilters,
                  timestamp: new Date().toISOString()
                })
                onFilterChange({
                  activeView: tempActiveView,
                  fileTypeFilter: tempFileTypeFilter,
                  advancedFilters: tempAdvancedFilters,
                })
                // Trigger the actual API call
                if (onApplyFilters) {
                  setTimeout(() => {
                    onApplyFilters()
                  }, 100)
                }
                onOpenChange(false)
              }}
              className={cn('touch-target min-h-[44px] active:scale-95')}
            >
              {isApplying ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Applying...
                </>
              ) : (
                'Apply Filter'
              )}
            </Button>
            {hasTempActiveFilters && (
              <Button
                variant="ghost"
                disabled={isApplying}
                onClick={() => {
                  onClearFilters()
                  onOpenChange(false)
                }}
                className={cn('touch-target min-h-[44px] active:scale-95')}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Filters</div>
              <div className="text-muted-foreground text-sm font-normal">
                {hasTempActiveFilters && (
                  <Badge variant="secondary" className="mr-1 text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-2">
            {renderContent()}
          </DialogDescription>
        </DialogHeader>
        

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            disabled={isApplying}
            onClick={() => {
              
              onFilterChange({
                activeView: tempActiveView,
                fileTypeFilter: tempFileTypeFilter,
                advancedFilters: tempAdvancedFilters,
              })
              // Trigger the actual API call
              if (onApplyFilters) {
                setTimeout(() => {
                  onApplyFilters()
                }, 100)
              }
              onOpenChange(false)
            }}
          >
            {isApplying ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Applying...
              </>
            ) : (
              'Apply Filter'
            )}
          </Button>
          <Button
            variant="ghost"
            disabled={isApplying}
            onClick={() => {
              onClearFilters()
              onOpenChange(false)
            }}
          >
            {isApplying ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Clearing...
              </>
            ) : (
              'Clear All'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
