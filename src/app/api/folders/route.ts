import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  parentId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const all = searchParams.get('all') // New parameter to fetch all folders

    const whereClause: any = {}

    // Global folders - all users can see all folders
    // No userId filtering - everyone sees everything
    console.log('Folders API - Global mode: All users can see all folders')

    // If 'all' parameter is provided, fetch all folders
    // Otherwise, filter by parentId as before
    if (!all) {
      whereClause.parentId = parentId || null
    }

    console.log('Folders API - Global mode enabled. Where clause:', whereClause)

    const folders = await prisma.folder.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            files: {
              where: {
                deletedAt: null  // Only count non-deleted files
              }
            },
            children: true  // Count all child folders
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Debug: Log folder counts
    console.log('Folders API - Found folders with counts:', folders.map(f => ({
      name: f.name,
      fileCount: f._count.files,
      childrenCount: f._count.children,
      totalItems: f._count.files + f._count.children
    })))

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
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
    const { name, description, parentId } = createFolderSchema.parse(body)

    // Check if parent folder exists and belongs to user
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          userId: session.user.id
        }
      })

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        )
      }
    }

    // Check for duplicate names in the same parent
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name,
        parentId: parentId || null,
        userId: session.user.id
      }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder name already exists' },
        { status: 409 }
      )
    }

    // Validate folder name (no special characters that could cause issues)
    const invalidChars = /[\/\\:*?"<>|]/
    if (invalidChars.test(name)) {
      return NextResponse.json(
        { error: 'Folder name contains invalid characters' },
        { status: 400 }
      )
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        description,
        parentId,
        userId: session.user.id
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

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Error creating folder:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}