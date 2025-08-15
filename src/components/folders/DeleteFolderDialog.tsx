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
import { Loader2 } from 'lucide-react'
import { useFolders } from '@/hooks/useFolders'
import { Folder } from '@/types/folder'
// import { useToast } from '@/hooks/use-toast'

interface DeleteFolderDialogProps {
  folder: Folder
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteFolderDialog({ 
  folder, 
  open, 
  onOpenChange, 
  onSuccess 
}: DeleteFolderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [force, setForce] = useState(false)
  const { deleteFolder } = useFolders()
  // const { toast } = useToast()

  const hasContent = folder._count.files > 0 || folder._count.children > 0
  const totalItems = folder._count.files + folder._count.children

  const handleDelete = async () => {
    try {
      setLoading(true)
      
      await deleteFolder(folder.id, force)
      
      // toast({
      //   title: 'Folder deleted',
      //   description: `"${folder.name}" has been deleted successfully.`
      // })
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      // toast({
      //   title: 'Delete failed',
      //   description: error instanceof Error ? error.message : 'Failed to delete folder',
      //   variant: 'destructive'
      // })
      console.error('Failed to delete folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      onOpenChange(false)
      setForce(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{folder.name}&quot;?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          {hasContent && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                This folder contains:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {folder._count.files > 0 && (
                  <li>{folder._count.files} file{folder._count.files > 1 ? 's' : ''}</li>
                )}
                {folder._count.children > 0 && (
                  <li>{folder._count.children} subfolder{folder._count.children > 1 ? 's' : ''}</li>
                )}
              </ul>
            </div>
          )}
          
          {hasContent && force && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <div className="text-red-800 dark:text-red-200 text-sm font-medium">
                ⚠️ All contents will be permanently deleted. This action cannot be undone.
              </div>
            </div>
          )}
          
          {!hasContent && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone.
            </div>
          )}
        </div>

        {hasContent && (
          <div className="flex items-start space-x-2 py-4">
            <Checkbox
              id="force-delete"
              checked={force}
              onCheckedChange={(checked) => setForce(checked as boolean)}
              disabled={loading}
            />
            <label htmlFor="force-delete" className="text-sm leading-relaxed">
              I understand that all {totalItems} item{totalItems > 1 ? 's' : ''} in this folder will be permanently deleted
            </label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || (hasContent && !force)}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Folder'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}