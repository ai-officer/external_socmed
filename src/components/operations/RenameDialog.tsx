'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFileOperations } from '@/hooks/useFileOperations'
import { Loader2 } from 'lucide-react'
import { File } from '@/types/file'

const renameSchema = z.object({
  filename: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .refine(
      (name) => !/[\/\\:*?"<>|]/.test(name),
      'Name contains invalid characters'
    )
})

interface RenameDialogProps {
  file: File
  open: boolean
  onClose: () => void
  onSuccess?: (updatedFile: File) => void
}

export function RenameDialog({ file, open, onClose, onSuccess }: RenameDialogProps) {
  const [loading, setLoading] = useState(false)
  const { renameFile } = useFileOperations()

  const form = useForm<z.infer<typeof renameSchema>>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      filename: file.originalName
    }
  })

  // Update form when file changes
  useEffect(() => {
    if (file) {
      form.setValue('filename', file.originalName)
    }
  }, [file, form])

  const onSubmit = async (values: z.infer<typeof renameSchema>) => {
    if (values.filename === file.originalName) {
      onClose()
      return
    }

    try {
      setLoading(true)
      
      const result = await renameFile(file.id, values.filename)
      
      // TODO: Show success toast
      console.log(`File renamed to "${values.filename}"`)
      
      onSuccess?.(result.file)
      onClose()
    } catch (error) {
      // TODO: Show error toast
      console.error('Rename failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      onClose()
      form.reset({ filename: file.originalName })
    }
  }

  // Get file extension for helper text
  const fileExtension = file.originalName.substring(file.originalName.lastIndexOf('.'))
  const nameWithoutExtension = file.originalName.substring(0, file.originalName.lastIndexOf('.'))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Rename {file.isImage ? 'Image' : file.isVideo ? 'Video' : 'File'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="filename"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      autoFocus
                      disabled={loading}
                      onFocus={(e) => {
                        // Select filename without extension for easier editing
                        if (fileExtension && fileExtension.length > 1) {
                          const lastDot = e.target.value.lastIndexOf('.')
                          if (lastDot > 0) {
                            e.target.setSelectionRange(0, lastDot)
                          }
                        } else {
                          e.target.select()
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Cannot contain: / \ : * ? &quot; &lt; &gt; |
                    {fileExtension && fileExtension.length > 1 && (
                      <span className="block mt-1 text-xs">
                        Current extension: {fileExtension}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm">
                <p className="text-gray-600 dark:text-gray-400 mb-2">File details:</p>
                <div className="flex items-center gap-2 mb-1">
                  {file.isImage && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      📷 Image
                    </span>
                  )}
                  {file.isVideo && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      🎥 Video
                    </span>
                  )}
                  {file.isDocument && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      📄 Document
                    </span>
                  )}
                  {!file.isImage && !file.isVideo && !file.isDocument && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      📁 File
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Type: {file.mimeType}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Renaming...
                  </>
                ) : (
                  'Rename'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}