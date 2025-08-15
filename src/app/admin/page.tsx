'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatsWidget } from '@/components/admin/StatsWidget'
import { useAdminStats } from '@/hooks/useAdminStats'
import { formatFileSize, formatNumber } from '@/utils/cn'
import {
  Users,
  Files,
  FolderOpen,
  Tags,
  HardDrive,
  Activity,
  RefreshCw,
  Shield
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [period, setPeriod] = useState('30d')
  const { stats, loading, error, refetch } = useAdminStats(period)

  // Check authorization
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/login')
    return null
  }

  if (session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-64">
          <Header title="Admin Dashboard" subtitle="Admin / Dashboard" />
          <main className="p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-lg">Loading admin dashboard...</div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-64">
          <Header title="Admin Dashboard" subtitle="Admin / Dashboard" />
          <main className="p-8">
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading dashboard data: {error}</p>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const overviewStats = [
    {
      title: 'Total Users',
      value: formatNumber(stats.overview.totalUsers),
      change: `+${stats.overview.newUsersCount} this period`,
      icon: Users,
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Files',
      value: formatNumber(stats.overview.totalFiles),
      change: `+${stats.overview.newFilesCount} this period`,
      icon: Files,
      iconColor: 'text-green-600'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(stats.overview.totalStorageUsed),
      change: 'Across all users',
      icon: HardDrive,
      iconColor: 'text-purple-600'
    },
    {
      title: 'Active Users',
      value: formatNumber(stats.overview.activeUsers),
      change: `In last ${period}`,
      icon: Activity,
      iconColor: 'text-orange-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:ml-64">
        <Header title="Admin Dashboard" subtitle="Admin / Dashboard" />
        
        <main className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold">System Overview</h1>
              </div>
              <div className="flex items-center gap-2">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat, index) => (
                <StatsWidget
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  change={stat.change}
                  icon={stat.icon}
                  iconColor={stat.iconColor}
                />
              ))}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Files className="h-5 w-5" />
                    File Types Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.charts.fileTypeDistribution.map((type, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{type.type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(type.count / Math.max(...stats.charts.fileTypeDistribution.map(t => t.count))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{formatNumber(type.count)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Users by Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topUsers.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatNumber(user.fileCount)} files
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  Popular Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {stats.charts.popularTags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium truncate block">{tag.name}</span>
                        <span className="text-xs text-gray-500">{formatNumber(tag.count)} files</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upload Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Trends (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.charts.uploadTrends.map((trend) => (
                    <div key={trend.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">
                        {new Date(trend.date).toLocaleDateString()}
                      </span>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>{trend.uploads} files</span>
                        <span>{formatFileSize(trend.bytes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}