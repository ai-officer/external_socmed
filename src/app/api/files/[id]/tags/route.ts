import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignTagsSchema = z.object({
  tagIds: z.array(z.string()).max(10, 'Maximum 10 tags allowed')
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

    // Get file tags
    const fileTags = await prisma.fileTag.findMany({
      where: {
        fileId: params.id,
        file: {
          userId: session.user.id
        }
      },
      include: {
        tag: true
      }
    })

    const tags = fileTags.map(ft => ft.tag)

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching file tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tagIds } = assignTagsSchema.parse(body)

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

    // Verify tag ownership
    const userTags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId: session.user.id
      }
    })

    if (userTags.length !== tagIds.length) {
      return NextResponse.json(
        { error: 'Some tags not found or access denied' },
        { status: 404 }
      )
    }

    // Remove existing tags and add new ones
    await prisma.$transaction([
      prisma.fileTag.deleteMany({
        where: { fileId: params.id }
      }),
      prisma.fileTag.createMany({
        data: tagIds.map(tagId => ({
          fileId: params.id,
          tagId
        })),
        skipDuplicates: true
      })
    ])

    // Get updated file with tags
    const updatedFile = await prisma.file.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json({
      file: {
        ...updatedFile,
        tags: updatedFile?.tags.map(ft => ft.tag) || []
      }
    })
  } catch (error) {
    console.error('Error assigning tags:', error)
    return NextResponse.json(
      { error: 'Failed to assign tags' },
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

    // Remove all tags from file
    await prisma.fileTag.deleteMany({
      where: { fileId: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing tags:', error)
    return NextResponse.json(
      { error: 'Failed to remove tags' },
      { status: 500 }
    )
  }
}