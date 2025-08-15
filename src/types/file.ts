export interface File {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  cloudinaryId: string
  cloudinaryUrl: string
  description?: string
  folderId?: string
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  
  // Relations
  folder?: {
    id: string
    name: string
  }
  user?: {
    id: string
    name: string | null
    email: string
  }
  tags: {
    id: string
    name: string
    color: string
  }[]
  
  // Computed properties
  isImage: boolean
  isVideo: boolean
  isDocument: boolean
  thumbnailUrl?: string
}

export interface FileQuery {
  folderId?: string
  page?: number
  limit?: number
  sort?: 'name' | 'createdAt' | 'updatedAt' | 'size'
  order?: 'asc' | 'desc'
  search?: string
  type?: 'image' | 'video' | 'document' | 'all'
  tags?: string[]
  minSize?: number
  maxSize?: number
  startDate?: string
  endDate?: string
}

export interface FilePagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface FileResponse {
  files: File[]
  pagination: FilePagination
}

export type FileViewMode = 'grid' | 'list'

export type FileSortField = 'name' | 'createdAt' | 'updatedAt' | 'size'
export type FileSortOrder = 'asc' | 'desc'
export type FileFilterType = 'image' | 'video' | 'document' | 'all'