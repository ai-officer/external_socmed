'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/upload/FileUpload'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload as UploadIcon, 
  FileText, 
  FolderOpen,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  X
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useFolders } from '@/hooks/useFolders'
import { useTags } from '@/hooks/useTags'
import { formatBytes } from '@/hooks/useAnalytics'

export default function UploadPage() {
  const { data: session, status } = useSession()
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>()
  const { uploadQueue, clearQueue, clearCompleted, removeFromQueue, retryUpload } = useFileUpload()
  const { folders } = useFolders()
  const { tags } = useTags()

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
          <h1 className="text-2xl font-bold mb-4">Please sign in to upload files</h1>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Go to login
          </a>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-200'
      case 'error':
        return 'bg-red-100 border-red-200'
      case 'uploading':
        return 'bg-blue-100 border-blue-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  const pendingUploads = uploadQueue.filter(item => item.status === 'pending')
  const activeUploads = uploadQueue.filter(item => item.status === 'uploading')
  const completedUploads = uploadQueue.filter(item => item.status === 'completed')
  const failedUploads = uploadQueue.filter(item => item.status === 'error')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:ml-64">
        <Header title="Upload Files" subtitle="Pages / Upload" />
        
        <main className="p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  Upload Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Folder Selection */}
                {folders.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload to folder (optional)
                    </label>
                    <select
                      value={selectedFolderId || ''}
                      onChange={(e) => setSelectedFolderId(e.target.value || undefined)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Root folder</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* File Upload Component */}
                <FileUpload
                  folderId={selectedFolderId}
                  onUploadComplete={() => {
                    // Files will be shown in the queue below
                  }}
                />
              </CardContent>
            </Card>

            {/* Upload Queue Statistics */}
            {uploadQueue.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-gray-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold">{pendingUploads.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <UploadIcon className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Uploading</p>
                        <p className="text-2xl font-bold">{activeUploads.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold">{completedUploads.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Failed</p>
                        <p className="text-2xl font-bold">{failedUploads.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Upload Queue */}
            {uploadQueue.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Upload Queue ({uploadQueue.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      {completedUploads.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearCompleted}
                        >
                          Clear Completed
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearQueue}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg ${getStatusColor(item.status)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getStatusIcon(item.status)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {item.file.name}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{formatBytes(item.file.size)}</span>
                                <span className="capitalize">{item.status}</span>
                                {item.options?.folderId && (
                                  <span className="flex items-center gap-1">
                                    <FolderOpen className="h-3 w-3" />
                                    {folders.find(f => f.id === item.options?.folderId)?.name}
                                  </span>
                                )}
                                {item.options?.tags && item.options.tags.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {item.options.tags.length} tags
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Progress Bar */}
                            {item.status === 'uploading' && (
                              <div className="w-24">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {item.progress}%
                                </span>
                              </div>
                            )}

                            {/* Status Badge */}
                            <Badge
                              variant={
                                item.status === 'completed' ? 'default' :
                                item.status === 'error' ? 'destructive' :
                                item.status === 'uploading' ? 'secondary' : 'outline'
                              }
                            >
                              {item.status}
                            </Badge>

                            {/* Actions */}
                            <div className="flex gap-1">
                              {item.status === 'error' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => retryUpload(item.id, selectedFolderId)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Retry
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromQueue(item.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Error Message */}
                        {item.status === 'error' && item.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {item.error}
                          </div>
                        )}

                        {/* Description */}
                        {item.options?.description && (
                          <div className="mt-2 text-sm text-gray-600">
                            {item.options.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Text */}
            {uploadQueue.length === 0 && (
              <Card>
                <CardContent className="pt-8 pb-8">
                  <div className="text-center text-gray-500">
                    <UploadIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No files in upload queue</h3>
                    <p className="text-sm">
                      Drag and drop files or click the upload area above to start uploading
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}