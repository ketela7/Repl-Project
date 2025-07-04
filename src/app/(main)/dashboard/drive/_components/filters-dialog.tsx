'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  HardDrive,
  Home,
  RefreshCw,
  Share,
  Star,
  Trash,
  User,
  X,
} from 'lucide-react'

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
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { getFileTypeCategories } from '@/lib/mime-type-filter'

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
  pageSize?: number
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
  const [tempActiveView, setTempActiveView] = useState(currentFilters?.activeView || 'all')
  const [tempFileTypeFilter, setTempFileTypeFilter] = useState(currentFilters?.fileTypeFilter || [])
  const [tempAdvancedFilters, setTempAdvancedFilters] = useState<AdvancedFilters>(
    currentFilters?.advancedFilters || {},
  )

  const [showViewStatus, setShowViewStatus] = useState(false)
  const [showFileTypes, setShowFileTypes] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const isMobile = useIsMobile()

  // Update temp states when current filters change
  useEffect(() => {
    if (open) {
      setTempActiveView(currentFilters?.activeView || 'all')
      setTempFileTypeFilter(
        Array.isArray(currentFilters?.fileTypeFilter) ? currentFilters.fileTypeFilter : [],
      )
      setTempAdvancedFilters({
        sizeRange: {
          unit: 'MB',
          ...currentFilters?.advancedFilters?.sizeRange,
        },
        createdDateRange: currentFilters?.advancedFilters?.createdDateRange || {},
        modifiedDateRange: currentFilters?.advancedFilters?.modifiedDateRange || {},
        owner: currentFilters?.advancedFilters?.owner,
        sortBy: currentFilters?.advancedFilters?.sortBy || 'modified',
        sortOrder: currentFilters?.advancedFilters?.sortOrder || 'desc',
        pageSize: currentFilters?.advancedFilters?.pageSize || 50,
      })
    }
  }, [open, currentFilters])

  // Check if size filters are applied (Google Drive API limitation: size filters only work for files)
  const hasSizeFilter = Boolean(
    (tempAdvancedFilters.sizeRange?.min && tempAdvancedFilters.sizeRange.min > 0) ||
      (tempAdvancedFilters.sizeRange?.max && tempAdvancedFilters.sizeRange.max > 0),
  )

  // Calculate if there are active temp filters to show Clear All button
  const hasTempActiveFilters =
    tempActiveView !== 'all' ||
    (Array.isArray(tempFileTypeFilter) && tempFileTypeFilter.length > 0) ||
    hasSizeFilter ||
    tempAdvancedFilters.createdDateRange?.from ||
    tempAdvancedFilters.createdDateRange?.to ||
    tempAdvancedFilters.modifiedDateRange?.from ||
    tempAdvancedFilters.modifiedDateRange?.to ||
    (tempAdvancedFilters.owner && (tempAdvancedFilters.owner as string).trim().length > 0) ||
    (tempAdvancedFilters.pageSize && tempAdvancedFilters.pageSize !== 50)

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
      description: 'Last seen in 30 days',
    },
    { id: 'trash', label: 'Trash', icon: Trash, description: 'Deleted items' },
  ]

  // File Type Filters - using shared utility for consistency
  const fileTypeFilter = getFileTypeCategories()

  const handleBasicFilter = (viewId: string) => {
    setTempActiveView(viewId)
    // Only update local state - no automatic backend call
  }

  const handleFileTypeFilter = (typeId: string) => {
    // Ensure we always work with an array
    const currentArray = Array.isArray(tempFileTypeFilter) ? tempFileTypeFilter : []

    // Toggle behavior - add if not present, remove if present
    let newFilter = currentArray.includes(typeId)
      ? currentArray.filter((type: string) => type !== typeId)
      : [...currentArray, typeId]

    // Remove folder from selection if size filters are active (Google Drive API limitation)
    if (hasSizeFilter && newFilter.includes('folder')) {
      newFilter = newFilter.filter((type: string) => type !== 'folder')
    }

    setTempFileTypeFilter(newFilter)
    // Only update local state - no automatic backend call
  }

  const handleAdvancedFiltersChange = (newFilters: AdvancedFilters) => {
    setTempAdvancedFilters(newFilters)

    // Check if size filters are being applied
    const newHasSizeFilter =
      (newFilters.sizeRange?.min && newFilters.sizeRange.min > 0) ||
      (newFilters.sizeRange?.max && newFilters.sizeRange.max > 0)

    // Remove folder from file type filter if size filters are applied (Google Drive API limitation)
    let updatedFileTypeFilter = tempFileTypeFilter
    if (
      newHasSizeFilter &&
      Array.isArray(tempFileTypeFilter) &&
      tempFileTypeFilter.includes('folder')
    ) {
      updatedFileTypeFilter = tempFileTypeFilter.filter((type: string) => type !== 'folder')
      setTempFileTypeFilter(updatedFileTypeFilter)
    }

    // Only update local state - no automatic backend call
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
              {basicMenuItems.map(item => {
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
                        <div className="truncate text-sm font-medium">{item.label}</div>
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
            <div className="space-y-2 pt-2">
              {hasSizeFilter && (
                <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">
                      Notice
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">
                        Size filtering: Hanya akan menghasilkan file bukan folder
                      </p>
                      <p className="mt-1 text-xs opacity-80">
                        Google Drive API limitation: Filter ukuran hanya bekerja untuk file, bukan
                        folder. Pemilihan folder dinonaktifkan ketika filter ukuran aktif.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {fileTypeFilter.map(filter => {
                  const Icon = filter.icon
                  const currentFilter = tempFileTypeFilter || []
                  const isArray = Array.isArray(currentFilter)
                  const currentArray = isArray
                    ? currentFilter
                    : currentFilter
                      ? [currentFilter]
                      : []
                  const isActive = currentArray.includes(filter.id)

                  // Disable folder selection when size filters are active
                  const isDisabled = hasSizeFilter && filter.id === 'folder'

                  return (
                    <Button
                      key={filter.id}
                      variant={isActive ? 'default' : 'outline'}
                      disabled={isDisabled}
                      className={`h-12 justify-start ${isActive ? 'ring-primary/20 ring-2' : ''} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                      onClick={() => {
                        if (!isDisabled) {
                          handleFileTypeFilter(filter.id)
                        }
                      }}
                    >
                      <Icon
                        className={`mr-2 h-4 w-4 ${filter.color} ${isDisabled ? 'opacity-50' : ''}`}
                      />
                      <span className={`text-sm ${isDisabled ? 'opacity-50' : ''}`}>
                        {filter.label}
                      </span>
                    </Button>
                  )
                })}
              </div>
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
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showAdvanced && (
            <div className="space-y-4 pt-2">
              {/* Size Range Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">File Size Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Min Size</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="0"
                        className="text-sm"
                        value={tempAdvancedFilters.sizeRange?.min || ''}
                        onChange={e =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            sizeRange: {
                              ...tempAdvancedFilters.sizeRange,
                              ...(Number(e.target.value) && { min: Number(e.target.value) }),
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
                    <Label className="text-muted-foreground text-xs">Max Size</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="∞"
                        className="text-sm"
                        value={tempAdvancedFilters.sizeRange?.max || ''}
                        onChange={e =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            sizeRange: {
                              ...tempAdvancedFilters.sizeRange,
                              ...(Number(e.target.value) && { max: Number(e.target.value) }),
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
                      <Label className="text-muted-foreground text-xs">From</Label>
                      <SimpleDatePicker
                        date={tempAdvancedFilters.createdDateRange?.from}
                        onDateChange={date =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            createdDateRange: {
                              ...tempAdvancedFilters.createdDateRange,
                              ...(date && { from: date }),
                            },
                          })
                        }
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">To</Label>
                      <SimpleDatePicker
                        date={tempAdvancedFilters.createdDateRange?.to}
                        onDateChange={date =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            createdDateRange: {
                              ...tempAdvancedFilters.createdDateRange,
                              ...(date && { to: date }),
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
                      <Label className="text-muted-foreground text-xs">From</Label>
                      <SimpleDatePicker
                        date={tempAdvancedFilters.modifiedDateRange?.from}
                        onDateChange={date =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            modifiedDateRange: {
                              ...tempAdvancedFilters.modifiedDateRange,
                              ...(date && { from: date }),
                            },
                          })
                        }
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">To</Label>
                      <SimpleDatePicker
                        date={tempAdvancedFilters.modifiedDateRange?.to}
                        onDateChange={date =>
                          handleAdvancedFiltersChange({
                            ...tempAdvancedFilters,
                            modifiedDateRange: {
                              ...tempAdvancedFilters.modifiedDateRange,
                              ...(date && { to: date }),
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
                    <Label className="text-muted-foreground text-xs">Sort By</Label>
                    <Select
                      value={tempAdvancedFilters.sortBy || 'modified'}
                      onValueChange={(value: 'name' | 'modified' | 'created' | 'size') =>
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
                    <Label className="text-muted-foreground text-xs">Order</Label>
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
                  onChange={e =>
                    handleAdvancedFiltersChange({
                      ...tempAdvancedFilters,
                      ...(e.target.value && { owner: e.target.value }),
                    })
                  }
                />
              </div>

              {/* Page Size Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs font-medium">
                  <HardDrive className="h-3 w-3" />
                  Results Per Page
                </Label>
                <Select
                  value={String(tempAdvancedFilters.pageSize || 50)}
                  onValueChange={value =>
                    handleAdvancedFiltersChange({
                      ...tempAdvancedFilters,
                      pageSize: Number(value),
                    })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 items (default)</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                    <SelectItem value="250">250 items</SelectItem>
                    <SelectItem value="500">500 items</SelectItem>
                    <SelectItem value="1000">1000 items (max)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-muted-foreground text-xs">
                  Higher values may increase loading time
                </div>
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
                    <div className="text-lg font-semibold">Filters</div>
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

          <div className="flex-1 overflow-y-auto px-4 pb-4">{renderContent()}</div>

          <BottomSheetFooter className={cn('grid gap-4')}>
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
          <DialogDescription className="space-y-4 pt-2">{renderContent()}</DialogDescription>
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

export default FiltersDialog
