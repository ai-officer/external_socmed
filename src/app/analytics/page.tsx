'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  PieChart,
  Download,
  Calendar,
  Clock,
  HardDrive,
  ArrowUpDown
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview'
import { useAnalytics, formatBytes, formatNumber, type FileAnalytics } from '@/hooks/useAnalytics'

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'files'>('overview')

  const { data: fileData, loading: fileLoading } = useAnalytics(timeframe, 'files')
  const fileAnalytics = fileData as FileAnalytics | null

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view analytics</h1>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Go to login
          </a>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'files', label: 'File Analytics', icon: FileText }
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:ml-64">
        <Header title="Analytics" subtitle="Pages / Analytics" />
        
        <main className="p-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex border border-gray-300 rounded-lg p-1 bg-white w-fit">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <AnalyticsOverview 
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">File Analytics</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{timeframe}</Badge>
                  <div className="flex border border-gray-300 rounded-md">
                    {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
                      <Button
                        key={tf}
                        variant={timeframe === tf ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTimeframe(tf)}
                        className="rounded-none first:rounded-l-md last:rounded-r-md"
                      >
                        {tf === '7d' ? '7 days' : tf === '30d' ? '30 days' : tf === '90d' ? '90 days' : '1 year'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {fileLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : fileAnalytics ? (
                <>
                  {/* File Size Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          File Size Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(fileAnalytics.sizeDistribution).map(([range, count]) => {
                            const total = Object.values(fileAnalytics.sizeDistribution).reduce((a, b) => a + b, 0)
                            const percentage = total > 0 ? (count / total) * 100 : 0
                            
                            const getRangeLabel = (range: string) => {
                              switch (range) {
                                case 'small': return '< 1 MB'
                                case 'medium': return '1-10 MB'
                                case 'large': return '10-100 MB'
                                case 'huge': return '> 100 MB'
                                default: return range
                              }
                            }

                            const getColor = (range: string) => {
                              switch (range) {
                                case 'small': return 'bg-green-500'
                                case 'medium': return 'bg-blue-500'
                                case 'large': return 'bg-orange-500'
                                case 'huge': return 'bg-red-500'
                                default: return 'bg-gray-500'
                              }
                            }

                            return (
                              <div key={range} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${getColor(range)}`} />
                                  <span className="text-sm font-medium">{getRangeLabel(range)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-gray-600">{count} files</span>
                                  <span className="font-medium">{percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* File Extensions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Top File Extensions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(fileAnalytics.extensions).slice(0, 10).map(([ext, count]) => {
                            const total = Object.values(fileAnalytics.extensions).reduce((a, b) => a + b, 0)
                            const percentage = total > 0 ? (count / total) * 100 : 0
                            
                            return (
                              <div key={ext} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                                    .{ext}
                                  </code>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-gray-600">{count} files</span>
                                  <span className="font-medium">{percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Upload Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Upload Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-end justify-between gap-1">
                        {fileAnalytics.timeline.map((day, index) => {
                          const maxUploads = Math.max(...fileAnalytics.timeline.map(d => d.count))
                          const height = maxUploads > 0 ? (day.count / maxUploads) * 100 : 0
                          
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div
                                className="bg-blue-500 w-full rounded-t-sm transition-all hover:bg-blue-600"
                                style={{ height: `${height}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
                                title={`${day.count} uploads, ${formatBytes(day.size)} on ${new Date(day.date).toLocaleDateString()}`}
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
                        <span>
                          Total: {fileAnalytics.timeline.reduce((sum, day) => sum + day.count, 0)} files
                        </span>
                        <span>
                          {formatBytes(fileAnalytics.timeline.reduce((sum, day) => sum + day.size, 0))} uploaded
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Largest Files */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Largest Files
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {fileAnalytics.largestFiles.map((file, index) => (
                          <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <div>
                                <p className="font-medium text-sm truncate max-w-xs">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(file.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">
                                {formatBytes(file.size)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {file.type.split('/')[0]}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No file data available for the selected timeframe</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}