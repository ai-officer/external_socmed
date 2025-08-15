import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RotateCcw, X, Loader2 } from 'lucide-react'
import { UploadItem } from '@/types/upload'
import { cn } from '@/utils/cn'

interface UploadProgressProps {
  item: UploadItem
  onRetry: (id: string) => void
  onRemove: (id: string) => void
  onCancel?: (id: string) => void
}

export function UploadProgress({ item, onRetry, onRemove, onCancel }: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return null
    }
  }

  const getStatusBadge = () => {
    const variants = {
      pending: 'secondary',
      uploading: 'default',
      completed: 'default',
      error: 'destructive'
    } as const

    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      uploading: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    }

    return (
      <Badge variant={variants[item.status]} className={colors[item.status]}>
        {item.status}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
      {getStatusIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium truncate">{item.file.name}</p>
          {getStatusBadge()}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{formatFileSize(item.file.size)}</span>
          {item.status === 'uploading' && (
            <span>
              {item.progress}% {item.uploadPhase && `• ${item.uploadPhase}`}
            </span>
          )}
        </div>
        
        {item.status === 'uploading' && (
          <Progress value={item.progress} className="h-2" />
        )}
        
        {item.error && (
          <p className="text-xs text-red-600 mt-1">{item.error}</p>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {item.status === 'error' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRetry(item.id)}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
        
        {item.status === 'uploading' && onCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(item.id)}
          >
            Cancel
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}