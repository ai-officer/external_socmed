'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useFolders } from '@/hooks/useFolders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function TestFoldersPage() {
  const { data: session, status } = useSession()
  const [newFolderName, setNewFolderName] = useState('')
  const { folders, loading, createFolder, refetch } = useFolders(undefined, true)

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      await createFolder({ name: newFolderName.trim() })
      setNewFolderName('')
      // Manually refetch to ensure we see the new folder
      await refetch()
    } catch (error) {
      console.error('Failed to create folder:', error)
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
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
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
        <Header title="Test Folders" subtitle="Debug / Test Folders" />
        
        <main className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Create Folder */}
            <Card>
              <CardHeader>
                <CardTitle>Create Test Folder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                    Create
                  </Button>
                  <Button onClick={refetch} variant="outline">
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Folders List */}
            <Card>
              <CardHeader>
                <CardTitle>All Folders ({folders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div>Loading folders...</div>
                ) : folders.length === 0 ? (
                  <div>No folders found</div>
                ) : (
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <div key={folder.id} className="p-3 border rounded flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{folder.name}</h4>
                          <div className="text-sm text-gray-500">
                            ID: {folder.id} | Parent: {folder.parentId || 'None'} | User: {folder.userId}
                          </div>
                          <div className="text-xs text-gray-400">
                            Created: {new Date(folder.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Test */}
            <Card>
              <CardHeader>
                <CardTitle>API Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/folders?all=true')
                        const data = await response.json()
                        console.log('API Response:', data)
                        alert(`API returned ${data.folders?.length || 0} folders`)
                      } catch (error) {
                        console.error('API Error:', error)
                        alert('API Error: ' + error)
                      }
                    }}
                    variant="outline"
                  >
                    Test API Direct
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  )
}