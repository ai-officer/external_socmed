import { useState, useEffect, useCallback } from 'react'
import { File, FileQuery, FilePagination } from '@/types/file'

interface UseFilesOptions extends FileQuery {
  autoLoad?: boolean
}

export function useFiles(options: UseFilesOptions = {}) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<FilePagination | null>(null)

  const {
    autoLoad = true,
    folderId,
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = 'desc',
    search,
    type = 'all',
    tags,
    minSize,
    maxSize,
    startDate,
    endDate
  } = options

  const fetchFiles = useCallback(async (params: Partial<FileQuery> = {}) => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      
      // Merge options with params
      const finalParams = {
        folderId,
        page,
        limit,
        sort,
        order,
        search,
        type,
        tags: tags && tags.length > 0 ? tags.join(',') : undefined,
        minSize,
        maxSize,
        startDate,
        endDate,
        ...params
      }

      // Build query string
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.set(key, String(value))
        }
      })

      console.log('useFiles: Fetching files with URL:', `/api/files?${queryParams}`)
      console.log('useFiles: Final params:', finalParams)
      
      const response = await fetch(`/api/files?${queryParams}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Files API error:', response.status, errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `Failed to fetch files: ${response.status}`)
      }

      const data = await response.json()
      console.log('useFiles: API response data:', data)
      
      if (params.page && params.page > 1) {
        // Append for pagination
        setFiles(prev => [...prev, ...data.files])
      } else {
        // Replace for new search/filter
        setFiles(data.files)
      }
      
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [folderId, page, limit, sort, order, search, type, tags, minSize, maxSize, startDate, endDate])

  const loadMore = useCallback(() => {
    if (pagination?.hasNext) {
      fetchFiles({ page: pagination.page + 1 })
    }
  }, [fetchFiles, pagination])

  const refresh = useCallback(() => {
    // Force a fresh fetch by clearing current files and fetching from page 1
    setFiles([])
    fetchFiles({ page: 1 })
  }, [fetchFiles])

  const updateFile = useCallback((fileId: string, updates: Partial<File>) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ))
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const addFile = useCallback((file: File) => {
    setFiles(prev => [file, ...prev])
    
    // Update pagination count
    if (pagination) {
      setPagination(prev => prev ? {
        ...prev,
        total: prev.total + 1
      } : null)
    }
  }, [pagination])

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      fetchFiles()
    }
  }, [fetchFiles, autoLoad])

  return {
    files,
    loading,
    error,
    pagination,
    fetchFiles,
    loadMore,
    refresh,
    updateFile,
    removeFile,
    addFile,
    hasMore: pagination?.hasNext || false
  }
}

// Hook for file selection
export function useFileSelection() {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const selectFile = useCallback((file: File) => {
    setSelectedFiles(prev => new Set([...prev, file.id]))
  }, [])

  const deselectFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })
  }, [])

  const toggleFile = useCallback((file: File) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(file.id)) {
        newSet.delete(file.id)
      } else {
        newSet.add(file.id)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback((files: File[]) => {
    setSelectedFiles(new Set(files.map(f => f.id)))
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedFiles(new Set())
  }, [])

  const isSelected = useCallback((fileId: string) => {
    return selectedFiles.has(fileId)
  }, [selectedFiles])

  const getSelectedFiles = useCallback((files: File[]) => {
    return files.filter(f => selectedFiles.has(f.id))
  }, [selectedFiles])

  return {
    selectedFiles: Array.from(selectedFiles),
    selectedCount: selectedFiles.size,
    selectFile,
    deselectFile,
    toggleFile,
    selectAll,
    deselectAll,
    isSelected,
    getSelectedFiles
  }
}