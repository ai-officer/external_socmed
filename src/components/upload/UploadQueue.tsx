import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UploadProgress } from './UploadProgress'
import { UploadItem } from '@/types/upload'
import { X, Trash2, RotateCcw, CheckCircle } from 'lucide-react'

interface UploadQueueProps {
  queue: UploadItem[]
  open: boolean
  onClose: () => void
  onRemove: (id: string) => void
  onClear: () => void
  onRetry: (id: string) => void
  onCancel?: (id: string) => void
  onClearCompleted?: () => void
}

export function UploadQueue({ 
  queue, 
  open, 
  onClose, 
  onRemove, 
  onClear, 
  onRetry, 
  onCancel,
  onClearCompleted 
}: UploadQueueProps) {
  const [showCompleted, setShowCompleted] = useState(true)
  const autoCloseTriggeredRef = useRef(false)

  const stats = {
    total: queue.length,
    pending: queue.filter(item => item.status === 'pending').length,
    uploading: queue.filter(item => item.status === 'uploading').length,
    completed: queue.filter(item => item.status === 'completed').length,
    error: queue.filter(item => item.status === 'error').length,
  }

  const filteredQueue = showCompleted 
    ? queue 
    : queue.filter(item => item.status !== 'completed')

  const isUploading = stats.uploading > 0
  const hasActiveUploads = stats.pending > 0 || stats.uploading > 0
  const allCompleted = stats.total > 0 && !hasActiveUploads && stats.error === 0

  // Auto-close when all uploads are completed successfully
  useEffect(() => {
    if (allCompleted && open && !autoCloseTriggeredRef.current) {
      console.log('All uploads completed successfully, auto-closing Upload Queue modal and clearing completed items')
      autoCloseTriggeredRef.current = true // Prevent multiple triggers
      
      // Clear completed uploads and close modal
      setTimeout(() => {
        onClearCompleted?.() // Clear completed uploads from queue
        onClose()
        autoCloseTriggeredRef.current = false // Reset for next session
      }, 1500) // 1.5 seconds delay
    }
  }, [allCompleted, open, onClose, onClearCompleted])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Upload Queue</DialogTitle>
          <DialogDescription>
            Monitor and manage your file uploads. View progress, retry failed uploads, or cancel pending ones.
          </DialogDescription>
          
          {/* Stats */}
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary">{stats.total} total</Badge>
            {stats.pending > 0 && (
              <Badge variant="secondary" className="bg-gray-100">
                {stats.pending} pending
              </Badge>
            )}
            {stats.uploading > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {stats.uploading} uploading
              </Badge>
            )}
            {stats.completed > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {stats.completed} completed
              </Badge>
            )}
            {stats.error > 0 && (
              <Badge variant="destructive">
                {stats.error} failed
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={showCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide Completed' : 'Show All'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {stats.completed > 0 && onClearCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearCompleted}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Clear Completed
              </Button>
            )}
            
            {stats.error > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queue.filter(item => item.status === 'error')
                    .forEach(item => onRetry(item.id))
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry All
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={onClear}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Queue Items */}
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {showCompleted ? 'No files in queue' : 'No active uploads'}
              </div>
            ) : (
              filteredQueue.map((item) => (
                <UploadProgress
                  key={item.id}
                  item={item}
                  onRetry={onRetry}
                  onRemove={onRemove}
                  onCancel={onCancel}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Overall Progress */}
        {isUploading && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>{stats.completed} of {stats.total} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}