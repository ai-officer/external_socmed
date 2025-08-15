'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FolderPlus, Loader2 } from 'lucide-react'
import { useFolders } from '@/hooks/useFolders'
// import { useToast } from '@/hooks/use-toast'

const createFolderSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .refine(
      (name) => !/[\/\\:*?"<>|]/.test(name),
      'Name contains invalid characters'
    ),
  description: z.string().optional()
})

interface CreateFolderDialogProps {
  parentId?: string
  trigger?: React.ReactNode
  onSuccess?: (folder: any) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateFolderDialog({ 
  parentId, 
  trigger, 
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: CreateFolderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { createFolder } = useFolders()
  // const { toast } = useToast()

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const form = useForm<z.infer<typeof createFolderSchema>>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  })

  const onSubmit = async (values: z.infer<typeof createFolderSchema>) => {
    try {
      setLoading(true)
      
      const folder = await createFolder({
        name: values.name,
        description: values.description || undefined,
        parentId
      })
      
      // toast({
      //   title: 'Folder created',
      //   description: `"${values.name}" has been created successfully.`
      // })
      
      onSuccess?.(folder)
      setOpen(false)
      form.reset()
    } catch (error) {
      // toast({
      //   title: 'Error',
      //   description: error instanceof Error ? error.message : 'Failed to create folder',
      //   variant: 'destructive'
      // })
      console.error('Failed to create folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      setOpen(false)
      form.reset()
    } else if (newOpen) {
      setOpen(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
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
                      placeholder="Enter folder name" 
                      {...field} 
                      autoFocus
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Cannot contain: / \ : * ? &quot; &lt; &gt; |
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter folder description"
                      rows={3}
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
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
                    Creating...
                  </>
                ) : (
                  'Create Folder'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}