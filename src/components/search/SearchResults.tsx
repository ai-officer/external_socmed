'use client'

import { useState } from 'react'
import { FileCard } from '@/components/files/FileCard'
import { FilePreview } from '@/components/files/FilePreview'
import { FileContextMenu } from '@/components/files/FileContextMenu'
import { DeleteDialog } from '@/components/operations/DeleteDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Trash2, FileText, FileVideo, FileImage, File as FileIcon, FileType, FileSpreadsheet, FileCode, Music, Archive } from 'lucide-react'
import { SearchResultFile } from '@/types/search'
import { File } from '@/types/file'

// Helper component to get file icon fallback
function FileIconFallback({ file }: { file: SearchResultFile }) {
  const mimeType = file.mimeType.toLowerCase()
  
  // Get file extension for display
  const extension = file.originalName.split('.').pop()?.toUpperCase() || 
    (mimeType.includes('pdf') ? 'PDF' :
     mimeType.includes('word') ? 'DOC' :
     mimeType.includes('excel') ? 'XLS' :
     mimeType.includes('powerpoint') ? 'PPT' :
     mimeType.includes('text') ? 'TXT' :
     mimeType.includes('json') ? 'JSON' :
     mimeType.includes('javascript') ? 'JS' :
     mimeType.includes('html') ? 'HTML' :
     mimeType.includes('css') ? 'CSS' : 'FILE')
  
  // Get icon and color based on file type
  let IconComponent = FileText
  let iconColor = 'text-gray-400'
  
  if (mimeType.includes('pdf')) {
    IconComponent = FileType
    iconColor = 'text-red-500'
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    IconComponent = FileText
    iconColor = 'text-blue-500'
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    IconComponent = FileSpreadsheet
    iconColor = 'text-green-500'
  } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    IconComponent = FileText
    iconColor = 'text-orange-500'
  } else if (mimeType.includes('text') || mimeType.includes('javascript') || mimeType.includes('json')) {
    IconComponent = FileCode
    iconColor = 'text-yellow-600'
  } else if (file.isVideo) {
    IconComponent = FileVideo
    iconColor = 'text-purple-500'
  } else if (mimeType.includes('audio')) {
    IconComponent = Music
    iconColor = 'text-pink-500'
  } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
    IconComponent = Archive
    iconColor = 'text-amber-600'
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <IconComponent className={`w-12 h-12 ${iconColor} mb-2`} />
      <span className="text-xs font-semibold text-gray-600 tracking-wider">{extension}</span>
    </div>
  )
}

interface SearchResultsProps {
  results: SearchResultFile[]
  loading?: boolean
  error?: string | null
  query?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  onLoadMore?: () => void
  onFileUpdate?: () => void
  onFileDelete?: (fileId: string) => void
}

export function SearchResults({
  results,
  loading = false,
  error = null,
  query = '',
  pagination,
  onLoadMore,
  onFileUpdate,
  onFileDelete
}: SearchResultsProps) {
  const [previewFile, setPreviewFile] = useState<SearchResultFile | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleFileSelect = (fileId: string, selected: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (selected) {
      newSelected.add(fileId)
    } else {
      newSelected.delete(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === results.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(results.map(r => r.id)))
    }
  }

  const handleBulkDelete = (deletedFileIds: string[]) => {
    // Remove deleted files from selection
    deletedFileIds.forEach(id => {
      selectedFiles.delete(id)
    })
    setSelectedFiles(new Set(selectedFiles))
    onFileUpdate?.()
  }

  const getSelectedFileObjects = () => {
    return results.filter(result => selectedFiles.has(result.id))
  }

  if (loading && results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Searching...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <p className="mb-4">Error searching files: {error}</p>
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <div className="text-center text-gray-500 p-8">
        <div className="max-w-sm mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p className="text-sm text-gray-400">
            No files found for &quot;{query}&quot;. Try adjusting your search terms or filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Selection toolbar */}
      {selectedFiles.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 font-medium">
              {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedFiles(new Set())}
              >
                Deselect All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results header */}
      {pagination && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {pagination.total > 0 && (
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  {query && <span> for &quot;{query}&quot;</span>}
                </span>
              )}
            </div>
            
            {results.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedFiles.size === results.length && results.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </div>
          )}
        </div>
      )}

      {/* Results grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {results.map((file) => (
          <SearchResultCard
            key={file.id}
            file={file}
            isSelected={selectedFiles.has(file.id)}
            onSelect={(selected) => handleFileSelect(file.id, selected)}
            onPreview={() => setPreviewFile(file)}
            onUpdate={onFileUpdate}
            onDelete={onFileDelete}
          />
        ))}
      </div>

      {/* Load more button */}
      {pagination?.hasNext && (
        <div className="flex justify-center p-6">
          <Button
            onClick={onLoadMore}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Results'
            )}
          </Button>
        </div>
      )}

      {/* File preview modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onUpdate={onFileUpdate}
          onDelete={onFileDelete}
        />
      )}

      {/* Bulk delete dialog */}
      {showDeleteDialog && selectedFiles.size > 0 && (
        <DeleteDialog
          files={getSelectedFileObjects() as unknown as File[]}
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={handleBulkDelete}
        />
      )}
    </>
  )
}

// Custom search result card that can handle highlighted text
function SearchResultCard({ file, isSelected, onSelect, onPreview, onUpdate, onDelete }: {
  file: SearchResultFile
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onPreview: () => void
  onUpdate?: () => void
  onDelete?: (fileId: string) => void
}) {
  const [thumbnailError, setThumbnailError] = useState(false)
  const [imageError, setImageError] = useState(false)
  const handleUpdate = () => {
    onUpdate?.()
  }

  const handleDelete = (fileId: string) => {
    onDelete?.(fileId)
  }

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return // Don't trigger preview when clicking checkbox
    }
    onPreview()
  }

  return (
    <FileContextMenu
      file={file as unknown as File}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    >
      <div className={`group relative bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
      onClick={handleClick}
      >
        {/* Selection checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onSelect}
            className="bg-white border-2"
          />
        </div>

        {/* File preview with thumbnails or icons */}
        <div className="aspect-square bg-gray-50 flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200">
          {(() => {
            // Try to show actual thumbnail for images, videos, and supported docs
            if ((file.isImage || file.isVideo || file.mimeType === 'application/pdf') && file.thumbnailUrl && !thumbnailError) {
              return (
                <img
                  src={file.thumbnailUrl}
                  alt={file.originalName}
                  className="w-full h-full object-cover rounded"
                  onError={() => {
                    console.log('Thumbnail failed, showing icon fallback for:', file.originalName)
                    setThumbnailError(true)
                  }}
                />
              )
            }
            
            // For images without thumbnails, try direct cloudinary URL
            if (file.isImage && file.cloudinaryUrl && !imageError && !thumbnailError) {
              return (
                <img
                  src={file.cloudinaryUrl}
                  alt={file.originalName}
                  className="w-full h-full object-cover rounded"
                  onError={() => {
                    console.log('Direct image failed, showing icon fallback for:', file.originalName)
                    setImageError(true)
                  }}
                />
              )
            }
            
            // For all other files or failed thumbnails, show clean icon-based preview
            return <FileIconFallback file={file} />
          })()}
        </div>

        {/* File info */}
        <div className="p-3">
          <div 
            className="font-medium text-sm truncate"
            dangerouslySetInnerHTML={{ __html: file.highlightedName }}
          />
          
          <div className="text-xs text-gray-500 mt-1">
            {(file.size / 1024).toFixed(1)} KB
          </div>

          {/* Tags */}
          {file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {file.tags.slice(0, 2).map(tag => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 text-xs rounded-full text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {file.tags.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{file.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Relevance score (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-1">
              Score: {file.relevanceScore}
            </div>
          )}
        </div>
      </div>
    </FileContextMenu>
  )
}