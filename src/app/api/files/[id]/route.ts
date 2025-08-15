import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { z } from 'zod'

const updateFileSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  originalName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  folderId: z.string().optional()
})

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
    const { filename, originalName, description, folderId } = updateFileSchema.parse(body)

    // Verify file ownership
    const file = await prisma.file.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // If moving to a folder, verify folder ownership
    if (folderId !== undefined && folderId !== file.folderId) {
      if (folderId) {
        const folder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            userId: session.user.id
          }
        })

        if (!folder) {
          return NextResponse.json(
            { error: 'Target folder not found' },
            { status: 404 }
          )
        }
      }
    }

    // Handle file renaming - check both originalName and filename updates
    const newOriginalName = originalName || filename
    const checkNameConflict = newOriginalName && newOriginalName !== file.originalName

    if (checkNameConflict) {
      const existingFile = await prisma.file.findFirst({
        where: {
          originalName: newOriginalName,
          folderId: folderId !== undefined ? folderId : file.folderId,
          userId: session.user.id,
          id: { not: params.id },
          deletedAt: null
        }
      })

      if (existingFile) {
        return NextResponse.json(
          { error: 'A file with this name already exists in the target location' },
          { status: 409 }
        )
      }

      // Validate filename (no dangerous extensions or characters)
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar']
      const fileExtension = newOriginalName.toLowerCase().substring(newOriginalName.lastIndexOf('.'))
      if (dangerousExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { error: 'File extension not allowed for security reasons' },
          { status: 400 }
        )
      }

      // Validate filename doesn't contain invalid characters
      if (/[\/\\:*?"<>|]/.test(newOriginalName)) {
        return NextResponse.json(
          { error: 'Filename contains invalid characters: / \\ : * ? " < > |' },
          { status: 400 }
        )
      }
    }

    const updatedFile = await prisma.file.update({
      where: { id: params.id },
      data: {
        filename: filename || file.filename,
        originalName: newOriginalName || file.originalName,
        description: description !== undefined ? description : file.description,
        folderId: folderId !== undefined ? folderId : file.folderId
      },
      include: {
        folder: {
          select: { id: true, name: true }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      }
    })

    // Transform for response
    const transformedFile = {
      ...updatedFile,
      tags: updatedFile.tags.map(ft => ft.tag),
      isImage: updatedFile.mimeType.startsWith('image/'),
      isVideo: updatedFile.mimeType.startsWith('video/'),
      isDocument: updatedFile.mimeType.startsWith('application/') || updatedFile.mimeType.startsWith('text/')
    }

    return NextResponse.json({ file: transformedFile })
  } catch (error) {
    console.error('Error updating file:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update file' },
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    // Verify file ownership
    const file = await prisma.file.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (permanent) {
      // Delete from Cloudinary
      try {
        await deleteFromCloudinary(file.cloudinaryId)
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError)
        // Continue with database deletion even if Cloudinary fails
      }

      // Delete from database
      await prisma.file.delete({
        where: { id: params.id }
      })
    } else {
      // Soft delete (move to trash)
      await prisma.file.update({
        where: { id: params.id },
        data: {
          deletedAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}