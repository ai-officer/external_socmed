'use client'

import { useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSub
} from '@/components/ui/context-menu'
import { 
  Download,
  Eye,
  Edit,
  Copy,
  Move,
  Share,
  Tag,
  Trash2,
  ExternalLink,
  Info
} from 'lucide-react'
import { File } from '@/types/file'
import { RenameDialog } from '@/components/operations/RenameDialog'
import { DeleteDialog } from '@/components/operations/DeleteDialog'
import { FilePreview } from './FilePreview'

interface FileContextMenuProps {
  file: File
  children: React.ReactNode
  onUpdate?: () => void
  onDelete?: (fileId: string) => void
  onRename?: () => void
}

export function FileContextMenu({ file, children, onUpdate, onDelete, onRename }: FileContextMenuProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const handleDownload = async () => {
    try {
      const response = await fetch(file.cloudinaryUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Show success feedback - can add toast notification here
      console.log(`Successfully downloaded: ${file.originalName}`)
    } catch (error) {
      console.error('Download failed:', error)
      // TODO: Show error toast notification
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.originalName,
          url: file.cloudinaryUrl
        })
      } catch (error) {
        // Fall back to copying to clipboard
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(file.cloudinaryUrl)
    // TODO: Show toast notification
  }

  const copyLink = () => {
    navigator.clipboard.writeText(file.cloudinaryUrl)
    // TODO: Show toast notification
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem 
            onClick={() => setShowPreview(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </ContextMenuItem>
          
          <ContextMenuItem 
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </ContextMenuItem>
          
          <ContextMenuItem 
            onClick={() => window.open(file.cloudinaryUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </ContextMenuItem>

          <ContextMenuSeparator />
          
          <ContextMenuItem 
            onClick={() => onRename ? onRename() : setShowRename(true)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Rename
          </ContextMenuItem>
          
          <ContextMenuItem className="gap-2">
            <Move className="h-4 w-4" />
            Move
          </ContextMenuItem>
          
          <ContextMenuItem className="gap-2">
            <Copy className="h-4 w-4" />
            Copy
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <Share className="h-4 w-4" />
              Share
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={handleShare} className="gap-2">
                <Share className="h-4 w-4" />
                Share File
              </ContextMenuItem>
              <ContextMenuItem onClick={copyLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Link
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem className="gap-2">
            <Tag className="h-4 w-4" />
            Add Tags
          </ContextMenuItem>

          <ContextMenuItem className="gap-2">
            <Info className="h-4 w-4" />
            Properties
          </ContextMenuItem>

          <ContextMenuSeparator />
          
          <ContextMenuItem 
            onClick={() => setShowDelete(true)}
            className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* File Preview Modal */}
      {showPreview && (
        <FilePreview
          file={file}
          open={showPreview}
          onClose={() => setShowPreview(false)}
          onUpdate={onUpdate}
          onDelete={(fileId) => {
            onDelete?.(fileId)
            setShowPreview(false)
          }}
        />
      )}

      {/* Rename Dialog */}
      <RenameDialog
        file={file}
        open={showRename}
        onClose={() => setShowRename(false)}
        onSuccess={() => {
          onUpdate?.()
          setShowRename(false)
        }}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        files={[file]}
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onSuccess={(deletedIds) => {
          onDelete?.(deletedIds[0])
          setShowDelete(false)
        }}
      />
    </>
  )
}