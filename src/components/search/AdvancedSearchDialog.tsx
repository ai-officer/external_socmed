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
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagFilter } from '@/components/filters/TagFilter'
import { FileTypeFilter } from '@/components/filters/FileTypeFilter'
import { useFolders } from '@/hooks/useFolders'
import { 
  Search, 
  Calendar,
  HardDrive,
  FolderOpen,
  Sliders
} from 'lucide-react'
import { formatFileSize } from '@/utils/cn'

const advancedSearchSchema = z.object({
  query: z.string(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  type: z.enum(['all', 'image', 'video', 'document']).default('all'),
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['relevance', 'name', 'createdAt', 'size']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

interface AdvancedSearchDialogProps {
  open: boolean
  onClose: () => void
  onSearch: (filters: any) => void
  initialValues?: Partial<z.infer<typeof advancedSearchSchema>>
}

export function AdvancedSearchDialog({
  open,
  onClose,
  onSearch,
  initialValues = {}
}: AdvancedSearchDialogProps) {
  const { folders } = useFolders()
  const [showSizeFilter, setShowSizeFilter] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)

  const form = useForm<z.infer<typeof advancedSearchSchema>>({
    resolver: zodResolver(advancedSearchSchema),
    defaultValues: {
      query: '',
      type: 'all',
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
      ...initialValues
    }
  })

  const onSubmit = (values: z.infer<typeof advancedSearchSchema>) => {
    // Filter out empty values
    const cleanFilters = Object.fromEntries(
      Object.entries(values).filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'string') return value.trim() !== '' && value !== 'all'
        return value !== undefined && value !== null
      })
    )

    onSearch(cleanFilters)
    onClose()
  }

  const clearFilters = () => {
    form.reset({
      query: form.getValues('query'), // Keep the query
      type: 'all',
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    })
  }

  // Common file sizes for quick selection
  const commonSizes = [
    { label: '< 1 MB', maxSize: 1024 * 1024 },
    { label: '1-10 MB', minSize: 1024 * 1024, maxSize: 10 * 1024 * 1024 },
    { label: '10-100 MB', minSize: 10 * 1024 * 1024, maxSize: 100 * 1024 * 1024 },
    { label: '> 100 MB', minSize: 100 * 1024 * 1024 },
  ]

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Advanced Search
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Search Query */}
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Query</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        {...field}
                        placeholder="Enter search terms..."
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">File Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FileTypeFilter
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <TagFilter
                        selectedTags={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </CardContent>
              </Card>

              {/* Folder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Folder Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="folderId"
                    render={({ field }) => (
                      <select
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All folders</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Sorting */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sort Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FormField
                    control={form.control}
                    name="sortBy"
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sort by
                        </label>
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="relevance">Relevance</option>
                          <option value="name">Name</option>
                          <option value="createdAt">Date Created</option>
                          <option value="size">File Size</option>
                        </select>
                      </div>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order
                        </label>
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="desc">Descending</option>
                          <option value="asc">Ascending</option>
                        </select>
                      </div>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSizeFilter(!showSizeFilter)}
                className="flex items-center gap-2"
              >
                <HardDrive className="h-4 w-4" />
                File Size Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Date Filter
              </Button>
            </div>

            {/* File Size Filter */}
            {showSizeFilter && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    File Size
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Size Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Filters
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {commonSizes.map((size, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            form.setValue('minSize', size.minSize)
                            form.setValue('maxSize', size.maxSize)
                          }}
                        >
                          {size.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Size Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minSize"
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Size (bytes)
                          </label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxSize"
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Size (bytes)
                          </label>
                          <Input
                            type="number"
                            placeholder="No limit"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date Filter */}
            {showDateFilter && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                          </label>
                          <Input
                            type="date"
                            {...field}
                          />
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                          </label>
                          <Input
                            type="date"
                            {...field}
                          />
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Search
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}