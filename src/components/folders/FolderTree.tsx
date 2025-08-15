'use client'

import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFolders } from '@/hooks/useFolders'
import { FolderContextMenu } from './FolderContextMenu'
import { cn } from '@/utils/cn'
import { Folder as FolderType } from '@/types/folder'

interface FolderTreeProps {
  folders?: FolderType[]
  parentId?: string
  level?: number
  onFolderSelect?: (folderId: string) => void
  selectedFolderId?: string
  onFolderUpdate?: () => void
  loading?: boolean
  className?: string
}

export function FolderTree({ 
  folders: foldersProp,
  parentId, 
  level = 0, 
  onFolderSelect,
  selectedFolderId,
  onFolderUpdate,
  loading: loadingProp,
  className
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { folders: fetchedFolders, loading: fetchedLoading, error } = useFolders(foldersProp ? undefined : parentId)
  
  // Use provided folders or fetched folders
  const folders = foldersProp || fetchedFolders
  const loading = loadingProp ?? fetchedLoading

  const toggleExpanded = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }, [])

  const handleFolderClick = useCallback((folderId: string) => {
    onFolderSelect?.(folderId)
  }, [onFolderSelect])

  if (loading && level === 0) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded" />
        ))}
      </div>
    )
  }

  if (error && level === 0) {
    return (
      <div className="text-red-500 text-sm p-2">
        Error loading folders: {error}
      </div>
    )
  }

  if (!folders?.length) {
    return level === 0 ? (
      <div className="text-gray-500 text-sm p-2 italic">
        No folders yet
      </div>
    ) : null
  }

  return (
    <div className={cn("select-none", level > 0 && "ml-4", className)}>
      {folders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id)
        const hasChildren = folder._count.children > 0
        const isSelected = selectedFolderId === folder.id
        const totalItems = folder._count.files + folder._count.children

        return (
          <div key={folder.id} className="group">
            <FolderContextMenu 
              folder={folder} 
              onUpdate={onFolderUpdate}
            >
              <div
                className={cn(
                  "flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  isSelected && "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                )}
                onClick={() => handleFolderClick(folder.id)}
              >
                {/* Expand/collapse button */}
                <div className="w-4 flex justify-center">
                  {hasChildren ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpanded(folder.id)
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  ) : (
                    <div className="w-4" />
                  )}
                </div>
                
                {/* Folder icon */}
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Folder className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                
                {/* Folder name */}
                <span className="text-sm truncate flex-1 min-w-0">
                  {folder.name}
                </span>
                
                {/* Item count */}
                {totalItems > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {totalItems}
                  </span>
                )}

                {/* Context menu trigger */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </FolderContextMenu>

            {/* Child folders */}
            {isExpanded && hasChildren && (
              <FolderTree
                folders={foldersProp}
                parentId={folder.id}
                level={level + 1}
                onFolderSelect={onFolderSelect}
                selectedFolderId={selectedFolderId}
                onFolderUpdate={onFolderUpdate}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}