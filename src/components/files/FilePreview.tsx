'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/operations/DeleteDialog'
import { 
  Download, 
  X, 
  Share,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { File } from '@/types/file'
import { SearchResultFile } from '@/types/search'

interface FilePreviewProps {
  file: File | SearchResultFile
  open: boolean
  onClose: () => void
  onUpdate?: () => void
  onDelete?: (fileId: string) => void
}

export function FilePreview({ file, open, onClose, onUpdate, onDelete }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (!file) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(file.cloudinaryUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Auto-close modal after successful download with a slight delay
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Download failed:', error)
      // TODO: Show error toast notification
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.originalName,
          url: file.cloudinaryUrl
        })
      } catch (error) {
        // Fall back to copying to clipboard
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(file.cloudinaryUrl)
    // TODO: Show toast notification
  }

  const handleDelete = (deletedFileIds: string[]) => {
    onDelete?.(deletedFileIds[0])
    onClose()
  }

  const renderPreview = () => {
    if (file.isImage && !imageError) {
      return (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden max-h-96">
          <img
            src={file.cloudinaryUrl}
            alt={file.originalName}
            className="max-w-full max-h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      )
    }

    if (file.isVideo) {
      return (
        <div className="bg-black rounded-lg overflow-hidden">
          <video
            controls
            className="w-full max-h-96"
            src={file.cloudinaryUrl}
            poster={'thumbnailUrl' in file ? file.thumbnailUrl : undefined}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-center mb-4">
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">PDF Document</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatFileSize(file.size)} • {file.originalName}
            </p>
          </div>
          
          {/* PDF Thumbnail Preview */}
          {'thumbnailUrl' in file && file.thumbnailUrl ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={file.thumbnailUrl}
                  alt={`First page of ${file.originalName}`}
                  className="max-w-full max-h-96 object-contain bg-white"
                  onError={(e) => {
                    // Hide thumbnail if it fails to load
                    (e.target as HTMLElement).style.display = 'none'
                  }}
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                  PDF
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Preview of first page
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-4">
              <div className="w-32 h-40 bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center mb-4">
                <svg className="w-16 h-16 text-red-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="text-red-600 font-bold text-sm">PDF</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PDF preview not available
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => window.open(file.cloudinaryUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      )
    }

    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">Audio File</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)} • {file.originalName}
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-pink-50 border-2 border-pink-200 rounded-full flex items-center justify-center mb-6">
              <svg className="w-16 h-16 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Audio Player */}
            <div className="w-full max-w-md mb-4">
              <audio
                controls
                className="w-full"
                src={file.cloudinaryUrl}
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json') {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">Text Document</p>
          <div className="bg-white dark:bg-gray-900 rounded border p-4 max-h-96 overflow-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click download to view the full content
            </p>
          </div>
        </div>
      )
    }

    // Enhanced preview for other file types
    const getFileIcon = () => {
      const mimeType = file.mimeType.toLowerCase()
      
      if (mimeType.includes('word') || mimeType.includes('document')) {
        return (
          <div className="w-32 h-40 bg-blue-50 border-2 border-blue-200 rounded-lg flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-blue-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-600 font-bold text-sm">DOCX</span>
          </div>
        )
      }
      
      if (mimeType.includes('sheet') || mimeType.includes('excel')) {
        return (
          <div className="w-32 h-40 bg-green-50 border-2 border-green-200 rounded-lg flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-green-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-600 font-bold text-sm">XLSX</span>
          </div>
        )
      }
      
      if (mimeType.startsWith('audio/')) {
        return (
          <div className="w-32 h-40 bg-pink-50 border-2 border-pink-200 rounded-lg flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-pink-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
            </svg>
            <span className="text-pink-600 font-bold text-sm">AUDIO</span>
          </div>
        )
      }
      
      // Default file icon
      return (
        <div className="w-32 h-40 bg-gray-50 border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600 font-bold text-sm">
            {file.originalName.split('.').pop()?.toUpperCase() || 'FILE'}
          </span>
        </div>
      )
    }

    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
            {file.mimeType.includes('word') || file.mimeType.includes('document') ? 'Word Document' :
             file.mimeType.includes('sheet') || file.mimeType.includes('excel') ? 'Excel Spreadsheet' :
             file.mimeType.startsWith('audio/') ? 'Audio File' :
             'Document Preview'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)} • {file.originalName}
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          {getFileIcon()}
          
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => window.open(file.cloudinaryUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open File
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
            Preview not available for this file type.<br/>
            Use the buttons above to open or download the file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            {file.originalName}
          </DialogTitle>
        </DialogHeader>

        {/* Action buttons - moved below header to avoid conflict with built-in close button */}
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          <Button size="sm" variant="outline" onClick={handleDownload} title="Download">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare} title="Share">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.open(file.cloudinaryUrl, '_blank')}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        <div className="space-y-4">
          {/* File preview */}
          <div className="min-h-[200px]">
            {renderPreview()}
          </div>

          {/* File metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">File Details</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Size:</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{formatFileSize(file.size)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Type:</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{file.mimeType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Created:</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{formatDate(file.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Modified:</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{formatDate(file.updatedAt)}</dd>
                </div>
                {file.user && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Uploaded by:</dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      {file.user.name || file.user.email}
                    </dd>
                  </div>
                )}
                {file.folder && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Folder:</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{file.folder.name}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {file.tags && file.tags.length > 0 ? (
                  file.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      style={{ 
                        backgroundColor: tag.color + '20', 
                        color: tag.color,
                        borderColor: tag.color + '40'
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tags</p>
                )}
              </div>

              {file.description && (
                <>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 mt-4">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{file.description}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Dialog */}
    {showDeleteDialog && (
      <DeleteDialog
        files={[file as unknown as File]}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onSuccess={handleDelete}
      />
    )}
    </>
  )
}