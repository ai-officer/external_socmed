'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchResults } from '@/components/search/SearchResults'
import { AdvancedSearchDialog } from '@/components/search/AdvancedSearchDialog'
import { useSearch } from '@/hooks/useSearch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sliders, History, X, Bookmark } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function SearchPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const { search, loading, error, results, pagination, query, clearResults } = useSearch()
  
  const [currentQuery, setCurrentQuery] = useState('')
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({})
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<any[]>([])

  // Load search from URL params on mount or show all files
  useEffect(() => {
    const urlQuery = searchParams.get('q')
    const filters = {
      type: (searchParams.get('type') as 'all' | 'image' | 'video' | 'document') || undefined,
      folderId: searchParams.get('folderId') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      sortBy: (searchParams.get('sortBy') as 'relevance' | 'name' | 'createdAt' | 'size') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    }
    
    if (urlQuery) {
      setCurrentQuery(urlQuery)
      setCurrentFilters(filters)
      search(urlQuery, filters)
    } else {
      // Show all files when no query is provided
      setCurrentQuery('')
      setCurrentFilters(filters)
      search('', filters)
    }
  }, [searchParams])

  // Load search history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('search-history')
    if (stored) {
      setSearchHistory(JSON.parse(stored))
    }
  }, [])

  const handleSearch = (query: string, filters: any = {}) => {
    setCurrentQuery(query)
    setCurrentFilters(filters)
    search(query, filters)
    
    // Add to search history (only for actual search queries)
    if (query.trim()) {
      const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10)
      setSearchHistory(newHistory)
      localStorage.setItem('search-history', JSON.stringify(newHistory))
    }
  }

  const handleAdvancedSearch = (filters: any) => {
    const query = filters.query || ''
    delete filters.query
    handleSearch(query, filters)
  }

  const clearActiveFilters = () => {
    setCurrentFilters({})
    if (currentQuery) {
      search(currentQuery, {})
    }
  }

  // Get active filter count
  const activeFilterCount = Object.keys(currentFilters).filter(key => {
    const value = currentFilters[key]
    return value && (Array.isArray(value) ? value.length > 0 : value !== 'all')
  }).length

  const handleLoadMore = () => {
    if (pagination?.hasNext) {
      search(currentQuery, currentFilters, pagination.page + 1)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to search</h1>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Go to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:ml-64">
        <Header title="Search Files" subtitle="Pages / Search" />
        
        <main className="p-8">
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex gap-4">
              <SearchBar
                initialQuery={currentQuery}
                onSearch={handleSearch}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(true)}
                className="gap-2"
              >
                <Sliders className="h-4 w-4" />
                Advanced
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="max-w-6xl mx-auto mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-700">Active filters:</span>
                      {Object.entries(currentFilters).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0) || value === 'all') return null
                        
                        let displayValue = value
                        if (Array.isArray(value)) {
                          displayValue = value.join(', ')
                        }
                        
                        return (
                          <Badge key={key} variant="secondary" className="gap-1">
                            {key}: {String(displayValue)}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded-full" 
                              onClick={() => {
                                const newFilters = { ...currentFilters }
                                delete newFilters[key]
                                setCurrentFilters(newFilters)
                                search(currentQuery, newFilters)
                              }}
                            />
                          </Badge>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearActiveFilters}
                      className="text-gray-600"
                    >
                      Clear all
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search History and Quick Actions */}
          {!currentQuery && searchHistory.length > 0 && (
            <div className="max-w-6xl mx-auto mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recent Searches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {searchHistory.slice(0, 5).map((query, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearch(query)}
                        className="text-sm"
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Advanced Search Dialog */}
          <AdvancedSearchDialog
            open={showAdvancedSearch}
            onClose={() => setShowAdvancedSearch(false)}
            onSearch={handleAdvancedSearch}
            initialValues={{
              query: currentQuery,
              ...currentFilters
            }}
          />

          {/* Search Results */}
          <div className="max-w-6xl mx-auto">
            <SearchResults
              results={results}
              loading={loading}
              error={error}
              query={query}
              pagination={pagination}
              onLoadMore={handleLoadMore}
              onFileUpdate={() => {
                // Refresh search results
                if (currentQuery) {
                  search(currentQuery, currentFilters, pagination?.page || 1)
                }
              }}
              onFileDelete={() => {
                // Refresh search results
                if (currentQuery) {
                  search(currentQuery, currentFilters, pagination?.page || 1)
                }
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}