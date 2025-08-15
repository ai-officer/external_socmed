import { useState, useEffect } from 'react'

interface Tag {
  id: string
  name: string
  color: string
  description?: string
  fileCount: number
  recentFiles?: any[]
}

export function useTags(includeStats = false) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (includeStats) params.set('stats', 'true')
      
      const response = await fetch(`/api/tags?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tags')
      
      const data = await response.json()
      setTags(data.tags)
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const createTag = async (tagData: {
    name: string
    color?: string
    description?: string
  }) => {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tagData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create tag')
    }

    const result = await response.json()
    setTags(prev => [...prev, result.tag])
    return result
  }

  const updateTag = async (id: string, tagData: {
    name?: string
    color?: string
    description?: string
  }) => {
    const response = await fetch(`/api/tags/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tagData)
    })

    if (!response.ok) {
      throw new Error('Failed to update tag')
    }

    const result = await response.json()
    setTags(prev => prev.map(tag => tag.id === id ? result.tag : tag))
    return result
  }

  const deleteTag = async (id: string) => {
    const response = await fetch(`/api/tags/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete tag')
    }

    setTags(prev => prev.filter(tag => tag.id !== id))
  }

  const assignTagsToFile = async (fileId: string, tagIds: string[]) => {
    const response = await fetch(`/api/files/${fileId}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tagIds })
    })

    if (!response.ok) {
      throw new Error('Failed to assign tags')
    }

    return await response.json()
  }

  useEffect(() => {
    fetchTags()
  }, [includeStats])

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    assignTagsToFile,
    refetch: fetchTags
  }
}