'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { useTags } from '@/hooks/useTags'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils/cn'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagInputProps {
  tags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  disabled?: boolean
}

export function TagInput({
  tags = [],
  onTagsChange,
  placeholder = 'Add tags...',
  maxTags = 10,
  className,
  disabled = false
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const debouncedInput = useDebounce(inputValue, 300)
  const { tags: availableTags, createTag } = useTags()

  // Filter suggestions based on input
  const suggestions = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(debouncedInput.toLowerCase()) &&
    !tags.some(selectedTag => selectedTag.id === tag.id)
  ).slice(0, 5)

  const addTag = async (tagName: string) => {
    if (disabled || tags.length >= maxTags) return
    
    const trimmedName = tagName.trim().toLowerCase()
    if (!trimmedName) return
    
    // Check if tag already exists in current selection
    if (tags.some(tag => tag.name === trimmedName)) {
      setInputValue('')
      return
    }

    try {
      // Check if tag exists in database
      let existingTag = availableTags.find(tag => tag.name === trimmedName)
      
      if (!existingTag) {
        const result = await createTag({ name: trimmedName })
        existingTag = result.tag
      }

      if (existingTag) {
        onTagsChange([...tags, existingTag])
      }
      setInputValue('')
      setShowSuggestions(false)
    } catch (error) {
      console.error('Error adding tag:', error)
    }
  }

  const removeTag = (tagToRemove: Tag) => {
    if (disabled) return
    onTagsChange(tags.filter(tag => tag.id !== tagToRemove.id))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const canAddMoreTags = tags.length < maxTags

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              {!disabled && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeTag(tag)}
                  className="h-3 w-3 p-0 hover:bg-white/20 text-white"
                >
                  <X className="h-2 w-2" />
                </Button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      {canAddMoreTags && !disabled && (
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="text-sm"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || inputValue) && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => {
                    onTagsChange([...tags, suggestion])
                    setInputValue('')
                    setShowSuggestions(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: suggestion.color }}
                  />
                  {suggestion.name}
                  <span className="text-xs text-gray-500 ml-auto">
                    {suggestion.fileCount || 0} files
                  </span>
                </button>
              ))}
              
              {/* Create new tag option */}
              {inputValue && 
               !suggestions.some(s => s.name === inputValue.toLowerCase()) && (
                <button
                  onClick={() => addTag(inputValue)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 border-t"
                >
                  <Plus className="w-3 h-3" />
                  Create &quot;{inputValue.toLowerCase()}&quot;
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tag Limit Info */}
      {tags.length >= maxTags && (
        <p className="text-xs text-gray-500">
          Maximum of {maxTags} tags reached
        </p>
      )}
    </div>
  )
}