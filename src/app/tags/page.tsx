'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTags } from '@/hooks/useTags'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TagBadge } from '@/components/tags/TagBadge'
import { TagManagementDialog } from '@/components/tags/TagManagementDialog'
import { 
  Plus, 
  Tag as TagIcon, 
  Edit, 
  Trash2, 
  Search, 
  SortAsc, 
  SortDesc,
  Filter,
  Hash,
  FileText,
  Calendar
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { cn } from '@/utils/cn'

type SortOption = 'name' | 'fileCount'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

export default function TagsPage() {
  const { data: session, status } = useSession()
  const { tags, loading, createTag, updateTag, deleteTag } = useTags(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<any>(null)
  const [filterByUsage, setFilterByUsage] = useState<'all' | 'used' | 'unused'>('all')

  // Filter and sort tags
  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesUsage = filterByUsage === 'all' ||
                        (filterByUsage === 'used' && tag.fileCount > 0) ||
                        (filterByUsage === 'unused' && tag.fileCount === 0)
    
    return matchesSearch && matchesUsage
  }).sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'fileCount':
        comparison = a.fileCount - b.fileCount
        break
    }
    
    return sortOrder === 'desc' ? -comparison : comparison
  })

  const handleDeleteTag = async (tag: any) => {
    if (!confirm(`Are you sure you want to delete "${tag.name}"? This will remove the tag from all files.`)) {
      return
    }

    try {
      await deleteTag(tag.id)
    } catch (error) {
      console.error('Failed to delete tag:', error)
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
          <h1 className="text-2xl font-bold mb-4">Please sign in to manage tags</h1>
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
        <Header title="Tag Management" subtitle="Pages / Tags" />
        
        <main className="p-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Hash className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tags</p>
                    <p className="text-2xl font-bold">{tags.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Used Tags</p>
                    <p className="text-2xl font-bold">{tags.filter(t => t.fileCount > 0).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TagIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unused Tags</p>
                    <p className="text-2xl font-bold">{tags.filter(t => t.fileCount === 0).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Files Tagged</p>
                    <p className="text-2xl font-bold">{tags.reduce((sum, tag) => sum + tag.fileCount, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filter by usage */}
                  <select
                    value={filterByUsage}
                    onChange={(e) => setFilterByUsage(e.target.value as 'all' | 'used' | 'unused')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All tags</option>
                    <option value="used">Used tags</option>
                    <option value="unused">Unused tags</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field as SortOption)
                      setSortOrder(order as SortOrder)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="fileCount-desc">Most used</option>
                    <option value="fileCount-asc">Least used</option>
                  </select>
                </div>

                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Tag
                </Button>
              </div>

              {/* Active filters */}
              {(searchQuery || filterByUsage !== 'all') && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery('')}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterByUsage !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Usage: {filterByUsage}
                      <button onClick={() => setFilterByUsage('all')}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterByUsage('all')
                    }}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TagIcon className="h-5 w-5" />
                Tags ({filteredTags.length} of {tags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading tags...</div>
              ) : filteredTags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TagIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">
                    {tags.length === 0 ? 'No tags yet' : 'No tags match your criteria'}
                  </h3>
                  <p className="text-sm">
                    {tags.length === 0 
                      ? 'Create your first tag to start organizing your files'
                      : 'Try adjusting your search or filters'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <TagBadge name={tag.name} color={tag.color} size="md" />
                          {tag.description && (
                            <p className="text-sm text-gray-600 mt-2">{tag.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTag(tag)}
                            className="h-7 w-7 p-0 hover:bg-gray-100"
                            title="Edit tag"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTag(tag)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete tag"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Files tagged:</span>
                          <Badge variant={tag.fileCount > 0 ? "default" : "secondary"}>
                            {tag.fileCount}
                          </Badge>
                        </div>
                        

                      </div>

                      {/* Recent Files Preview */}
                      {tag.recentFiles && tag.recentFiles.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-2">Recent files:</p>
                          <div className="flex -space-x-1">
                            {tag.recentFiles.slice(0, 4).map((file) => (
                              <div
                                key={file.id}
                                className="w-8 h-8 rounded border-2 border-white overflow-hidden bg-gray-100 relative"
                                title={file.originalName}
                              >
                                {file.mimeType.startsWith('image/') ? (
                                  <img
                                    src={file.cloudinaryUrl}
                                    alt={file.originalName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <FileText className="h-3 w-3 text-gray-500" />
                                  </div>
                                )}
                              </div>
                            ))}
                            {tag.recentFiles.length > 4 && (
                              <div className="w-8 h-8 rounded border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium">
                                +{tag.recentFiles.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tag Management Dialog */}
          <TagManagementDialog
            open={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => {
              setShowCreateDialog(false)
            }}
          />

          <TagManagementDialog
            open={!!editingTag}
            onClose={() => setEditingTag(null)}
            tag={editingTag}
            onSuccess={() => {
              setEditingTag(null)
            }}
          />
        </main>
      </div>
    </div>
  )
}