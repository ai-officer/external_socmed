import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1).max(50).toLowerCase(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().optional()
})

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).toLowerCase().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().optional()
})

// Helper function to generate random tag colors
function generateTagColor(): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const includeStats = searchParams.get('stats') === 'true'

    const where: any = {
      userId: session.user.id
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const tags = await prisma.tag.findMany({
      where,
      include: includeStats ? {
        _count: {
          select: {
            files: true
          }
        },
        files: {
          take: 5,
          select: {
            file: {
              select: {
                id: true,
                originalName: true,
                cloudinaryUrl: true,
                mimeType: true
              }
            }
          }
        }
      } : {
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: includeStats ? {
        files: {
          _count: 'desc'
        }
      } : {
        name: 'asc'
      }
    })

    const transformedTags = tags.map((tag: any) => ({
      ...tag,
      fileCount: tag._count.files,
      recentFiles: includeStats ? tag.files?.map((f: any) => f.file) : undefined
    }))

    return NextResponse.json({ tags: transformedTags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, description } = createTagSchema.parse(body)

    // Check if tag already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        name,
        userId: session.user.id
      }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || generateTagColor(),
        description,
        userId: session.user.id
      },
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
        ...tag,
        fileCount: tag._count.files
      }
    })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}