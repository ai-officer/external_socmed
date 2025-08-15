'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useFileOperations } from '@/hooks/useFileOperations'
import { Loader2 } from 'lucide-react'
import { File } from '@/types/file'

interface DeleteDialogProps {
  files: File[]
  open: boolean
  onClose: () => void
  onSuccess?: (deletedFileIds: string[]) => void
}

export function DeleteDialog({ files, open, onClose, onSuccess }: DeleteDialogProps) {
  const [permanent, setPermanent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { deleteFiles } = useFileOperations()

  const handleDelete = async () => {
    try {
      setLoading(true)
      
      const fileIds = files.map(f => f.id)
      const results = await deleteFiles(fileIds, permanent)
      
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      if (successful.length > 0) {
        onSuccess?.(successful.map(r => r.id))
        // TODO: Show success toast
        console.log(`${successful.length} file${successful.length > 1 ? 's' : ''} deleted successfully`)
      }

      if (failed.length > 0) {
        // TODO: Show error toast
        console.error(`Failed to delete ${failed.length} file${failed.length > 1 ? 's' : ''}`)
      }

      onClose()
    } catch (error) {
      // TODO: Show error toast
      console.error('Delete operation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fileCount = files.length
  const isMultiple = fileCount > 1

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {isMultiple ? `${fileCount} files` : 'file'}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {isMultiple ? (
                <p>Are you sure you want to delete these {fileCount} files?</p>
              ) : (
                <p>Are you sure you want to delete &quot;{files[0]?.originalName}&quot;?</p>
              )}
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Total size: {formatFileSize(totalSize)}</p>
                {isMultiple && (
                  <div className="mt-2">
                    <p className="font-medium">Files to delete:</p>
                    <ul className="mt-1 max-h-32 overflow-y-auto text-xs space-y-1">
                      {files.slice(0, 5).map(file => (
                        <li key={file.id} className="truncate">• {file.originalName}</li>
                      ))}
                      {files.length > 5 && (
                        <li className="text-gray-500">... and {files.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  {!permanent 
                    ? "Files will be moved to trash and can be restored later."
                    : "⚠️ This action cannot be undone. Files will be permanently deleted from storage."
                  }
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="permanent"
            checked={permanent}
            onCheckedChange={(checked) => setPermanent(checked as boolean)}
            disabled={loading}
          />
          <label htmlFor="permanent" className="text-sm leading-relaxed cursor-pointer">
            Delete permanently (cannot be undone)
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${isMultiple ? 'Files' : 'File'}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}