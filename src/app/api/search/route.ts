import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getPdfThumbnailUrl, getDocumentThumbnailUrl, getVideoThumbnailUrl, getImageThumbnailUrl } from '@/utils/thumbnails'

const searchQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['all', 'image', 'video', 'document']).default('all'),
  folderId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  minSize: z.coerce.number().optional(),
  maxSize: z.coerce.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['relevance', 'name', 'createdAt', 'size']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params: any = Object.fromEntries(searchParams.entries())
    
    // Parse tags array from comma-separated string
    if (params.tags) {
      params.tags = params.tags.split(',').filter(Boolean)
    }

    const {
      q,
      type,
      folderId,
      tags,
      minSize,
      maxSize,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      page,
      limit
    } = searchQuerySchema.parse(params)

    // Build search conditions
    const searchTerms = q ? q.toLowerCase().split(' ').filter(term => term.length > 0) : []
    
    const where: any = {
      deletedAt: null,
      AND: []
    }

    // Global search - all users can search all files from all users
    // No userId filtering - everyone searches everything
    console.log('Search API - Global mode: All users can search all files')

    // Full-text search across multiple fields
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => ({
        OR: [
          { originalName: { contains: term, mode: 'insensitive' } },
          { filename: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          {
            tags: {
              some: {
                tag: {
                  name: { contains: term, mode: 'insensitive' }
                }
              }
            }
          }
        ]
      }))
      
      where.AND.push(...searchConditions)
    }

    // Folder filter
    if (folderId) {
      where.folderId = folderId
    }

    // File type filter
    if (type !== 'all') {
      const typeMap = {
        image: { startsWith: 'image/' },
        video: { startsWith: 'video/' },
        document: { 
          in: ['application/pdf', 'text/plain', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] 
        }
      }
      where.mimeType = typeMap[type]
    }

    // Tag filter
    if (tags.length > 0) {
      where.AND.push({
        tags: {
          some: {
            tag: {
              name: { in: tags }
            }
          }
        }
      })
    }

    // Size filter
    if (minSize || maxSize) {
      where.size = {}
      if (minSize) where.size.gte = minSize
      if (maxSize) where.size.lte = maxSize
    }

    // Date filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Get total count
    const total = await prisma.file.count({ where })

    // Build order by clause
    let orderBy: any = {}
    
    if (sortBy === 'relevance') {
      // For relevance sorting, we'll use a combination of factors
      orderBy = [
        { createdAt: 'desc' }, // Recent files first
        { originalName: 'asc' }  // Then alphabetical
      ]
    } else {
      orderBy = { [sortBy]: sortOrder }
    }

    // Execute search query
    const files = await prisma.file.findMany({
      where,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            parentId: true
          }
        },
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
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    // Transform results and add relevance scoring
    const results = files.map(file => {
      const tags = file.tags.map(ft => ft.tag)
      
      // Calculate relevance score (simplified)
      let relevanceScore = 0
      if (q) {
        const lowerQuery = q.toLowerCase()
        
        if (file.originalName.toLowerCase().includes(lowerQuery)) {
          relevanceScore += 10
        }
        if (file.description?.toLowerCase().includes(lowerQuery)) {
          relevanceScore += 5
        }
        if (tags.some(tag => tag.name.toLowerCase().includes(lowerQuery))) {
          relevanceScore += 3
        }
      }

      return {
        ...file,
        tags,
        relevanceScore,
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
          : getDocumentThumbnailUrl(file.cloudinaryUrl, file.mimeType), // Fallback for any other file type
        // Add highlighted snippets
        highlightedName: highlightSearchTerms(file.originalName, searchTerms),
        highlightedDescription: file.description ? highlightSearchTerms(file.description, searchTerms) : null
      }
    })

    // Sort by relevance if requested
    if (sortBy === 'relevance') {
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }

    // Save search query to history (only if there's a query)
    if (q && q.trim()) {
      try {
        await prisma.searchHistory.create({
          data: {
            query: q,
            filters: JSON.stringify({
              type,
              folderId,
              tags,
              minSize,
              maxSize,
              startDate,
              endDate
            }),
            userId: session.user.id,
            resultsCount: total
          }
        })
      } catch (error) {
        // Don't fail the search if history save fails
        console.error('Failed to save search history:', error)
      }
    }

    return NextResponse.json({
      query: q || '',
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filters: {
        type,
        folderId,
        tags,
        minSize,
        maxSize,
        startDate,
        endDate
      }
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

// Helper function to highlight search terms
function highlightSearchTerms(text: string, terms: string[]): string {
  if (!text || terms.length === 0) return text
  
  let highlightedText = text
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi')
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
  })
  
  return highlightedText
}