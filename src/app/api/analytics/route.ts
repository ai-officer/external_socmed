import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '7d' // 7d, 30d, 90d, 1y
    const type = searchParams.get('type') || 'overview' // overview, files, folders, tags, storage

    console.log('Analytics API - Global mode: All users see global analytics data')

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    if (type === 'overview') {
      // Build where clauses for global data - all users see system-wide analytics
      const fileWhere: any = { deletedAt: null }
      const folderWhere: any = {}
      const tagWhere: any = {}
      
      // Global analytics - no userId filtering for anyone

      // Get basic stats (global for all users)
      const totalFiles = await prisma.file.count({
        where: fileWhere
      })
      
      const totalFolders = await prisma.folder.count({
        where: folderWhere
      })
      
      const totalTags = await prisma.tag.count({
        where: tagWhere
      })
      
      const storageUsed = await prisma.file.aggregate({
        where: fileWhere,
        _sum: { size: true }
      })
      
      const recentUploads = await prisma.file.count({
        where: {
          ...fileWhere,
          createdAt: { gte: startDate }
        }
      })

      // Get file type distribution
      const allFiles = await prisma.file.findMany({
        where: fileWhere,
        select: { mimeType: true, size: true }
      })

      const fileTypes: Record<string, { count: number; size: number }> = {}
      
      allFiles.forEach(file => {
        let category = 'other'
        if (file.mimeType.startsWith('image/')) {
          category = 'images'
        } else if (file.mimeType.startsWith('video/')) {
          category = 'videos'
        } else if (file.mimeType === 'application/pdf') {
          category = 'pdf'
        } else if (file.mimeType.startsWith('application/') || file.mimeType.startsWith('text/')) {
          category = 'documents'
        }
        
        if (!fileTypes[category]) {
          fileTypes[category] = { count: 0, size: 0 }
        }
        fileTypes[category].count++
        fileTypes[category].size += file.size
      })

      // Get upload trend data
      const uploadTrend = []
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
      
      for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date()
        dayStart.setDate(dayStart.getDate() - i)
        dayStart.setHours(0, 0, 0, 0)
        
        const dayEnd = new Date(dayStart)
        dayEnd.setHours(23, 59, 59, 999)
        
        const dayUploads = await prisma.file.count({
          where: {
            ...fileWhere,
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        })
        
        uploadTrend.push({
          date: dayStart.toISOString(),
          count: dayUploads,
          size: 0 // Could add size aggregation here if needed
        })
      }

      // Get top tags
      const topTagsData = await prisma.tag.findMany({
        where: tagWhere,
        include: {
          _count: {
            select: { files: true }
          }
        },
        orderBy: {
          files: {
            _count: 'desc'
          }
        },
        take: 10
      })

      const topTags = topTagsData.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        fileCount: tag._count.files
      }))

      // Get top folders
      const topFoldersData = await prisma.folder.findMany({
        where: { userId },
        include: {
          _count: {
            select: { files: true }
          }
        },
        orderBy: {
          files: {
            _count: 'desc'
          }
        },
        take: 10
      })

      const topFolders = topFoldersData.map(folder => ({
        id: folder.id,
        name: folder.name,
        fileCount: folder._count.files
      }))

      return NextResponse.json({
        overview: {
          totalFiles,
          totalFolders,
          totalTags,
          storageUsed: storageUsed._sum.size || 0,
          recentUploads
        },
        fileTypes,
        uploadTrend,
        topTags,
        topFolders
      })
    }

    if (type === 'files') {
      // Simplified file analytics for now
      return NextResponse.json({
        timeline: [],
        sizeDistribution: { small: 0, medium: 0, large: 0, huge: 0 },
        extensions: {},
        largestFiles: []
      })
    }

    return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

