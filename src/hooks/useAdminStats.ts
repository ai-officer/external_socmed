import { useState, useEffect } from 'react'

interface AdminStats {
  overview: {
    totalUsers: number
    activeUsers: number
    totalFiles: number
    totalFolders: number
    totalTags: number
    newFilesCount: number
    newUsersCount: number
    totalStorageUsed: number
    period: string
  }
  charts: {
    uploadTrends: Array<{
      date: string
      uploads: number
      bytes: number
    }>
    fileTypeDistribution: Array<{
      type: string
      count: number
    }>
    popularTags: Array<{
      id: string
      name: string
      color: string
      count: number
    }>
  }
  topUsers: Array<{
    id: string
    name: string
    email: string
    fileCount: number
  }>
}

export function useAdminStats(period: string = '30d') {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/stats?period=${period}`)
      if (!response.ok) {
        throw new Error('Failed to fetch admin statistics')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [period])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}