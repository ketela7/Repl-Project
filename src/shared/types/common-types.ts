/**
 * Common Types - Shared type definitions
 */

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface FilterOptions {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export type ViewMode = 'grid' | 'table'
export type FileType = 'file' | 'folder'
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error'
