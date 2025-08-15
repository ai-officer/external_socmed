export interface FilterValue {
  type: 'string' | 'number' | 'date' | 'array' | 'boolean'
  value: any
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains'
}

export interface Filter {
  id: string
  field: string
  label: string
  type: 'select' | 'multiselect' | 'range' | 'date-range' | 'text' | 'boolean'
  value: FilterValue
  active: boolean
}

export interface FilterGroup {
  id: string
  name: string
  filters: Filter[]
  operator: 'and' | 'or'
}

export interface FilterPreset {
  id: string
  name: string
  description: string
  filters: Filter[]
  icon?: string
  color?: string
}

export interface SavedFilter {
  id: string
  name: string
  description?: string
  filters: Filter[]
  userId: string
  isPublic: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  type?: 'all' | 'image' | 'video' | 'document'
  folderId?: string
  tags?: string[]
  minSize?: number
  maxSize?: number
  startDate?: Date | string
  endDate?: Date | string
  sortBy?: 'relevance' | 'name' | 'createdAt' | 'size'
  sortOrder?: 'asc' | 'desc'
  [key: string]: any
}