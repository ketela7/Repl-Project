/**
 * Lazy imports for heavy components to reduce initial bundle size
 */
import { lazy } from "react";

// Lazy load heavy dashboard components
export const DriveManager = lazy(() => 
  import("@/app/(main)/dashboard/drive/_components/drive-manager").then(mod => ({ default: mod.DriveManager }))
);

export const DataTable = lazy(() => 
  import("@/components/data-table/data-table").then(mod => ({ default: mod.DataTable }))
);

// Lazy load dialog components
export const FileRenameDialog = lazy(() => 
  import("@/app/(main)/dashboard/drive/_components/file-rename-dialog").then(mod => ({ default: mod.FileRenameDialog }))
);

export const FileDeleteDialog = lazy(() => 
  import("@/app/(main)/dashboard/drive/_components/file-delete-dialog").then(mod => ({ default: mod.FileDeleteDialog }))
);

// Bulk operations dialogs - now in optimized lazy module
export const BulkOperationsDialog = lazy(() => 
 import("@/app/(main)/dashboard/drive/_components/bulk-operations-dialog").then(mod => ({ default: mod.BulkOperationsDialog }))
);

export const BulkMoveDialog = lazy(() => 
 import("@/app/(main)/dashboard/drive/_components/optimized-lazy-dialogs").then(mod => ({ default: mod.BulkMoveDialog }))
);

export const BulkCopyDialog = lazy(() => 
 import("@/app/(main)/dashboard/drive/_components/optimized-lazy-dialogs").then(mod => ({ default: mod.BulkCopyDialog }))
);

export const BulkDeleteDialog = lazy(() => 
 import("@/app/(main)/dashboard/drive/_components/optimized-lazy-dialogs").then(mod => ({ default: mod.BulkDeleteDialog }))
);


export const DriveToolbar = lazy(() => 
 import("@/app/(main)/dashboard/drive/_components/drive-toolbar").then(mod => ({ default: mod.DriveToolbar }))
);

// Lazy load chart components (heavy recharts dependency)
export const ChartComponents = lazy(() => 
  import("recharts").then(mod => ({ 
    default: () => null as any // Placeholder for chart components
  }))
);