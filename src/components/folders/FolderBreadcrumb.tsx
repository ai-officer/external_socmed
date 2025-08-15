'use client'

import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFolderPath } from '@/hooks/useFolders'

interface FolderBreadcrumbProps {
  folderId?: string
  onNavigate: (folderId?: string) => void
  className?: string
}

export function FolderBreadcrumb({ folderId, onNavigate, className }: FolderBreadcrumbProps) {
  const { folderPath, loading } = useFolderPath(folderId)

  if (loading) {
    return (
      <div className="flex items-center space-x-1">
        <div className="animate-pulse h-8 bg-gray-200 rounded w-20" />
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
      </div>
    )
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {/* Home button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(undefined)}
        className="h-8 px-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        title="Home"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Button>

      {/* Folder path */}
      {folderPath?.map((folder, index) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder.id)}
            className={`h-8 px-2 transition-colors ${
              index === folderPath.length - 1 
                ? 'text-gray-900 font-medium dark:text-gray-100' 
                : 'text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
            }`}
            title={folder.name}
          >
            <span className="truncate max-w-32">
              {folder.name}
            </span>
          </Button>
        </div>
      ))}
    </nav>
  )
}