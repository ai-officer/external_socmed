import { useState, useCallback } from 'react'

export interface BulkOperationResult {
  id: string
  success: boolean
  error?: string
  newName?: string
}

export function useFileOperations() {
  const [loading, setLoading] = useState(false)

  const renameFile = useCallback(async (fileId: string, newName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ originalName: newName })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to rename file')
      }

      return await response.json()
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteFiles = useCallback(async (fileIds: string[], permanent = false) => {
    setLoading(true)
    try {
      if (fileIds.length === 1) {
        // Single file deletion
        const params = new URLSearchParams()
        if (permanent) params.set('permanent', 'true')
        
        const response = await fetch(`/api/files/${fileIds[0]}?${params}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete file')
        }

        return [{ id: fileIds[0], success: true }]
      } else {
        // Bulk deletion
        const response = await fetch('/api/files/bulk-operations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: 'delete',
            fileIds,
            permanent
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete files')
        }

        const data = await response.json()
        return data.results as BulkOperationResult[]
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const moveFiles = useCallback(async (fileIds: string[], targetFolderId?: string) => {
    setLoading(true)
    try {
      if (fileIds.length === 1) {
        // Single file move
        const response = await fetch(`/api/files/${fileIds[0]}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ folderId: targetFolderId })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to move file')
        }

        return [{ id: fileIds[0], success: true }]
      } else {
        // Bulk move
        const response = await fetch('/api/files/bulk-operations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: 'move',
            fileIds,
            targetFolderId
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to move files')
        }

        const data = await response.json()
        return data.results as BulkOperationResult[]
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const copyFiles = useCallback(async (fileIds: string[], targetFolderId?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/files/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'copy',
          fileIds,
          targetFolderId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to copy files')
      }

      const data = await response.json()
      return data.results as BulkOperationResult[]
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkRename = useCallback(async (fileIds: string[], pattern: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/files/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'rename',
          fileIds,
          renamePattern: pattern
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to rename files')
      }

      const data = await response.json()
      return data.results as BulkOperationResult[]
    } finally {
      setLoading(false)
    }
  }, [])

  const updateFileMetadata = useCallback(async (fileId: string, metadata: {
    description?: string
    tags?: string[]
  }) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update file')
      }

      return await response.json()
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    renameFile,
    deleteFiles,
    moveFiles,
    copyFiles,
    bulkRename,
    updateFileMetadata
  }
}