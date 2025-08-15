import { useState, useEffect, useCallback } from 'react'
import { Folder, CreateFolderData, UpdateFolderData } from '@/types/folder'

export function useFolders(parentId?: string, fetchAll = false) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (fetchAll) {
        // Fetch all folders for the user
        params.set('all', 'true')
      } else if (parentId) {
        // Fetch folders for specific parent
        params.set('parentId', parentId)
      }
      // If neither fetchAll nor parentId, fetch root folders (default behavior)
      
      const response = await fetch(`/api/folders?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch folders')
      }
      
      const data = await response.json()
      setFolders(data.folders)
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [parentId, fetchAll])

  const createFolder = useCallback(async (data: CreateFolderData) => {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create folder')
    }

    const result = await response.json()
    
    // Add to local state if it belongs to current parent
    if ((data.parentId || null) === (parentId || null)) {
      setFolders(prev => [...prev, result.folder])
    }
    
    return result.folder
  }, [parentId])

  const updateFolder = useCallback(async (id: string, data: UpdateFolderData) => {
    const response = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update folder')
    }

    const result = await response.json()
    
    // Update local state
    setFolders(prev => prev.map(f => f.id === id ? result.folder : f))
    
    return result.folder
  }, [])

  const deleteFolder = useCallback(async (id: string, force = false) => {
    const params = new URLSearchParams()
    if (force) params.set('force', 'true')
    
    const response = await fetch(`/api/folders/${id}?${params}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete folder')
    }

    // Remove from local state
    setFolders(prev => prev.filter(f => f.id !== id))
  }, [])

  const moveFolder = useCallback(async (id: string, newParentId?: string) => {
    return updateFolder(id, { parentId: newParentId })
  }, [updateFolder])

  const renameFolder = useCallback(async (id: string, newName: string) => {
    return updateFolder(id, { name: newName })
  }, [updateFolder])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  return {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    renameFolder,
    refetch: fetchFolders
  }
}

// Hook to get folder path (breadcrumb)
export function useFolderPath(folderId?: string) {
  const [folderPath, setFolderPath] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!folderId) {
      setFolderPath([])
      return
    }

    const fetchPath = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/folders/${folderId}`)
        if (!response.ok) return

        const data = await response.json()
        const folder = data.folder

        // Build path by following parent chain
        const path: Folder[] = []
        let currentFolder = folder

        while (currentFolder) {
          path.unshift(currentFolder)
          
          if (currentFolder.parent) {
            // Fetch parent folder
            const parentResponse = await fetch(`/api/folders/${currentFolder.parent.id}`)
            if (parentResponse.ok) {
              const parentData = await parentResponse.json()
              currentFolder = parentData.folder
            } else {
              break
            }
          } else {
            break
          }
        }

        setFolderPath(path)
      } catch (error) {
        console.error('Error fetching folder path:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPath()
  }, [folderId])

  return { folderPath, loading }
}