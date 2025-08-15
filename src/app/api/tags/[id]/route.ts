import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).toLowerCase().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().optional()
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

    const tag = await prisma.tag.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            files: true
          }
        },
        files: {
          include: {
            file: {
              select: {
                id: true,
                originalName: true,
                cloudinaryUrl: true,
                mimeType: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            file: {
              createdAt: 'desc'
            }
          },
          take: 10
        }
      }
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    const transformedTag = {
      ...tag,
      fileCount: tag._count.files,
      files: tag.files.map(f => f.file)
    }

    return NextResponse.json({ tag: transformedTag })
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
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
    const updateData = updateTagSchema.parse(body)

    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Check if new name conflicts with existing tag
    if (updateData.name && updateData.name !== existingTag.name) {
      const conflictingTag = await prisma.tag.findFirst({
        where: {
          name: updateData.name,
          userId: session.user.id,
          id: { not: params.id }
        }
      })

      if (conflictingTag) {
        return NextResponse.json(
          { error: 'Tag name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            files: true
          }
        }
      }
    })

    return NextResponse.json({
      tag: {
        ...updatedTag,
        fileCount: updatedTag._count.files
      }
    })
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: 'Failed to update tag' },
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

    // Check if tag exists and belongs to user
    const tag = await prisma.tag.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Delete tag (this will also delete file-tag relationships due to cascade)
    await prisma.tag.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}