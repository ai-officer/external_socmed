'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw
} from 'lucide-react'
import { FileTypeFilter } from './FileTypeFilter'
import { TagFilter } from './TagFilter'
import { useFilters } from '@/hooks/useFilters'
import { cn } from '@/utils/cn'

interface FilterPanelProps {
  onFiltersChange: (filters: any) => void
  className?: string
  compact?: boolean
}

export function FilterPanel({ 
  onFiltersChange, 
  className,
  compact = false 
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['fileType'])
  )

  const {
    filters,
    setFilter,
    clearFilters,
    activeFilterCount
  } = useFilters(onFiltersChange)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const filterSections = [
    {
      id: 'fileType',
      title: 'File Type',
      component: (
        <FileTypeFilter 
          value={filters.type} 
          onChange={(value) => setFilter('type', value)} 
        />
      )
    },
    {
      id: 'tags',
      title: 'Tags',
      component: (
        <TagFilter
          selectedTags={filters.tags || []}
          onChange={(tags) => setFilter('tags', tags)}
        />
      )
    }
  ]

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFilterCount} active
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="h-6 px-2"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {filterSections.map((section) => {
          const isExpanded = expandedSections.has(section.id)
          const hasActiveFilter = section.id === 'fileType' 
            ? filters.type && filters.type !== 'all'
            : section.id === 'tags'
            ? filters.tags && filters.tags.length > 0
            : false

          return (
            <div key={section.id} className="border-b border-gray-100 last:border-b-0">
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto font-normal"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{section.title}</span>
                  {hasActiveFilter && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
              
              {isExpanded && (
                <div className="px-3 pb-3">
                  {section.component}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}