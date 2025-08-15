import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { z } from 'zod'

const updateFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  description: z.string().optional(),
  parentId: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const folderWhere: any = { id: params.id }
    
    // Global folders - all users can access all folders
    // No userId filtering
    console.log('Folder access API - Global mode: All users can access all folders')

    const folder = await prisma.folder.findFirst({
      where: folderWhere,
      include: {
        _count: {
          select: {
            files: true,
            children: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Error fetching folder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, parentId } = updateFolderSchema.parse(body)

    // Get folder (global access - no user ownership check)
    const folder = await prisma.folder.findFirst({
      where: {
        id: params.id
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // If changing parent, verify new parent exists (global access)
    if (parentId !== undefined && parentId !== folder.parentId) {
      if (parentId) {
        // Check that new parent exists (global access)
        const parentFolder = await prisma.folder.findFirst({
          where: {
            id: parentId
          }
        })

        if (!parentFolder) {
          return NextResponse.json(
            { error: 'Parent folder not found' },
            { status: 404 }
          )
        }

        // Check for circular references (prevent folder from being moved into itself or its descendants)
        if (parentId === params.id) {
          return NextResponse.json(
            { error: 'Cannot move folder into itself' },
            { status: 400 }
          )
        }

        // TODO: Add more sophisticated circular reference checking for nested folders
      }
    }

    // If changing name, check for conflicts in the target parent
    if (name && name !== folder.name) {
      const existingFolder = await prisma.folder.findFirst({
        where: {
          name,
          parentId: parentId !== undefined ? parentId : folder.parentId,
          userId: session.user.id,
          id: { not: params.id }
        }
      })

      if (existingFolder) {
        return NextResponse.json(
          { error: 'Folder name already exists in target location' },
          { status: 409 }
        )
      }

      // Validate folder name
      const invalidChars = /[\/\\:*?"<>|]/
      if (invalidChars.test(name)) {
        return NextResponse.json(
          { error: 'Folder name contains invalid characters' },
          { status: 400 }
        )
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: params.id },
      data: {
        name,
        description,
        parentId: parentId !== undefined ? parentId : folder.parentId
      },
      include: {
        _count: {
          select: {
            files: true,
            children: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ folder: updatedFolder })
  } catch (error) {
    console.error('Error updating folder:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Get folder (global access - no user ownership check)
    const folder = await prisma.folder.findFirst({
      where: {
        id: params.id
      },
      include: {
        _count: {
          select: {
            files: true,
            children: true
          }
        }
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if folder has content
    const hasContent = folder._count.files > 0 || folder._count.children > 0

    if (hasContent && !force) {
      return NextResponse.json(
        { 
          error: 'Folder is not empty',
          details: {
            files: folder._count.files,
            subfolders: folder._count.children
          }
        },
        { status: 400 }
      )
    }

    if (force && hasContent) {
      // Delete all files in the folder first (global access)
      const files = await prisma.file.findMany({
        where: {
          folderId: params.id
        }
      })

      // Delete files from Cloudinary and database
      for (const file of files) {
        try {
          await deleteFromCloudinary(file.cloudinaryId)
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError)
          // Continue with database deletion even if Cloudinary fails
        }
        await prisma.file.delete({ where: { id: file.id } })
      }

      // Delete all subfolders recursively
      const deleteFolderRecursively = async (folderId: string) => {
        // First delete all files in this folder from Cloudinary and database (global access)
        const filesInFolder = await prisma.file.findMany({
          where: {
            folderId: folderId
          }
        })

        for (const file of filesInFolder) {
          try {
            await deleteFromCloudinary(file.cloudinaryId)
          } catch (cloudinaryError) {
            console.error('Error deleting from Cloudinary:', cloudinaryError)
            // Continue with database deletion even if Cloudinary fails
          }
          await prisma.file.delete({ where: { id: file.id } })
        }

        // Then recursively delete child folders (global access)
        const childFolders = await prisma.folder.findMany({
          where: {
            parentId: folderId
          }
        })

        for (const childFolder of childFolders) {
          await deleteFolderRecursively(childFolder.id)
        }

        // Finally delete the folder itself
        await prisma.folder.delete({ where: { id: folderId } })
      }

      const childFolders = await prisma.folder.findMany({
        where: {
          parentId: params.id
        }
      })

      for (const childFolder of childFolders) {
        await deleteFolderRecursively(childFolder.id)
      }
    }

    // Delete the folder
    await prisma.folder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}