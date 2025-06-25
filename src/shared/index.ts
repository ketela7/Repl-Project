/**
 * Shared Module - Common components, hooks, and utilities
 * Used across multiple features in the application
 */

// UI Components
export { Button } from './components/ui/button'
export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from './components/ui/card'
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog'
export { Input } from './components/ui/input'
export { Label } from './components/ui/label'
export { Badge } from './components/ui/badge'
export { Progress } from './components/ui/progress'
export { Skeleton } from './components/ui/skeleton'
export { Separator } from './components/ui/separator'
export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './components/ui/sheet'
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
export { Checkbox } from './components/ui/checkbox'
export { Switch } from './components/ui/switch'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/ui/tooltip'

// Common Components
export { FileIcon } from './components/file-icon'
export { FileCategoryBadges } from './components/file-category-badges'
export { ErrorBoundary } from './components/error-boundary'
export {
  TimezoneProvider,
  useTimezoneContext,
} from './components/timezone-provider'
export { DriveErrorDisplay } from './components/drive-error-display'
export { DrivePermissionRequired } from './components/drive-permission-required'

// Data Table Components
export { DataTable } from './components/data-table/data-table'
export { dragColumn as DragColumn } from './components/data-table/drag-column'
export { DraggableRow } from './components/data-table/draggable-row'

// Lazy Imports
export * from './components/lazy-imports'

// Loading Optimization
export { LoadingOptimization } from './components/loading-optimization'

// Common Hooks
export { useIsMobile } from './hooks/use-mobile'
export { useDebouncedValue } from './hooks/use-debounced-value'
export { useIntersectionObserver } from './hooks/use-intersection-observer'
export { useTimezone } from './hooks/use-timezone'

// Utilities
export { cn } from './utils/cn'
export * from './utils/formatting'
export * from './utils/validation'
export * from './utils/file-utils'
export * from './utils/date-utils'
export * from './utils/string-utils'

// Constants
export * from './constants/ui-constants'
export * from './constants/app-constants'

// Types
export type * from './types/common-types'
export type * from './types/ui-types'
