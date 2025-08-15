'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TagBadge } from '@/components/tags/TagBadge'
import { 
  Tags, 
  Plus, 
  Minus, 
  FileText, 
  Search,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { useTags } from '@/hooks/useTags'
import { useFiles } from '@/hooks/useFiles'

interface BulkTagManagerProps {
  open: boolean
  onClose: () => void
  selectedFiles: any[]
  onSuccess?: () => void
}

export function BulkTagManager({
  open,
  onClose,
  selectedFiles,
  onSuccess
}: BulkTagManagerProps) {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([])
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([])
  
  const { tags } = useTags()

  // Get all tags currently assigned to selected files
  const currentTags = new Set<string>()
  selectedFiles.forEach(file => {
    file.tags?.forEach((tag: any) => {
      currentTags.add(tag.id)
    })
  })

  // Filter available tags
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddTag = (tagId: string) => {
    if (!tagsToAdd.includes(tagId)) {
      setTagsToAdd([...tagsToAdd, tagId])
    }
    setTagsToRemove(tagsToRemove.filter(id => id !== tagId))
  }

  const handleRemoveTag = (tagId: string) => {
    if (!tagsToRemove.includes(tagId)) {
      setTagsToRemove([...tagsToRemove, tagId])
    }
    setTagsToAdd(tagsToAdd.filter(id => id !== tagId))
  }

  const handleApplyChanges = async () => {
    setLoading(true)
    try {
      // Apply tag changes to each selected file
      for (const file of selectedFiles) {
        const currentFileTags = file.tags?.map((t: any) => t.id) || []
        let newTagIds = [...currentFileTags]

        // Add new tags
        tagsToAdd.forEach(tagId => {
          if (!newTagIds.includes(tagId)) {
            newTagIds.push(tagId)
          }
        })

        // Remove tags
        newTagIds = newTagIds.filter(tagId => !tagsToRemove.includes(tagId))

        // Update file tags
        const response = await fetch(`/api/files/${file.id}/tags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tagIds: newTagIds })
        })

        if (!response.ok) {
          throw new Error(`Failed to update tags for ${file.originalName}`)
        }
      }

      onSuccess?.()
      onClose()
      setTagsToAdd([])
      setTagsToRemove([])
    } catch (error) {
      console.error('Failed to apply tag changes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTagStatus = (tagId: string) => {
    const isCurrentlyAssigned = currentTags.has(tagId)
    const willBeAdded = tagsToAdd.includes(tagId)
    const willBeRemoved = tagsToRemove.includes(tagId)

    if (willBeAdded) return 'adding'
    if (willBeRemoved) return 'removing'
    if (isCurrentlyAssigned) return 'assigned'
    return 'available'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'adding': return 'bg-green-100 border-green-500'
      case 'removing': return 'bg-red-100 border-red-500'
      case 'assigned': return 'bg-blue-100 border-blue-500'
      default: return 'hover:bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'adding': return <Plus className="h-3 w-3 text-green-600" />
      case 'removing': return <Minus className="h-3 w-3 text-red-600" />
      case 'assigned': return <CheckCircle className="h-3 w-3 text-blue-600" />
      default: return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Bulk Tag Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Selected Files Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Selected Files ({selectedFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.slice(0, 10).map(file => (
                  <Badge key={file.id} variant="outline" className="text-xs">
                    {file.originalName}
                  </Badge>
                ))}
                {selectedFiles.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedFiles.length - 10} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Changes */}
          {(tagsToAdd.length > 0 || tagsToRemove.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tagsToAdd.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-2">Tags to add:</p>
                    <div className="flex flex-wrap gap-2">
                      {tagsToAdd.map(tagId => {
                        const tag = tags.find(t => t.id === tagId)
                        return tag ? (
                          <TagBadge
                            key={tagId}
                            name={tag.name}
                            color={tag.color}
                            size="sm"
                            removable
                            onRemove={() => setTagsToAdd(tagsToAdd.filter(id => id !== tagId))}
                          />
                        ) : null
                      })}
                    </div>
                  </div>
                )}
                
                {tagsToRemove.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">Tags to remove:</p>
                    <div className="flex flex-wrap gap-2">
                      {tagsToRemove.map(tagId => {
                        const tag = tags.find(t => t.id === tagId)
                        return tag ? (
                          <TagBadge
                            key={tagId}
                            name={tag.name}
                            color={tag.color}
                            size="sm"
                            removable
                            onRemove={() => setTagsToRemove(tagsToRemove.filter(id => id !== tagId))}
                          />
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search Tags */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Available Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredTags.map(tag => {
                  const status = getTagStatus(tag.id)
                  const filesWithTag = selectedFiles.filter(file => 
                    file.tags?.some((t: any) => t.id === tag.id)
                  ).length

                  return (
                    <div
                      key={tag.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${getStatusColor(status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TagBadge name={tag.name} color={tag.color} size="sm" />
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddTag(tag.id)}
                            disabled={status === 'adding'}
                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                            title="Add tag"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveTag(tag.id)}
                            disabled={status === 'removing' || status === 'available'}
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                            title="Remove tag"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>
                          {filesWithTag} of {selectedFiles.length} files
                        </span>
                        <span className="capitalize">{status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyChanges}
            disabled={loading || (tagsToAdd.length === 0 && tagsToRemove.length === 0)}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              `Apply Changes (${tagsToAdd.length + tagsToRemove.length})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}