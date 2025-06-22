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

export const FileBulkOperationsDialog = lazy(() => 
  import("@/app/(main)/dashboard/drive/_components/file-bulk-operations-dialog").then(mod => ({ default: mod.FileBulkOperationsDialog }))
);

// Lazy load chart components (heavy recharts dependency)
export const ChartComponents = lazy(() => 
  import("recharts").then(mod => ({ 
    default: {
      BarChart: mod.BarChart,
      PieChart: mod.PieChart,
      LineChart: mod.LineChart,
      ResponsiveContainer: mod.ResponsiveContainer
    }
  }))
);