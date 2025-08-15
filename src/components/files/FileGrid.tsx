'use client'

import { useState } from 'react'
import { FileCard } from './FileCard'
import { FilePreview } from './FilePreview'
import { DeleteDialog } from '@/components/operations/DeleteDialog'
import { useFiles, useFileSelection } from '@/hooks/useFiles'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, Move, Copy } from 'lucide-react'
import { FileQuery } from '@/types/file'

interface FileGridProps extends FileQuery {
  onFileUpdate?: () => void
  onFileDelete?: (fileId: string) => void
  viewMode?: 'grid' | 'list'
}

export function FileGrid({ 
  onFileUpdate, 
  onFileDelete,
  viewMode = 'grid',
  ...queryOptions 
}: FileGridProps) {
  const [previewFile, setPreviewFile] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const { 
    files, 
    loading, 
    error, 
    pagination, 
    loadMore, 
    hasMore,
    refresh
  } = useFiles(queryOptions)

  const {
    selectedFiles,
    selectFile,
    deselectFile,
    toggleFile,
    selectAll,
    deselectAll,
    isSelected,
    getSelectedFiles
  } = useFileSelection()

  const handleFileUpdate = () => {
    refresh()
    onFileUpdate?.()
  }

  const handleFileDelete = (fileId: string) => {
    refresh()
    onFileDelete?.(fileId)
  }

  const handleBulkDelete = (deletedFileIds: string[]) => {
    // Remove deleted files from selection
    deletedFileIds.forEach(id => deselectFile(id))
    refresh()
    onFileUpdate?.()
  }

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <p className="mb-4">Error loading files: {error}</p>
        <Button onClick={refresh} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center text-gray-500 p-8">
        <div className="max-w-sm mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No files found</h3>
          <p className="text-sm text-gray-400">
            Upload some files or adjust your search criteria
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Selection toolbar */}
      {selectedFiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 font-medium">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={deselectAll}>
                Deselect All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => selectAll(files)}
              >
                Select All
              </Button>
              
              {/* Bulk actions */}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                {/* TODO: Add more bulk actions like Move, Copy */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File grid - Google Drive style */}
      <div className={`${viewMode === 'grid' 
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" 
        : "flex flex-col space-y-2"
      }`}>
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            isSelected={isSelected(file.id)}
            onSelect={() => selectFile(file)}
            onDeselect={() => deselectFile(file.id)}
            onToggleSelect={() => toggleFile(file)}
            onPreview={() => setPreviewFile(file)}
            onUpdate={handleFileUpdate}
            onDelete={handleFileDelete}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center p-6">
          <Button
            onClick={loadMore}
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
              'Load More Files'
            )}
          </Button>
        </div>
      )}

      {/* Pagination info */}
      {pagination && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {files.length} of {pagination.total} files
        </div>
      )}

      {/* File preview modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onUpdate={handleFileUpdate}
          onDelete={handleFileDelete}
        />
      )}

      {/* Bulk delete dialog */}
      {showDeleteDialog && selectedFiles.length > 0 && (
        <DeleteDialog
          files={getSelectedFiles(files)}
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={handleBulkDelete}
        />
      )}
    </>
  )
}