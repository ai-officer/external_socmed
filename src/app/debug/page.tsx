'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [authResult, setAuthResult] = useState<any>(null)
  const [analyticsResult, setAnalyticsResult] = useState<any>(null)
  const [filesResult, setFilesResult] = useState<any>(null)

  const testAuth = async () => {
    try {
      const response = await fetch('/api/test-auth')
      const data = await response.json()
      setAuthResult(data)
    } catch (error) {
      setAuthResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const testAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      setAnalyticsResult(data)
    } catch (error) {
      setAnalyticsResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const testFiles = async () => {
    try {
      const response = await fetch('/api/files')
      const data = await response.json()
      setFilesResult(data)
    } catch (error) {
      setFilesResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

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
          <h1 className="text-2xl font-bold mb-4">Please sign in to debug</h1>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Go to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:ml-64">
        <Header title="Debug API" subtitle="Pages / Debug" />
        
        <main className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Auth Test */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Auth Test</CardTitle>
                  <Button onClick={testAuth}>Test Auth</Button>
                </div>
              </CardHeader>
              <CardContent>
                {authResult && (
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(authResult, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Analytics Test */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Analytics Test</CardTitle>
                  <Button onClick={testAnalytics}>Test Analytics</Button>
                </div>
              </CardHeader>
              <CardContent>
                {analyticsResult && (
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(analyticsResult, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Files Test */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Files Test</CardTitle>
                  <Button onClick={testFiles}>Test Files</Button>
                </div>
              </CardHeader>
              <CardContent>
                {filesResult && (
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(filesResult, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  )
}