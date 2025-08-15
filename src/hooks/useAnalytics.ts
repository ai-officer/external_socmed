import { useState, useEffect, useCallback } from 'react'

export interface AnalyticsOverview {
  totalFiles: number
  totalFolders: number
  totalTags: number
  storageUsed: number
  recentUploads: number
}

export interface FileTypeStats {
  [category: string]: {
    count: number
    size: number
  }
}

export interface UploadTrendData {
  date: string
  count: number
  size: number
}

export interface TopTag {
  id: string
  name: string
  color: string
  fileCount: number
}

export interface TopFolder {
  id: string
  name: string
  fileCount: number
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  fileTypes: FileTypeStats
  uploadTrend: UploadTrendData[]
  topTags: TopTag[]
  topFolders: TopFolder[]
}

export interface FileAnalytics {
  timeline: UploadTrendData[]
  sizeDistribution: Record<string, number>
  extensions: Record<string, number>
  largestFiles: Array<{
    id: string
    name: string
    size: number
    type: string
    createdAt: string
  }>
}

export function useAnalytics(timeframe: '7d' | '30d' | '90d' | '1y' = '7d', type: 'overview' | 'files' = 'overview') {
  const [data, setData] = useState<AnalyticsData | FileAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        timeframe,
        type
      })
      
      const response = await fetch(`/api/analytics?${params}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Analytics API error:', response.status, errorText)
        throw new Error(`Failed to fetch analytics: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [timeframe, type])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const refresh = useCallback(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    data,
    loading,
    error,
    refresh
  }
}

// Utility functions for formatting
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function getChangePercentage(current: number, previous: number): string {
  if (previous === 0) return '+100%'
  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}