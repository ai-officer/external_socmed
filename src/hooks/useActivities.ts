import { useState, useEffect, useCallback } from 'react'

export interface Activity {
  id: string
  type: 'upload' | 'folder' | 'tag'
  title: string
  description: string
  time: string
  icon: string
  iconBg: string
}

export function useActivities(limit: number = 10) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/activities?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities
  }
}
