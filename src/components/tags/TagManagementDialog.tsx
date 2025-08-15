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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Palette, Loader2, Hash } from 'lucide-react'
import { useTags } from '@/hooks/useTags'
import { cn } from '@/utils/cn'

const tagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Tag name can only contain letters, numbers, hyphens, and underscores'),
  description: z.string().max(200, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
})

interface TagManagementDialogProps {
  open: boolean
  onClose: () => void
  tag?: any // For editing existing tag
  onSuccess?: (tag: any) => void
}

const predefinedColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280',
  '#14B8A6', '#F472B6', '#A855F7', '#22C55E', '#EAB308'
]

export function TagManagementDialog({
  open,
  onClose,
  tag,
  onSuccess
}: TagManagementDialogProps) {
  const [loading, setLoading] = useState(false)
  const { createTag, updateTag } = useTags()

  const form = useForm<z.infer<typeof tagSchema>>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      description: '',
      color: predefinedColors[0]
    }
  })

  // Reset form when tag changes
  useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name,
        description: tag.description || '',
        color: tag.color
      })
    } else {
      form.reset({
        name: '',
        description: '',
        color: predefinedColors[0]
      })
    }
  }, [tag, form])

  const onSubmit = async (values: z.infer<typeof tagSchema>) => {
    try {
      setLoading(true)
      
      let result
      if (tag) {
        result = await updateTag(tag.id, values)
      } else {
        result = await createTag(values)
      }
      
      onSuccess?.(result.tag)
      onClose()
      form.reset()
    } catch (error) {
      console.error('Failed to save tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleColorChange = (color: string) => {
    form.setValue('color', color)
  }

  const selectedColor = form.watch('color')

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {tag ? 'Edit Tag' : 'Create New Tag'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tag Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter tag name" 
                      {...field} 
                      autoFocus
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Use letters, numbers, hyphens, and underscores only
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this tag is used for..."
                      rows={3}
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Selection */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Color Preview */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-200"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <Badge
                          className="text-white"
                          style={{ backgroundColor: selectedColor }}
                        >
                          {form.watch('name') || 'Sample Tag'}
                        </Badge>
                      </div>

                      {/* Predefined Colors */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Choose a color
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleColorChange(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                selectedColor === color
                                  ? "border-gray-900 scale-110"
                                  : "border-gray-200 hover:border-gray-400"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Custom Color */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Or enter custom hex color
                        </label>
                        <Input
                          type="text"
                          placeholder="#3B82F6"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value.match(/^#[0-9A-Fa-f]{0,6}$/) || value === '') {
                              field.onChange(value)
                            }
                          }}
                          disabled={loading}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {tag ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  tag ? 'Update Tag' : 'Create Tag'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}