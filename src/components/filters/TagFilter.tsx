'use client'

import { useState } from 'react'
import { useTags } from '@/hooks/useTags'
import { TagBadge } from '@/components/tags/TagBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface TagFilterProps {
  selectedTags: string[]
  onChange: (tagNames: string[]) => void
}

export function TagFilter({ selectedTags = [], onChange }: TagFilterProps) {
  const { tags, loading } = useTags()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.includes(tag.name)
  )

  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.name))

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter(name => name !== tagName))
    } else {
      onChange([...selectedTags, tagName])
    }
  }

  const clearAllTags = () => {
    onChange([])
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading tags...</div>
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <Input
        placeholder="Search tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="text-sm h-8"
      />

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Selected ({selectedTags.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllTags}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedTagObjects.map((tag) => (
              <TagBadge
                key={tag.id}
                name={tag.name}
                color={tag.color}
                size="sm"
                removable
                onRemove={() => handleTagToggle(tag.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available tags */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-gray-700">Available Tags</span>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filteredTags.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">
              {searchTerm ? 'No tags found' : 'No more tags available'}
            </div>
          ) : (
            filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleTagToggle(tag.name)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {tag.fileCount} files
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}