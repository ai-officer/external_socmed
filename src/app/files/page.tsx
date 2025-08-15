'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FileGrid } from '@/components/files/FileGrid'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { useFiles } from '@/hooks/useFiles'
import { FileQuery } from '@/types/file'
import { FilterState } from '@/types/filters'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Grid3X3, List, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function FilesPage() {
  const { data: session, status } = useSession()
  const [filters, setFilters] = useState<FilterState>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Convert FilterState to FileQuery
  const fileQuery: FileQuery = {
    type: filters.type,
    tags: filters.tags,
    minSize: filters.minSize,
    maxSize: filters.maxSize,
    startDate: filters.startDate instanceof Date ? filters.startDate.toISOString() : filters.startDate,
    endDate: filters.endDate instanceof Date ? filters.endDate.toISOString() : filters.endDate,
    search: searchQuery,
  }

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  // Create a key to force FileGrid re-render when filters change
  const gridKey = JSON.stringify(fileQuery)

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
          <h1 className="text-2xl font-bold mb-4">Please sign in to view files</h1>
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
        <Header title="Files" subtitle="Pages / Files" />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Filter Panel */}
            <FilterPanel
              onFiltersChange={handleFiltersChange}
              className="w-full mb-6"
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80 border-gray-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border border-gray-200 rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none border-l"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Files Grid */}
            <FileGrid
              key={gridKey}
              {...fileQuery}
              viewMode={viewMode}
              onFileUpdate={() => {
                // Files will auto-refresh
              }}
              onFileDelete={() => {
                // Files will auto-refresh
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}