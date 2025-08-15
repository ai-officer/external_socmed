'use client'

import { useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { RenameFolderDialog } from './RenameFolderDialog'
import { DeleteFolderDialog } from './DeleteFolderDialog'
import { Edit2, Trash2, FolderOpen, Share } from 'lucide-react'
import { Folder } from '@/types/folder'

interface FolderContextMenuProps {
  folder: Folder
  onUpdate?: () => void
  onDelete?: () => void
  children: React.ReactNode
}

export function FolderContextMenu({ folder, children, onUpdate, onDelete }: FolderContextMenuProps) {
  const [showRename, setShowRename] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const handleRename = () => {
    setShowRename(true)
  }

  const handleDelete = () => {
    setShowDelete(true)
  }

  const handleOpen = () => {
    // This would be handled by the parent component
    // since folder navigation is handled at the page level
  }

  const handleShare = () => {
    // TODO: Implement folder sharing
    console.log('Share folder:', folder.name)
  }

  const copyFolderPath = () => {
    // TODO: Copy folder path to clipboard
    console.log('Copy folder path:', folder.name)
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={handleOpen} className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Open
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={handleRename} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Rename
          </ContextMenuItem>

          <ContextMenuItem onClick={handleShare} className="gap-2">
            <Share className="h-4 w-4" />
            Share
          </ContextMenuItem>

          <ContextMenuSeparator />
          
          <ContextMenuItem 
            onClick={handleDelete}
            className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <RenameFolderDialog
        folder={folder}
        open={showRename}
        onOpenChange={setShowRename}
        onSuccess={() => {
          onUpdate?.()
          setShowRename(false)
        }}
      />

      {/* Delete Dialog */}
      <DeleteFolderDialog
        folder={folder}
        open={showDelete}
        onOpenChange={setShowDelete}
        onSuccess={() => {
          onDelete?.()
          setShowDelete(false)
        }}
      />
    </>
  )
}