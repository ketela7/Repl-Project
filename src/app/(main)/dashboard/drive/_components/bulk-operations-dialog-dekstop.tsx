
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Download,
  Edit,
  FileText,
  Move,
  Copy,
  Share2,
  Trash2,
} from 'lucide-react'

interface BulkOperationsDialogDekstopProps {
  selectedCount: number
  itemsLength: number
  onBulkDownload: () => void
  onBulkRename: () => void
  onBulkExport: () => void
  onBulkMove: () => void
  onBulkCopy: () => void
  onBulkShare: () => void
  onBulkDelete: () => void
}

export function BulkOperationsDialogDekstop({
  selectedCount,
  itemsLength,
  onBulkDownload,
  onBulkRename,
  onBulkExport,
  onBulkMove,
  onBulkCopy,
  onBulkShare,
  onBulkDelete,
}: BulkOperationsDialogDekstopProps) {
  const bulkOperations = [
    {
      icon: Download,
      label: 'Download Selected',
      action: onBulkDownload,
      variant: 'default' as const,
    },
    {
      icon: Edit,
      label: 'Rename Selected',
      action: onBulkRename,
      variant: 'default' as const,
    },
    {
      icon: FileText,
      label: 'Export Selected',
      action: onBulkExport,
      variant: 'default' as const,
    },
    {
      icon: Move,
      label: 'Move Selected',
      action: onBulkMove,
      variant: 'default' as const,
    },
    {
      icon: Copy,
      label: 'Copy Selected',
      action: onBulkCopy,
      variant: 'default' as const,
    },
    {
      icon: Share2,
      label: 'Share Selected',
      action: onBulkShare,
      variant: 'default' as const,
    },
  ]

  return (
    <>
      <DropdownMenuSeparator />
      <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold tracking-wider uppercase">
        File Operations ({selectedCount} selected)
      </div>

      {bulkOperations.map((operation) => (
        <DropdownMenuItem key={operation.label} onClick={operation.action}>
          <operation.icon className="mr-2 h-4 w-4" />
          {operation.label}
        </DropdownMenuItem>
      ))}

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={onBulkDelete}
        className="text-orange-600 dark:text-orange-400"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Move to Trash
      </DropdownMenuItem>
    </>
  )
}
