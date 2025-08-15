import { useState, useEffect, useCallback } from 'react'
import { FilterState } from '@/types/filters'

export function useFilters(onFiltersChange?: (filters: FilterState) => void) {
  const [filters, setFilters] = useState<FilterState>({})

  const setFilter = useCallback((key: string, value: any) => {
    const newFilters = { ...filters }
    
    if (value === undefined || value === null || value === '' || value === 'all') {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }, [filters, onFiltersChange])

  const removeFilter = useCallback((key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }, [filters, onFiltersChange])

  const clearFilters = useCallback(() => {
    setFilters({})
    onFiltersChange?.({})
  }, [onFiltersChange])

  const applyPreset = useCallback((preset: any) => {
    const presetFilters: FilterState = {}
    preset.filters.forEach((filter: any) => {
      presetFilters[filter.field] = filter.value.value
    })
    
    setFilters(presetFilters)
    onFiltersChange?.(presetFilters)
  }, [onFiltersChange])

  const activeFilterCount = Object.keys(filters).length

  const getFilterSummary = useCallback(() => {
    const summary: string[] = []
    
    if (filters.type && filters.type !== 'all') {
      summary.push(`Type: ${filters.type}`)
    }
    
    if (filters.tags && filters.tags.length > 0) {
      summary.push(`Tags: ${filters.tags.join(', ')}`)
    }
    
    if (filters.startDate || filters.endDate) {
      if (filters.startDate && filters.endDate) {
        const start = typeof filters.startDate === 'string' ? new Date(filters.startDate) : filters.startDate
        const end = typeof filters.endDate === 'string' ? new Date(filters.endDate) : filters.endDate
        summary.push(`Date: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`)
      } else if (filters.startDate) {
        const start = typeof filters.startDate === 'string' ? new Date(filters.startDate) : filters.startDate
        summary.push(`From: ${start.toLocaleDateString()}`)
      } else if (filters.endDate) {
        const end = typeof filters.endDate === 'string' ? new Date(filters.endDate) : filters.endDate
        summary.push(`Until: ${end.toLocaleDateString()}`)
      }
    }
    
    if (filters.minSize || filters.maxSize) {
      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes}B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
      }
      
      if (filters.minSize && filters.maxSize) {
        summary.push(`Size: ${formatSize(filters.minSize)} - ${formatSize(filters.maxSize)}`)
      } else if (filters.minSize) {
        summary.push(`Size: >${formatSize(filters.minSize)}`)
      } else if (filters.maxSize) {
        summary.push(`Size: <${formatSize(filters.maxSize)}`)
      }
    }
    
    return summary
  }, [filters])

  return {
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    applyPreset,
    activeFilterCount,
    getFilterSummary
  }
}