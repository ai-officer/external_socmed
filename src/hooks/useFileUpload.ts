import { useState, useCallback } from 'react'
import { UploadItem } from '@/types/upload'
import { useFileValidation } from './useFileValidation'
// import { useToast } from '@/hooks/use-toast'

const DEFAULT_VALIDATION_OPTIONS = {
  maxSize: 500 * 1024 * 1024, // 500MB - will be adjusted per file type in validation
  allowedTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/webm',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  maxFiles: 20
}

export function useFileUpload() {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const [completionCallbacks, setCompletionCallbacks] = useState<Map<string, (files: any[]) => void>>(new Map())
  const { validateFiles } = useFileValidation()
  // const { toast } = useToast()

  const uploadFiles = useCallback(async (
    files: File[], 
    options?: { 
      folderId?: string; 
      tags?: string[]; 
      description?: string;
      onComplete?: (files: any[]) => void;
    }
  ) => {
    // Validate files first
    const { validFiles, invalidFiles } = validateFiles(files, DEFAULT_VALIDATION_OPTIONS)

    // Show validation errors
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, errors }) => {
        console.error(`Validation failed for ${file.name}:`, errors)
        // toast({
        //   title: `Invalid file: ${file.name}`,
        //   description: errors.join(', '),
        //   variant: 'destructive'
        // })
      })
    }

    if (validFiles.length === 0) return

    // Create upload batch ID for tracking completion
    const batchId = crypto.randomUUID()
    
    // Store completion callback if provided
    if (options?.onComplete) {
      setCompletionCallbacks(prev => new Map(prev).set(batchId, options.onComplete!))
    }

    // Create upload items for valid files
    const newItems: UploadItem[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending' as const,
      progress: 0,
      options: { ...options, batchId } // Store batch ID and upload options
    }))

    setUploadQueue(prev => [...prev, ...newItems])

    // Track completed files for this batch
    const completedFiles: any[] = []

    // Upload each file
    for (const item of newItems) {
      try {
        setUploadQueue(prev => 
          prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q)
        )

        // Create FormData
        const formData = new FormData()
        formData.append('file', item.file)
        
        // Debug: Log folder ID being sent (can be removed later)
        console.log('Uploading file to folder ID:', item.options?.folderId)
        
        // Always append folderId (even if undefined, for root folder)
        if (item.options?.folderId !== undefined) {
          formData.append('folderId', item.options.folderId)
        }
        // If folderId is explicitly undefined, don't append it (API will handle as root folder)
        
        if (item.options?.description) formData.append('description', item.options.description)
        if (item.options?.tags && item.options.tags.length > 0) {
          formData.append('tagIds', JSON.stringify(item.options.tags))
        }

        // Upload with progress tracking
        const response = await uploadWithProgress(formData, (progress, phase) => {
          setUploadQueue(prev => 
            prev.map(q => q.id === item.id ? { ...q, progress, uploadPhase: phase } : q)
          )
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const result = await response.json()

        setUploadQueue(prev => 
          prev.map(q => q.id === item.id ? {
            ...q,
            status: 'completed',
            progress: 100,
            result
          } : q)
        )

        // Add to completed files
        if (result.file) {
          completedFiles.push(result.file)
        }

        // Call callback immediately after each successful upload for real-time refresh
        const callback = completionCallbacks.get(batchId)
        if (callback && result.file) {
          console.log('Calling immediate refresh callback for file:', result.file.originalName)
          callback([result.file])
        }

        // toast({
        //   title: 'Upload successful',
        //   description: `${item.file.name} uploaded successfully`
        // })

      } catch (error) {
        setUploadQueue(prev => 
          prev.map(q => q.id === item.id ? {
            ...q,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : q)
        )

        // toast({
        //   title: 'Upload failed',
        //   description: `Failed to upload ${item.file.name}`,
        //   variant: 'destructive'
        // })
      }
    }

    // Call final completion callback (cleanup and final notification)
    const callback = completionCallbacks.get(batchId)
    if (callback && completedFiles.length > 0) {
      console.log('Calling final upload completion callback with', completedFiles.length, 'files')
      // Final refresh to ensure everything is up to date
      callback(completedFiles)
      setCompletionCallbacks(prev => {
        const newMap = new Map(prev)
        newMap.delete(batchId)
        return newMap
      })
      
      // Auto-clear completed uploads after a short delay to let UI update
      setTimeout(() => {
        console.log('Auto-clearing completed uploads from queue')
        setUploadQueue(prev => {
          const remaining = prev.filter(item => item.status !== 'completed')
          console.log('Queue cleared:', prev.length, '→', remaining.length, 'items')
          return remaining
        })
      }, 3000) // 3 seconds delay to ensure modals have time to close
    } else {
      console.log('No callback or no completed files:', !!callback, completedFiles.length)
    }
  }, [validateFiles, completionCallbacks])

  const removeFromQueue = useCallback((id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearQueue = useCallback(() => {
    setUploadQueue([])
  }, [])

  const clearCompleted = useCallback(() => {
    setUploadQueue(prev => prev.filter(item => item.status !== 'completed'))
  }, [])

  const retryUpload = useCallback((id: string, folderId?: string) => {
    const item = uploadQueue.find(q => q.id === id)
    if (item && item.status === 'error') {
      // Reset item status
      setUploadQueue(prev => 
        prev.map(q => q.id === id ? { ...q, status: 'pending', error: undefined, progress: 0, uploadPhase: undefined } : q)
      )
      
      // Retry upload with original options
      const retryOptions = {
        folderId: folderId || item.options?.folderId,
        tags: item.options?.tags,
        description: item.options?.description,
        onComplete: item.options?.onComplete
      }
      uploadFiles([item.file], retryOptions)
    }
  }, [uploadQueue, uploadFiles])

  const cancelUpload = useCallback((id: string) => {
    setUploadQueue(prev => 
      prev.map(q => q.id === id && q.status === 'uploading' ? { ...q, status: 'error', error: 'Cancelled by user' } : q)
    )
  }, [])

  return {
    uploadQueue,
    uploadFiles,
    removeFromQueue,
    clearQueue,
    clearCompleted,
    retryUpload,
    cancelUpload
  }
}

// Helper function to upload with progress tracking
async function uploadWithProgress(
  formData: FormData,
  onProgress: (progress: number, phase?: string) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress - this is the network transfer
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        // Upload phase covers 0-70% of total progress
        const uploadProgress = Math.round((event.loaded / event.total) * 70)
        onProgress(uploadProgress, 'Uploading...')
      }
    })

    // When upload completes, show processing phase
    xhr.upload.addEventListener('load', () => {
      onProgress(70, 'Processing...')
      
      // Simulate processing time with gradual progress increase
      setTimeout(() => onProgress(80, 'Processing...'), 200)
      setTimeout(() => onProgress(90, 'Saving to database...'), 400)
    })

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        onProgress(95, 'Finalizing...')
      }
    })

    xhr.addEventListener('load', () => {
      onProgress(100, 'Complete')
      
      if (xhr.status >= 200 && xhr.status < 300) {
        // Create a Response-like object
        const response = {
          ok: true,
          status: xhr.status,
          json: () => Promise.resolve(JSON.parse(xhr.responseText))
        } as Response
        resolve(response)
      } else {
        const response = {
          ok: false,
          status: xhr.status,
          json: () => Promise.resolve(JSON.parse(xhr.responseText))
        } as Response
        resolve(response)
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'))
    })

    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}