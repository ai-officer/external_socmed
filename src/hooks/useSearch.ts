import { useState, useEffect } from 'react'
import { SearchFilters, SearchResult } from '@/types/search'

export function useSearch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)

  const search = async (query: string, filters: SearchFilters = {}, page = 1) => {
    // Allow empty query to show all files
    // if (!query.trim()) {
    //   setSearchResult(null)
    //   return
    // }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (query.trim()) {
        params.set('q', query)
      }
      params.set('page', page.toString())

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value) && value.length > 0) {
            params.set(key, value.join(','))
          } else if (!Array.isArray(value)) {
            params.set(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResult(null)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setSearchResult(null)
    setError(null)
  }

  return {
    search,
    clearResults,
    loading,
    error,
    searchResult,
    results: searchResult?.results || [],
    pagination: searchResult?.pagination,
    query: searchResult?.query || '',
    filters: searchResult?.filters || {}
  }
}