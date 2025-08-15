'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploadZone } from './FileUploadZone'
import { UploadQueue } from './UploadQueue'
import { TagInput } from '@/components/tags/TagInput'
import { useFileUpload } from '@/hooks/useFileUpload'
import { Upload, X, Tag, Settings, AlertTriangle, ExternalLink } from 'lucide-react'

interface FileUploadProps {
  folderId?: string
  onUploadComplete?: (files: any[]) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
  trigger?: React.ReactNode
}

export function FileUpload({ 
  folderId, 
  onUploadComplete, 
  maxFiles = 20,
  disabled = false,
  className,
  trigger
}: FileUploadProps) {
  const [showUploadZone, setShowUploadZone] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTags, setSelectedTags] = useState<any[]>([])
  const [description, setDescription] = useState('')
  const [uploadServiceAvailable, setUploadServiceAvailable] = useState(true)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const autoCloseTriggeredRef = useRef(false)
  
  const { 
    uploadQueue, 
    uploadFiles, 
    removeFromQueue, 
    clearQueue,
    clearCompleted,
    retryUpload,
    cancelUpload
  } = useFileUpload()

  // Check if upload service is available
  useEffect(() => {
    const checkService = async () => {
      try {
        // Use a simple HEAD request to check if the API is accessible
        // This avoids the 400 error from sending empty FormData
        const response = await fetch('/api/upload', {
          method: 'HEAD'
        })
        
        if (response.status === 503) {
          // Service unavailable (likely Cloudinary not configured)
          setUploadServiceAvailable(false)
          setServiceError('File upload service not configured. Please contact administrator.')
        } else {
          // Any other response (including 405 for unsupported HEAD) means service is available
          setUploadServiceAvailable(true)
          setServiceError(null)
        }
      } catch (error) {
        // Network error, assume service is available for now
        setUploadServiceAvailable(true)
        setServiceError(null)
      }
    }

    checkService()
  }, [])

  const handleFileSelect = (files: File[]) => {
    if (!uploadServiceAvailable) {
      return
    }

    console.log('FileUpload: Uploading to folder ID:', folderId)

    const uploadOptions = {
      folderId,
      tags: selectedTags.map(tag => tag.id),
      description: description.trim() || undefined,
      onComplete: (completedFiles: any[]) => {
        // Call the completion callback when all uploads in this batch are done
        onUploadComplete?.(completedFiles)
      }
    }
    
    uploadFiles(files, uploadOptions)
    setShowQueue(true)
  }

  const pendingCount = uploadQueue.filter(item => item.status === 'pending' || item.status === 'uploading').length
  const completedCount = uploadQueue.filter(item => item.status === 'completed').length
  const failedCount = uploadQueue.filter(item => item.status === 'error').length

  const hasActiveUploads = uploadQueue.some(item => 
    item.status === 'uploading' || item.status === 'pending'
  )

  const allCompleted = uploadQueue.length > 0 && !hasActiveUploads && failedCount === 0

  // Auto-close Upload Files modal when all uploads are completed successfully
  useEffect(() => {
    if (allCompleted && showUploadZone && !autoCloseTriggeredRef.current) {
      console.log('All uploads completed successfully, auto-closing Upload Files modal and clearing completed uploads')
      autoCloseTriggeredRef.current = true // Prevent multiple triggers
      
      // Trigger final completion callback with all completed files
      const completedFiles = uploadQueue.filter(item => item.status === 'completed')
      if (completedFiles.length > 0 && onUploadComplete) {
        console.log('Triggering final upload completion callback for batch')
        onUploadComplete(completedFiles.map(item => item.result?.file).filter(Boolean))
      }
      
      // Delay the close to give user a moment to see completion
      setTimeout(() => {
        clearCompleted() // Clear completed uploads from queue
        setShowUploadZone(false)
        autoCloseTriggeredRef.current = false // Reset for next upload session
      }, 2000) // 2 seconds delay for the main modal
    }
  }, [allCompleted, showUploadZone]) // Removed problematic dependencies

  const stats = {
    total: uploadQueue.length,
    completed: uploadQueue.filter(item => item.status === 'completed').length,
    uploading: uploadQueue.filter(item => item.status === 'uploading').length,
    error: uploadQueue.filter(item => item.status === 'error').length,
  }

  return (
    <div className={className}>
      {/* Service Error Warning */}
      {!uploadServiceAvailable && serviceError && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-800 mb-1">Upload Service Unavailable</h3>
                <p className="text-sm text-orange-700 mb-3">{serviceError}</p>
                <div className="space-y-2 text-sm text-orange-700">
                  <p className="font-medium">To fix this issue:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Create a free Cloudinary account at <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">cloudinary.com <ExternalLink className="h-3 w-3" /></a></li>
                    <li>Get your Cloud Name, API Key, and API Secret from the dashboard</li>
                    <li>Create a <code className="bg-orange-100 px-1 rounded">.env.local</code> file in the project root</li>
                    <li>Add your credentials:</li>
                  </ol>
                  <pre className="bg-orange-100 p-2 rounded text-xs mt-2 overflow-x-auto">
{`CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"`}
                  </pre>
                  <p className="text-xs">Then restart the development server.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        {trigger ? (
          <div onClick={uploadServiceAvailable ? () => setShowUploadZone(true) : undefined} className={!uploadServiceAvailable ? 'opacity-50 cursor-not-allowed' : ''}>
            {trigger}
          </div>
        ) : (
          <Button
            onClick={() => setShowUploadZone(true)}
            disabled={disabled || !uploadServiceAvailable}
            variant="default"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploadServiceAvailable ? `Upload Files (${maxFiles} max)` : 'Upload Unavailable'}
          </Button>
        )}

        {/* Settings Button */}
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!uploadServiceAvailable}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>

        {/* Queue Status Indicator */}
        {uploadQueue.length > 0 && (
          <Button
            onClick={() => setShowQueue(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            Queue ({uploadQueue.length})
            {pendingCount > 0 && (
              <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </Button>
        )}
      </div>

      {/* Upload Settings Panel */}
      {showSettings && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Upload Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Tags
              </label>
              <TagInput
                tags={selectedTags}
                onTagsChange={setSelectedTags}
                placeholder="Add tags to all uploaded files..."
                maxTags={5}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for all uploaded files..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/200 characters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Zone Modal */}
      {showUploadZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Upload Files</h2>
                <p className="text-sm text-gray-500">
                  Multiple files supported • Max {maxFiles} files • Up to 10MB each
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadZone(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <FileUploadZone
              onFileSelect={handleFileSelect}
              disabled={disabled || !uploadServiceAvailable}
              maxFiles={maxFiles}
            />

            {/* Upload Settings in Modal */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Upload Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (applied to all files)
                  </label>
                  <TagInput
                    tags={selectedTags}
                    onTagsChange={setSelectedTags}
                    placeholder="Add tags..."
                    maxTags={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </div>
            </div>
            
            {uploadQueue.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Upload Progress</span>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">{completedCount} completed</span>
                    <span className="text-blue-600">{pendingCount} uploading</span>
                    {failedCount > 0 && <span className="text-red-600">{failedCount} failed</span>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${uploadQueue.length > 0 ? (completedCount / uploadQueue.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    {uploadQueue.length} files • {completedCount} completed
                    {pendingCount > 0 && ` • ${pendingCount} uploading`}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowUploadZone(false)}
              >
                Close
              </Button>
              {uploadQueue.length > 0 && (
                <Button
                  variant="default"
                  onClick={() => {
                    setShowUploadZone(false)
                    setShowQueue(true)
                  }}
                >
                  View Upload Queue ({uploadQueue.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Queue Modal */}
      <UploadQueue
        queue={uploadQueue}
        open={showQueue}
        onClose={() => setShowQueue(false)}
        onRemove={removeFromQueue}
        onClear={clearQueue}
        onRetry={retryUpload}
        onCancel={cancelUpload}
        onClearCompleted={clearCompleted}
      />
    </div>
  )
}