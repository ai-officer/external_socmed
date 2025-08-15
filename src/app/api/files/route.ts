import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { z } from 'zod'
import { getPdfThumbnailUrl, getDocumentThumbnailUrl, getVideoThumbnailUrl, getImageThumbnailUrl } from '@/utils/thumbnails'

export const dynamic = 'force-dynamic'

const fileQuerySchema = z.object({
  folderId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['name', 'createdAt', 'updatedAt', 'size']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  type: z.enum(['image', 'video', 'document', 'all']).default('all'),
  tags: z.array(z.string()).default([]),
  minSize: z.coerce.number().optional(),
  maxSize: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params: any = Object.fromEntries(searchParams.entries())
    
    // Parse tags array from comma-separated string
    if (params.tags) {
      params.tags = params.tags.split(',').filter(Boolean)
    }
    
    const {
      folderId,
      page,
      limit,
      sort,
      order,
      search,
      type,
      tags,
      minSize,
      maxSize,
      startDate,
      endDate
    } = fileQuerySchema.parse(params)

    // Build basic where clause
    const where: any = {}

    // Global files - all users can see all files from all users
    // No userId filtering - everyone sees everything
    console.log('Files API - Global mode: All users can see all files')

    // Add folder filter - always filter by folder context
    if (folderId) {
      // Specific folder requested
      where.folderId = folderId
      console.log('Files API: Filtering by specific folder:', folderId)
    } else {
      // No folder specified or empty string = root folder (null)
      where.folderId = null
      console.log('Files API: Filtering by root folder (null)')
    }
    
    console.log('Files API: Final where clause:', JSON.stringify(where, null, 2))

    // Add search filter if provided
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add type filter if provided
    if (type && type !== 'all') {
      switch (type) {
        case 'image':
          where.mimeType = { startsWith: 'image/' }
          break
        case 'video':
          where.mimeType = { startsWith: 'video/' }
          break
        case 'document':
          where.OR = [
            { mimeType: { startsWith: 'application/' } },
            { mimeType: { startsWith: 'text/' } }
          ]
          break
      }
    }

    // Add size filters if provided
    if (minSize !== undefined) {
      where.size = { ...where.size, gte: minSize }
    }
    if (maxSize !== undefined) {
      where.size = { ...where.size, lte: maxSize }
    }

    // Add date filters if provided
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
    }

    // Add tags filter if provided
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags }
          }
        }
      }
    }

    // Get total count for pagination
    const total = await prisma.file.count({ where })

    // Get files with basic fields and user information
    console.log('Files API: Executing Prisma query...')
    const files = await prisma.file.findMany({
      where,
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        cloudinaryId: true,
        cloudinaryUrl: true,
        description: true,
        folderId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
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
      },
      orderBy: {
        [sort]: order
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Transform files for response
    const transformedFiles = files.map(file => ({
      ...file,
      tags: file.tags.map(ft => ft.tag), // Include actual tags
      folder: null, // Empty folder for now
      isImage: file.mimeType.startsWith('image/'),
      isVideo: file.mimeType.startsWith('video/'),
      isDocument: file.mimeType.startsWith('application/') || file.mimeType.startsWith('text/'),
      // Generate thumbnail URL for all file types
      thumbnailUrl: file.mimeType.startsWith('image/') 
        ? getImageThumbnailUrl(file.cloudinaryUrl)
        : file.mimeType.startsWith('video/')
        ? getVideoThumbnailUrl(file.cloudinaryUrl)
        : file.mimeType === 'application/pdf'
        ? getPdfThumbnailUrl(file.cloudinaryUrl)
        : file.mimeType.startsWith('application/') || file.mimeType.startsWith('text/')
        ? getDocumentThumbnailUrl(file.cloudinaryUrl, file.mimeType)
        : getDocumentThumbnailUrl(file.cloudinaryUrl, file.mimeType) // Fallback for any other file type
    }))

    console.log('Files API: Found', files.length, 'files, total count:', total)
    console.log('Files API: First few files:', files.slice(0, 3).map(f => ({ id: f.id, name: f.originalName, folderId: f.folderId })))
    
    return NextResponse.json({
      files: transformedFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching files:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}