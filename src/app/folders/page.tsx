'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useFolders } from '@/hooks/useFolders'
import { useFiles } from '@/hooks/useFiles'
import { FolderBreadcrumb } from '@/components/folders/FolderBreadcrumb'
import { CreateFolderDialog } from '@/components/folders/CreateFolderDialog'
import { RenameFolderDialog } from '@/components/folders/RenameFolderDialog'
import { DeleteFolderDialog } from '@/components/folders/DeleteFolderDialog'
import { FileUpload } from '@/components/upload/FileUpload'
import { FileCard } from '@/components/files/FileCard'
import { FilePreview } from '@/components/files/FilePreview'
import { FileContextMenu } from '@/components/files/FileContextMenu'
import { FolderContextMenu } from '@/components/folders/FolderContextMenu'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FolderPlus, 
  Upload,
  Search, 
  Grid3X3, 
  List,

  Edit2,
  Trash2,
  Calendar,
  Folder,
  File as FileIcon,
  ArrowUpDown,
  Filter
} from 'lucide-react'
import { cn } from '@/utils/cn'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'createdAt' | 'updatedAt'
type SortOrder = 'asc' | 'desc'
type FilterMode = 'all' | 'empty' | 'withContent' | 'recent'

export default function FoldersPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get current folder ID from URL search params
  const currentFolderId = searchParams.get('folder') || undefined
  
  // Function to navigate to a folder (updates URL)
  const navigateToFolder = (folderId?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (folderId) {
      params.set('folder', folderId)
    } else {
      params.delete('folder')
    }
    const newUrl = params.toString() ? `/folders?${params.toString()}` : '/folders'
    router.push(newUrl)
  }
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [previewFile, setPreviewFile] = useState<any>(null)
  
  const { folders, loading: foldersLoading, refetch: refreshFolders } = useFolders(undefined, true)
  const { files, loading: filesLoading, refresh: refreshFiles } = useFiles({ 
    folderId: currentFolderId,
    search: searchQuery
  })

  // Debug: Log current folder ID and data state (in useEffect to prevent infinite re-renders)
  useEffect(() => {
    console.log('Current folder ID from URL:', currentFolderId)
    console.log('Files data:', files?.length || 0, 'files loaded')
    console.log('Folders data:', folders?.length || 0, 'folders loaded')
    console.log('Files loading:', filesLoading, 'Folders loading:', foldersLoading)
  }, [currentFolderId, files?.length, folders?.length, filesLoading, foldersLoading])

  // Callback for when files are uploaded - refresh the view
  const handleFileUpload = (uploadedFiles?: any[]) => {
    console.log('Files uploaded, checking if refresh needed...', uploadedFiles?.length || 0, 'files')
    
    // Only refresh if the uploaded files belong to the currently viewed folder
    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadTargetFolderId = uploadedFiles[0]?.folderId
      const currentlyViewingFolderId = currentFolderId
      
      console.log('Upload target folder:', uploadTargetFolderId, 'Currently viewing:', currentlyViewingFolderId)
      
      // Check if files were uploaded to the folder we're currently viewing
      // Handle both null/undefined cases (root folder) and specific folder IDs
      const shouldRefresh = (uploadTargetFolderId === currentlyViewingFolderId) ||
                           (uploadTargetFolderId === null && currentlyViewingFolderId === undefined) ||
                           (uploadTargetFolderId === undefined && currentlyViewingFolderId === undefined)
      
      if (shouldRefresh) {
        console.log('Files uploaded to current folder, refreshing views...')
        
        // Multiple refresh attempts to ensure files appear
        // Immediate refresh
        refreshFiles()
        
        // Short delay refresh (500ms)
        setTimeout(() => {
          console.log('Short delay refresh for uploaded files')
          refreshFiles()
        }, 500)
        
        // Medium delay refresh (1500ms) - for slower database writes
        setTimeout(() => {
          console.log('Medium delay refresh for uploaded files')
          refreshFiles()
        }, 1500)
        
        // Final refresh (3000ms) - ensure all files are visible
        setTimeout(() => {
          console.log('Final refresh for uploaded files')
          refreshFiles()
        }, 3000)
      } else {
        console.log('Files uploaded to different folder, skipping refresh')
      }
    }
    
    // Always refresh folders in case new folders were created
    refreshFolders()
  }

  // Get current folder details
  const currentFolder = currentFolderId 
    ? folders.find(f => f.id === currentFolderId)
    : null

  // Get and filter subfolders
  const allSubfolders = folders.filter(f => {
    // Handle null/undefined comparison properly
    const folderParentId = f.parentId || null
    const currentParentId = currentFolderId || null
    return folderParentId === currentParentId
  })
  
  const filteredAndSortedFolders = useMemo(() => {
    const filtered = allSubfolders.filter(folder => {
      // Search filter
      if (searchQuery && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Filter mode filter
      if (filterMode === 'recent') {
        // Show folders created in the last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return new Date(folder.createdAt) > sevenDaysAgo
      } else if (filterMode === 'empty') {
        // Show folders with no subfolders and no files
        const hasSubfolders = folders.some(f => f.parentId === folder.id)
        const hasFiles = files && files.length > 0 && currentFolderId === folder.id
        return !hasSubfolders && !hasFiles
      }
      // 'all' and 'withContent' show all folders for now
      
      return true
    })

    // Sort folders
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [allSubfolders, searchQuery, sortField, sortOrder, filterMode, folders, files, currentFolderId])

  // Filter and sort files  
  const filteredAndSortedFiles = useMemo(() => {
    if (!files) return []
    
    const filtered = files.filter(file => {
      if (searchQuery && !file.originalName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    
    return filtered
  }, [files, searchQuery])

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
          <h1 className="text-2xl font-bold mb-4">Please sign in to view folders</h1>
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
        <Header 
          title={currentFolder ? currentFolder.name : "My Drive"} 
          subtitle={`${currentFolder ? `${currentFolder.name}` : 'My Drive'}`} 
        />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="mb-4">
              <FolderBreadcrumb
                folderId={currentFolderId}
                onNavigate={(folderId) => navigateToFolder(folderId)}
              />
            </div>

            {/* Toolbar - Simplified Layout */}
            <div className="bg-white rounded-lg border mb-6">
              {/* Top row - Main actions */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search in Drive"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 border-gray-200"
                    />
                  </div>

                  {/* Results count */}
                  <Badge variant="secondary">
                    {filesLoading || foldersLoading 
                      ? 'Loading...' 
                      : `${filteredAndSortedFolders.length + filteredAndSortedFiles.length} items`
                    }
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {/* Upload Files Button */}
                  <FileUpload
                    folderId={currentFolderId}
                    onUploadComplete={handleFileUpload}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    }
                  />

                  {/* Create Folder Button */}
                  <CreateFolderDialog
                    parentId={currentFolderId}
                    onSuccess={refreshFolders}
                    trigger={
                      <Button size="sm">
                        <FolderPlus className="h-4 w-4 mr-2" />
                        New folder
                      </Button>
                    }
                  />
                </div>
              </div>

              {/* Bottom row - Filters and view options */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {/* Filter */}
                  <Select value={filterMode} onValueChange={(value: FilterMode) => setFilterMode(value)}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="empty">Empty</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                  </Button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-200 rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none border-l"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading state */}
            {(foldersLoading || filesLoading) && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading...</p>
                </div>
              </div>
            )}

            {/* Content Grid/List - Google Drive Style */}
            {!foldersLoading && !filesLoading && (
              <>
                {(filteredAndSortedFolders.length > 0 || filteredAndSortedFiles.length > 0) ? (
                  <div className={cn(
                    viewMode === 'grid' 
                      ? "grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" 
                      : "flex flex-col space-y-1"
                  )}>
                    {/* Folders First */}
                    {filteredAndSortedFolders.map((folder) => (
                      <FolderContextMenu
                        key={`folder-${folder.id}`}
                        folder={folder}
                        onUpdate={refreshFolders}
                        onDelete={refreshFolders}
                      >
                        <div
                          className={cn(
                            "bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-gray-300 transition-all duration-200 group cursor-pointer hover:bg-gray-50 relative transform hover:-translate-y-1",
                            viewMode === 'grid' 
                              ? "p-3" 
                              : "p-3 flex items-center justify-between"
                          )}
                          onClick={() => navigateToFolder(folder.id)}
                          onDoubleClick={() => navigateToFolder(folder.id)}
                        >
                        {viewMode === 'grid' ? (
                          // Grid view - Google Drive style
                          <div className="flex flex-col">
                            <div className="w-full h-24 mb-2 rounded-lg bg-blue-50 flex items-center justify-center relative">
                              <Folder className="h-16 w-16 text-blue-500" />
                            </div>
                            <div className="px-2">
                              <h4 className="font-medium text-sm truncate text-gray-900 mb-1">{folder.name}</h4>
                              <p className="text-xs text-gray-500">
                                {(folder._count?.files || 0) + (folder._count?.children || 0)} items
                              </p>
                            </div>
                            
                            {/* Action menu now handled by FolderContextMenu */}
                          </div>
                        ) : (
                          // List view
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Folder className="h-6 w-6 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 truncate">{folder.name}</h4>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                  <span>{new Date(folder.updatedAt).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{(folder._count?.files || 0) + (folder._count?.children || 0)} items</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action menu handled by FolderContextMenu */}
                          </div>
                        )}
                        </div>
                      </FolderContextMenu>
                    ))}

                    {/* Files */}
                    {filteredAndSortedFiles.map((file) => (
                      <FileContextMenu
                        key={`file-${file.id}`}
                        file={file}
                        onUpdate={refreshFiles}
                        onDelete={() => refreshFiles()}
                      >
                        <div
                          className={cn(
                            "bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-gray-300 transition-all duration-200 group cursor-pointer hover:bg-gray-50 relative transform hover:-translate-y-1",
                            viewMode === 'grid' 
                              ? "p-3" 
                              : "p-3 flex items-center justify-between"
                          )}
                          onClick={() => setPreviewFile(file)}
                        >
                        {viewMode === 'grid' ? (
                          // Grid view for files - Google Drive style
                          <div className="flex flex-col">
                            <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
                              {file.mimeType.startsWith('image/') ? (
                                <img 
                                  src={file.thumbnailUrl || file.cloudinaryUrl} 
                                  alt={file.originalName}
                                  className="w-full h-full object-cover"
                                />
                              ) : file.mimeType.startsWith('video/') ? (
                                <div className="relative w-full h-full">
                                  <video 
                                    src={file.cloudinaryUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                                      <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                  <FileIcon className="h-8 w-8 mb-1" />
                                  <span className="text-xs uppercase font-medium">
                                    {file.mimeType.split('/')[1] || 'FILE'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="px-2">
                              <h4 className="font-medium text-sm truncate text-gray-900 mb-1">{file.originalName}</h4>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                            
                            {/* Action menu handled by FileContextMenu */}
                          </div>
                        ) : (
                          // List view for files
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                {file.mimeType.startsWith('image/') ? (
                                  <img 
                                    src={file.thumbnailUrl || file.cloudinaryUrl} 
                                    alt={file.originalName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : file.mimeType.startsWith('video/') ? (
                                  <div className="relative w-full h-full">
                                    <video 
                                      src={file.cloudinaryUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                      </svg>
                                    </div>
                                  </div>
                                ) : (
                                  <FileIcon className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 truncate">{file.originalName}</h4>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action menu button - now handled by FileContextMenu */}
                          </div>
                        )}
                        </div>
                      </FileContextMenu>
                    ))}
                  </div>
                ) : (
                  // Empty state - Google Drive style
                  <div className="text-center py-16">
                    <div className="max-w-sm mx-auto">
                      <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <Folder className="h-16 w-16 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {searchQuery ? 'No results found' : 'Folder is empty'}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {searchQuery 
                          ? 'Try a different search term'
                          : 'Drop files here or use the upload button to add files'
                        }
                      </p>
                      <div className="flex gap-3 justify-center">
                        <FileUpload
                          folderId={currentFolderId}
                          onUploadComplete={handleFileUpload}
                          trigger={
                            <Button>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload files
                            </Button>
                          }
                        />
                        <CreateFolderDialog
                          parentId={currentFolderId}
                          onSuccess={refreshFolders}
                          trigger={
                            <Button variant="outline">
                              <FolderPlus className="h-4 w-4 mr-2" />
                              Create folder
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onUpdate={refreshFiles}
          onDelete={(fileId) => {
            refreshFiles()
            setPreviewFile(null)
          }}
        />
      )}

      {/* Folder dialogs are now handled by FolderContextMenu */}
    </div>
  )
}