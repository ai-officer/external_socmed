'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  FolderOpen, 
  Upload as UploadIcon, 
  Users,
  TrendingUp,
  Activity,
  PieChart,
  BarChart3,
  Settings
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview'
import RecentActivity from '@/components/dashboard/RecentActivity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('7d')

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Content Management Tracker
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            A modern content management system with advanced search and organization features
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">
              🚀 Phase 1 Complete!
            </h2>
            <p className="text-blue-800 mb-4">
              ✅ Next.js with TypeScript<br/>
              ✅ Database with Prisma<br/>
              ✅ Authentication with NextAuth<br/>
              ✅ Cloudinary Integration
            </p>
          </div>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:ml-64">
        <Header title="Main Dashboard" subtitle="Pages / Dashboard" />
        
        <main className="p-8">
          {/* Analytics Overview */}
          <AnalyticsOverview 
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />

          {/* Quick Actions */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link href="/files">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <FileText className="h-6 w-6" />
                      <span>Browse Files</span>
                    </Button>
                  </Link>
                  <Link href="/folders">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <FolderOpen className="h-6 w-6" />
                      <span>Manage Folders</span>
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Activity className="h-6 w-6" />
                      <span>Search Files</span>
                    </Button>
                  </Link>
                  <Link href="/tags">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Settings className="h-6 w-6" />
                      <span>Manage Tags</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <RecentActivity />
          </div>
        </main>
      </div>
    </div>
  )
}