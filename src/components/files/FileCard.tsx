'use client'

import { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { FileContextMenu } from './FileContextMenu'
import { useFileOperations } from '@/hooks/useFileOperations'
import { 
  File as FileIcon, 
  FileText, 
  FileImage, 
  FileVideo,
  Download,
  Eye,
  MoreHorizontal,
  FileType,
  FileSpreadsheet,
  FileCode,
  Archive,
  Music,
  Image
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { File } from '@/types/file'
import { getImageThumbnailUrl, getVideoThumbnailUrl, getPdfThumbnailUrl, getDocumentThumbnailUrl } from '@/utils/thumbnails'

interface FileCardProps {
  file: File
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  onToggleSelect: () => void
  onPreview: () => void
  onUpdate?: () => void
  onDelete?: (fileId: string) => void
  viewMode?: 'grid' | 'list'
  onRename?: () => void
}

export function FileCard({ 
  file, 
  isSelected, 
  onSelect, 
  onDeselect, 
  onToggleSelect,
  onPreview,
  onUpdate,
  onDelete,
  viewMode = 'grid',
  onRename
}: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renamingValue, setRenamingValue] = useState(file.originalName)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const { renameFile, loading: renameLoading } = useFileOperations()

  const handleStartRename = () => {
    setIsRenaming(true)
    setRenamingValue(file.originalName)
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus()
        // Select filename without extension for easier editing
        const lastDot = file.originalName.lastIndexOf('.')
        if (lastDot > 0) {
          renameInputRef.current.setSelectionRange(0, lastDot)
        } else {
          renameInputRef.current.select()
        }
      }
    }, 0)
  }

  const handleConfirmRename = async () => {
    if (renamingValue.trim() === file.originalName || !renamingValue.trim()) {
      setIsRenaming(false)
      return
    }

    try {
      await renameFile(file.id, renamingValue.trim())
      onUpdate?.()
      setIsRenaming(false)
    } catch (error) {
      console.error('Rename failed:', error)
      setRenamingValue(file.originalName)
      setIsRenaming(false)
    }
  }

  const handleCancelRename = () => {
    setRenamingValue(file.originalName)
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirmRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelRename()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString()
  }

  const getFileIcon = () => {
    const mimeType = file.mimeType.toLowerCase()
    
    // Images
    if (file.isImage) return <FileImage className="h-8 w-8 text-blue-500" />
    
    // Videos
    if (file.isVideo) return <FileVideo className="h-8 w-8 text-purple-500" />
    
    // Audio
    if (mimeType.startsWith('audio/')) return <Music className="h-8 w-8 text-pink-500" />
    
    // PDFs
    if (mimeType === 'application/pdf') return <FileType className="h-8 w-8 text-red-500" />
    
    // Word documents
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-600" />
    }
    
    // Excel/Spreadsheets
    if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />
    }
    
    // Code files
    if (mimeType.includes('javascript') || mimeType.includes('json') || 
        mimeType.includes('xml') || mimeType.includes('html') ||
        mimeType.includes('css') || file.originalName.match(/\.(js|ts|jsx|tsx|css|html|xml|json|py|java|cpp|c|php|rb|go)$/i)) {
      return <FileCode className="h-8 w-8 text-orange-500" />
    }
    
    // Archives
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') ||
        file.originalName.match(/\.(zip|rar|tar|gz|7z)$/i)) {
      return <Archive className="h-8 w-8 text-yellow-600" />
    }
    
    // Text files
    if (mimeType.startsWith('text/') || file.isDocument) {
      return <FileText className="h-8 w-8 text-green-500" />
    }
    
    return <FileIcon className="h-8 w-8 text-gray-500" />
  }

  const getFileTypeColor = () => {
    const mimeType = file.mimeType.toLowerCase()
    
    if (file.isImage) return 'bg-blue-50 border-blue-100'
    if (file.isVideo) return 'bg-purple-50 border-purple-100'
    if (mimeType.startsWith('audio/')) return 'bg-pink-50 border-pink-100'
    if (mimeType === 'application/pdf') return 'bg-red-50 border-red-100'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'bg-blue-50 border-blue-100'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'bg-green-50 border-green-100'
    if (mimeType.includes('javascript') || mimeType.includes('json') || 
        mimeType.includes('xml') || mimeType.includes('html') ||
        mimeType.includes('css') || file.originalName.match(/\.(js|ts|jsx|tsx|css|html|xml|json|py|java|cpp|c|php|rb|go)$/i)) {
      return 'bg-orange-50 border-orange-100'
    }
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') ||
        file.originalName.match(/\.(zip|rar|tar|gz|7z)$/i)) {
      return 'bg-yellow-50 border-yellow-100'
    }
    if (mimeType.startsWith('text/') || file.isDocument) return 'bg-green-50 border-green-100'
    
    return 'bg-gray-50 border-gray-100'
  }

  const getFileExtension = () => {
    const extension = file.originalName.split('.').pop()?.toUpperCase()
    if (extension && extension.length <= 4) return extension
    return file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'
  }

  const getThumbnail = () => {
    // Image thumbnails
    if (file.isImage && !imageError) {
      const thumbnailUrl = file.thumbnailUrl || getImageThumbnailUrl(file.cloudinaryUrl)
      
      return (
        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity border">
          <img
            src={thumbnailUrl}
            alt={file.originalName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </div>
      )
    }

    // Video thumbnails
    if (file.isVideo && !imageError) {
      const thumbnailUrl = file.thumbnailUrl || getVideoThumbnailUrl(file.cloudinaryUrl)
      
    if (thumbnailUrl) {
      return (
        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative group-hover:opacity-90 transition-opacity border">
          <img
            src={thumbnailUrl}
            alt={file.originalName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
            </div>
          </div>
        </div>
      )
    }
    }

    // PDF Preview - Use thumbnail if available, otherwise show icon
    if (file.mimeType === 'application/pdf') {
      const thumbnailUrl = file.thumbnailUrl || getPdfThumbnailUrl(file.cloudinaryUrl)
      
      if (thumbnailUrl && !imageError) {
        return (
          <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative group-hover:opacity-90 transition-opacity border">
            <img
              src={thumbnailUrl}
              alt={file.originalName}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => {
                // Fallback to icon view if thumbnail fails
                setImageError(true)
              }}
            />
            <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
              PDF
            </div>
          </div>
        )
      }
      
      return (
        <div className={`w-full h-32 rounded-lg border-2 flex flex-col items-center justify-center group-hover:bg-opacity-80 transition-colors ${getFileTypeColor()}`}>
          <div className="flex flex-col items-center justify-center text-red-600">
            <FileType className="h-12 w-12 mb-1" />
            <span className="text-xs font-bold tracking-wider">PDF</span>
            <span className="text-xs text-red-500 mt-1">
              {formatFileSize(file.size)}
            </span>
          </div>
        </div>
      )
    }

    // Other Document types (DOC, DOCX, TXT, etc.) - try thumbnail first
    if (file.mimeType.startsWith('application/') || file.mimeType.startsWith('text/')) {
      const documentThumbnailUrl = file.thumbnailUrl || getDocumentThumbnailUrl(file.cloudinaryUrl, file.mimeType)
      
      if (documentThumbnailUrl && !imageError) {
        return (
          <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative group-hover:opacity-90 transition-opacity border">
            <img
              src={documentThumbnailUrl}
              alt={file.originalName}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>
        )
      }
    }
    
    // Document files with enhanced preview (fallback icons)
    const colorClass = getFileTypeColor()
    const extension = getFileExtension()
    const mimeType = file.mimeType.toLowerCase()
    
    // Special handling for specific file types
    let fileTypeLabel = extension
    let description = ''
    
    if (mimeType.includes('word') || mimeType.includes('document')) {
      fileTypeLabel = 'DOCX'
      description = 'Word Document'
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      fileTypeLabel = 'XLSX'
      description = 'Excel Spreadsheet'
    } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      fileTypeLabel = 'PPTX'
      description = 'PowerPoint'
    } else if (mimeType.startsWith('audio/')) {
      description = 'Audio File'
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
      description = 'Archive'
    } else if (mimeType.startsWith('text/')) {
      description = 'Text File'
    } else if (mimeType.includes('javascript') || mimeType.includes('json') || 
               mimeType.includes('xml') || mimeType.includes('html') ||
               mimeType.includes('css')) {
      description = 'Code File'
    }
    
    return (
      <div className={`w-full h-32 rounded-lg border-2 flex flex-col items-center justify-center group-hover:bg-opacity-80 transition-colors ${colorClass} relative overflow-hidden`}>
        {/* Background pattern for documents */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              currentColor 10px,
              currentColor 11px
            )`
          }} />
        </div>
        
        <div className="flex flex-col items-center justify-center relative z-10">
          {getFileIcon()}
          <span className="text-xs font-bold tracking-wider mt-2">
            {fileTypeLabel}
          </span>
          {description && (
            <span className="text-xs text-gray-600 mt-0.5 text-center px-1">
              {description}
            </span>
          )}
          <span className="text-xs text-gray-500 mt-1">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>
    )
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
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
      
      // Show success feedback - can add toast notification here
      console.log(`Successfully downloaded: ${file.originalName}`)
    } catch (error) {
      console.error('Download failed:', error)
      // TODO: Show error toast notification
    }
  }

  return (
    <FileContextMenu 
      file={file} 
      onUpdate={onUpdate}
      onDelete={onDelete}
      onRename={handleStartRename}
    >
      <div
        className={cn(
          "relative group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all cursor-pointer transform hover:-translate-y-1",
          "hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 duration-200",
          isSelected && "ring-2 ring-blue-500 border-blue-300 dark:border-blue-600 translate-y-0"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onPreview}
      >
        {/* Selection checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelect()
              } else {
                onDeselect()
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm",
              !isHovered && !isSelected && "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          />
        </div>

        {/* Action buttons */}
        <div className={cn(
          "absolute top-2 right-2 flex gap-1 z-10",
          !isHovered && "opacity-0 group-hover:opacity-100 transition-opacity"
        )}>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
            className="h-6 w-6 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 shadow-sm"
            title="Preview"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownload}
            className="h-6 w-6 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 shadow-sm"
            title="Download"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 shadow-sm"
            title="More options"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {/* File thumbnail/icon */}
        {getThumbnail()}

        {/* File info */}
        <div className="mt-3 space-y-1">
          {isRenaming ? (
            <Input
              ref={renameInputRef}
              value={renamingValue}
              onChange={(e) => setRenamingValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleConfirmRename}
              className="text-sm font-medium h-6 px-1 py-0"
              disabled={renameLoading}
            />
          ) : (
            <p 
              className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5" 
              title={file.originalName}
              onDoubleClick={handleStartRename}
            >
              {file.originalName}
            </p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>{formatFileSize(file.size)}</span>
              <span>{formatDate(file.createdAt)}</span>
            </div>
            {file.user && (
              <div className="text-xs text-gray-400 truncate">
                By: {file.user.name || file.user.email}
              </div>
            )}
            {file.mimeType && (
              <div className="text-xs text-gray-400">
                {file.mimeType.toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {file.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs px-1 py-0"
                  style={{ 
                    backgroundColor: tag.color + '20', 
                    color: tag.color,
                    borderColor: tag.color + '40'
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {file.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{file.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </FileContextMenu>
  )
}