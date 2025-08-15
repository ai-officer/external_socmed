'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  FolderOpen, 
  Tag, 
  HardDrive,
  Upload,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react'
import { useAnalytics, formatBytes, formatNumber, type AnalyticsData } from '@/hooks/useAnalytics'

interface AnalyticsOverviewProps {
  timeframe?: '7d' | '30d' | '90d' | '1y'
  onTimeframeChange?: (timeframe: '7d' | '30d' | '90d' | '1y') => void
}

export function AnalyticsOverview({ 
  timeframe = '7d', 
  onTimeframeChange 
}: AnalyticsOverviewProps) {
  const { data, loading, error, refresh } = useAnalytics(timeframe, 'overview')
  const [refreshing, setRefreshing] = useState(false)

  const analyticsData = data as AnalyticsData | null

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setTimeout(() => setRefreshing(false), 500)
  }

  const timeframeOptions = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: '1y', label: '1 year' }
  ] as const

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading analytics: {error}</p>
            <Button onClick={handleRefresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analyticsData) return null

  const { overview, fileTypes, uploadTrend, topTags, topFolders } = analyticsData

  // Calculate file type percentages
  const totalFiles = Object.values(fileTypes || {}).reduce((sum, type) => sum + type.count, 0)
  const fileTypePercentages = Object.entries(fileTypes || {}).map(([category, stats]) => ({
    category,
    count: stats.count,
    size: stats.size,
    percentage: totalFiles > 0 ? (stats.count / totalFiles) * 100 : 0
  })).sort((a, b) => b.count - a.count)

  // Calculate trend
  const currentPeriodUploads = (uploadTrend || []).reduce((sum, day) => sum + day.count, 0)
  const avgDailyUploads = uploadTrend?.length ? currentPeriodUploads / uploadTrend.length : 0

  const getColorForCategory = (category: string) => {
    const colors = {
      images: 'bg-blue-500',
      videos: 'bg-green-500', 
      documents: 'bg-purple-500',
      pdf: 'bg-red-500',
      audio: 'bg-yellow-500',
      spreadsheets: 'bg-teal-500',
      presentations: 'bg-orange-500',
      other: 'bg-gray-500'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <Badge variant="secondary">{timeframe}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 rounded-md">
            {timeframeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeframe === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTimeframeChange?.(option.value)}
                className="rounded-none first:rounded-l-md last:rounded-r-md"
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-2xl font-bold">{formatNumber(overview.totalFiles)}</p>
                <p className="text-xs text-gray-500">
                  {overview.recentUploads} uploaded recently
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold">{formatBytes(overview.storageUsed)}</p>
                <p className="text-xs text-gray-500">
                  Avg: {formatBytes(overview.storageUsed / Math.max(overview.totalFiles, 1))} per file
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Folders</p>
                <p className="text-2xl font-bold">{formatNumber(overview.totalFolders)}</p>
                <p className="text-xs text-gray-500">
                  {formatNumber(overview.totalFiles / Math.max(overview.totalFolders, 1))} files/folder
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Tag className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tags</p>
                <p className="text-2xl font-bold">{formatNumber(overview.totalTags)}</p>
                <p className="text-xs text-gray-500">
                  {avgDailyUploads.toFixed(1)} uploads/day
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              File Types Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fileTypePercentages.length > 0 ? (
                fileTypePercentages.slice(0, 6).map(({ category, count, size, percentage }) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getColorForCategory(category)}`} />
                      <span className="text-sm font-medium capitalize">{category}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600">{count} files</span>
                      <span className="text-gray-500">({formatBytes(size)})</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No files uploaded yet</p>
                  <p className="text-sm">Upload some files to see the distribution</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Most Used Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(topTags || []).length > 0 ? (
                topTags.slice(0, 8).map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                    <Badge variant="secondary">{tag.fileCount} files</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No tags created yet</p>
                  <p className="text-sm">Create tags to organize your files</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Upload Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(uploadTrend || []).length > 0 ? (
            <>
              <div className="h-64 flex items-end justify-between gap-1">
                {uploadTrend.map((day, index) => {
                  const maxUploads = Math.max(...uploadTrend.map(d => d.count))
                  const height = maxUploads > 0 ? (day.count / maxUploads) * 100 : 0
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="bg-blue-500 w-full rounded-t-sm transition-all hover:bg-blue-600"
                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
                        title={`${day.count} uploads on ${new Date(day.date).toLocaleDateString()}`}
                      />
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(day.date).toLocaleDateString('en', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>Total uploads: {currentPeriodUploads}</span>
                <span>Daily average: {avgDailyUploads.toFixed(1)}</span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No upload activity yet</p>
              <p className="text-sm">Upload files to see activity trends</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}