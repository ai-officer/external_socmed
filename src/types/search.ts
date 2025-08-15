export interface SearchFilters {
  type?: 'all' | 'image' | 'video' | 'document'
  folderId?: string
  tags?: string[]
  minSize?: number
  maxSize?: number
  startDate?: string
  endDate?: string
  sortBy?: 'relevance' | 'name' | 'createdAt' | 'size'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchQuery extends SearchFilters {
  q: string
  page?: number
  limit?: number
}

export interface SearchResultFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  cloudinaryId: string
  cloudinaryUrl: string
  description?: string
  createdAt: string
  updatedAt: string
  folderId?: string
  folder?: {
    id: string
    name: string
    parentId?: string
  }
  user?: {
    id: string
    name: string | null
    email: string
  }
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  relevanceScore: number
  isImage: boolean
  isVideo: boolean
  isDocument: boolean
  thumbnailUrl?: string
  highlightedName: string
  highlightedDescription?: string
}

export interface SearchPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface SearchResult {
  query: string
  results: SearchResultFile[]
  pagination: SearchPagination
  filters: SearchFilters
}

export interface SearchSuggestion {
  id: string
  text: string
  type: 'query' | 'tag' | 'file' | 'folder'
  metadata?: any
}

export interface SearchHistoryItem {
  id: string
  query: string
  filters?: SearchFilters
  resultsCount: number
  createdAt: string
}

export interface SavedSearch {
  id: string
  name: string
  description?: string
  query: string
  filters?: SearchFilters
  isPublic: boolean
  createdAt: string
  updatedAt: string
}