/**
 * UI Types - User interface related type definitions
 */

export interface ButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
}

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export interface TableColumn<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface DropdownMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  dangerous?: boolean
  action: () => void
}

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl'
export type ComponentVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'destructive'
