import { useCallback } from 'react'
import { FileValidationResult, ValidationOptions } from '@/types/upload'

export function useFileValidation() {
  const validateFile = useCallback((
    file: File,
    options: ValidationOptions
  ): FileValidationResult => {
    const errors: string[] = []

    // File size validation - different limits for different file types
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    
    // Set appropriate size limits (much larger for videos as requested)
    const maxSize = isVideo ? 500 * 1024 * 1024 : (isImage ? 50 * 1024 * 1024 : 50 * 1024 * 1024) // 500MB for videos, 50MB for images/others
    
    if (file.size > maxSize) {
      const fileType = isVideo ? 'Video' : isImage ? 'Image' : 'File'
      errors.push(`${fileType} size exceeds ${formatFileSize(maxSize)}`)
    }

    // File type validation
    const isValidType = options.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })

    if (!isValidType) {
      errors.push('File type not supported')
    }

    // File name validation
    if (file.name.length > 255) {
      errors.push('File name too long')
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (dangerousExtensions.includes(fileExtension)) {
      errors.push('File type not allowed for security reasons')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])

  const validateFiles = useCallback((
    files: File[],
    options: ValidationOptions
  ): { validFiles: File[], invalidFiles: { file: File, errors: string[] }[] } => {
    const validFiles: File[] = []
    const invalidFiles: { file: File, errors: string[] }[] = []

    // Check file count
    if (files.length > options.maxFiles) {
      return {
        validFiles: [],
        invalidFiles: files.map(file => ({
          file,
          errors: [`Maximum ${options.maxFiles} files allowed`]
        }))
      }
    }

    // Check for duplicate names
    const fileNames = new Set<string>()
    
    files.forEach(file => {
      if (fileNames.has(file.name)) {
        invalidFiles.push({ file, errors: ['Duplicate file name'] })
        return
      }
      fileNames.add(file.name)

      const validation = validateFile(file, options)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        invalidFiles.push({ file, errors: validation.errors })
      }
    })

    return { validFiles, invalidFiles }
  }, [validateFile])

  return { validateFile, validateFiles }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}