export interface Folder {
  id: string
  name: string
  description?: string
  parentId?: string
  createdAt: string
  updatedAt: string
  userId: string
  _count: {
    files: number
    children: number
  }
  parent?: {
    id: string
    name: string
  }
}

export interface CreateFolderData {
  name: string
  description?: string
  parentId?: string
}

export interface UpdateFolderData {
  name?: string
  description?: string
  parentId?: string
}

export interface FolderTreeItem extends Folder {
  children?: FolderTreeItem[]
  expanded?: boolean
}