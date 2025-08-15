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
import { Loader2 } from 'lucide-react'
import { useFolders } from '@/hooks/useFolders'
import { Folder } from '@/types/folder'
// import { useToast } from '@/hooks/use-toast'

const renameFolderSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .refine(
      (name) => !/[\/\\:*?"<>|]/.test(name),
      'Name contains invalid characters'
    )
})

interface RenameFolderDialogProps {
  folder: Folder
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (folder: Folder) => void
}

export function RenameFolderDialog({ 
  folder, 
  open, 
  onOpenChange, 
  onSuccess 
}: RenameFolderDialogProps) {
  const [loading, setLoading] = useState(false)
  const { renameFolder } = useFolders()
  // const { toast } = useToast()

  const form = useForm<z.infer<typeof renameFolderSchema>>({
    resolver: zodResolver(renameFolderSchema),
    defaultValues: {
      name: folder.name
    }
  })

  // Update form when folder changes
  useEffect(() => {
    form.setValue('name', folder.name)
  }, [folder.name, form])

  const onSubmit = async (values: z.infer<typeof renameFolderSchema>) => {
    if (values.name === folder.name) {
      onOpenChange(false)
      return
    }

    try {
      setLoading(true)
      
      const updatedFolder = await renameFolder(folder.id, values.name)
      
      // toast({
      //   title: 'Folder renamed',
      //   description: `Folder renamed to "${values.name}"`
      // })
      
      onSuccess?.(updatedFolder)
      onOpenChange(false)
    } catch (error) {
      // toast({
      //   title: 'Rename failed',
      //   description: error instanceof Error ? error.message : 'Failed to rename folder',
      //   variant: 'destructive'
      // })
      console.error('Failed to rename folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      onOpenChange(false)
      form.reset({ name: folder.name })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      autoFocus
                      disabled={loading}
                      onFocus={(e) => {
                        // Select all text for easy replacement
                        e.target.select()
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Cannot contain: / \ : * ? &quot; &lt; &gt; |
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}