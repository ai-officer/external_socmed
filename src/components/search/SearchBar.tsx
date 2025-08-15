'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils/cn'
import { SearchFilters } from '@/types/search'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  onSearch?: (query: string, filters: any) => void
  className?: string
}

export function SearchBar({ 
  initialQuery = '', 
  placeholder = 'Search files...',
  onSearch,
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const debouncedQuery = useDebounce(query, 300)

  const handleSearch = useCallback((searchQuery?: string, searchFilters?: any) => {
    const finalQuery = searchQuery || query
    const finalFilters = searchFilters || filters
    
    if (!finalQuery.trim()) return

    if (onSearch) {
      onSearch(finalQuery, finalFilters)
    } else {
      // Navigate to search results page
      const params = new URLSearchParams()
      params.set('q', finalQuery)
      
      Object.entries(finalFilters).forEach(([key, value]) => {
        if (value && (Array.isArray(value) ? value.length > 0 : true)) {
          params.set(key, Array.isArray(value) ? value.join(',') : String(value))
        }
      })
      
      router.push(`/search?${params.toString()}`)
    }
  }, [query, filters, onSearch, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  const clearSearch = () => {
    setQuery('')
    setFilters({})
    inputRef.current?.focus()
  }

  const activeFilterCount = Object.values(filters).filter(value => 
    value && (Array.isArray(value) ? value.length > 0 : true)
  ).length

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSearch}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant={showFilters ? "default" : "ghost"}
              onClick={() => setShowFilters(!showFilters)}
              className="h-6 px-2"
            >
              <Filter className="h-3 w-3" />
              {activeFilterCount > 0 && (
                <span className="ml-1 h-4 w-4 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Basic Filters Panel */}
      {showFilters && (
        <div className="mt-2 p-4 border rounded-lg bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Type
              </label>
              <select
                value={filters.type || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as 'all' | 'image' | 'video' | 'document' }))}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="all">All Files</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy || 'relevance'}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'relevance' | 'name' | 'createdAt' | 'size' }))}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name</option>
                <option value="createdAt">Date Created</option>
                <option value="size">File Size</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFilters({})
                  setShowFilters(false)
                }}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => handleSearch()}
                className="flex-1"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}