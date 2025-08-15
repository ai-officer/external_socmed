export interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  uploadPhase?: string
  error?: string
  result?: any
  options?: {
    folderId?: string
    tags?: string[]
    description?: string
    batchId?: string
    onComplete?: (files: any[]) => void
  }
}

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationOptions {
  maxSize: number // in bytes
  allowedTypes: string[]
  maxFiles: number
}

export interface UploadQueueItem extends UploadItem {
  folderId?: string
}