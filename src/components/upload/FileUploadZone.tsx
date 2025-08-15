'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Image, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

interface FileUploadZoneProps {
  onFileSelect?: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  maxSize?: number
  accept?: Record<string, string[]>
  className?: string
}

const defaultAccept = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.svg', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
  'application/pdf': ['.pdf'],
  'text/*': ['.txt', '.md'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}

export function FileUploadZone({ 
  onFileSelect,
  disabled = false,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB default for videos
  accept = defaultAccept,
  className
}: FileUploadZoneProps) {
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect?.(acceptedFiles)
    }
  }, [onFileSelect])

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive, 
    isDragAccept, 
    isDragReject 
  } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
    disabled,
    multiple: maxFiles > 1
  })

  const getIcon = () => {
    if (isDragActive) {
      if (isDragAccept) {
        return <Upload className="h-12 w-12 text-green-500" />
      } else if (isDragReject) {
        return <Upload className="h-12 w-12 text-red-500" />
      }
    }
    return <Upload className="h-12 w-12 text-gray-400" />
  }

  const getDescription = () => {
    if (isDragActive) {
      if (isDragAccept) {
        return 'Drop files here to upload'
      } else if (isDragReject) {
        return 'Some files are not supported'
      }
    }
    return `Drag and drop up to ${maxFiles} files here, or click to select`
  }

  const getSupportedFormats = () => {
    const formats = []
    if (accept['image/*']) formats.push('Images')
    if (accept['video/*']) formats.push('Videos')
    if (accept['application/pdf']) formats.push('PDFs')
    if (accept['text/*']) formats.push('Documents')
    return formats.join(', ')
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
          "hover:border-gray-400 hover:bg-gray-50",
          isDragActive && "border-blue-400 bg-blue-50",
          isDragAccept && "border-green-400 bg-green-50",
          isDragReject && "border-red-400 bg-red-50",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          !isDragActive && "border-gray-300"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {getIcon()}
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {disabled ? 'Upload disabled' : 'Upload your files'}
            </p>
            <p className="text-sm text-gray-600">
              {getDescription()}
            </p>
            
            {!disabled && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Supported: {getSupportedFormats()}
                </p>
                <p className="text-xs text-gray-500">
                  Max size: 100MB for videos, 10MB for images/docs
                </p>
              </div>
            )}
          </div>
          
          {!disabled && (
            <Button type="button" variant="default" className="mt-4">
              Choose Files
            </Button>
          )}
        </div>
      </div>

      {/* File type indicators */}
      <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
        {accept['image/*'] && (
          <div className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            <span>Images</span>
          </div>
        )}
        {accept['video/*'] && (
          <div className="flex items-center gap-1">
            <Video className="h-4 w-4" />
            <span>Videos</span>
          </div>
        )}
        {(accept['application/pdf'] || accept['text/*']) && (
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </div>
        )}
      </div>
    </div>
  )
}