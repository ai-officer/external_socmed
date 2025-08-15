import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get basic statistics
    const [
      totalUsers,
      activeUsers,
      totalFiles,
      totalFolders,
      totalTags,
      newFilesCount,
      newUsersCount,
      totalStorageUsed
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: startDate
          }
        }
      }),
      prisma.file.count({
        where: {
          deletedAt: null
        }
      }),
      prisma.folder.count(),
      prisma.tag.count(),
      prisma.file.count({
        where: {
          createdAt: {
            gte: startDate
          },
          deletedAt: null
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.file.aggregate({
        _sum: {
          size: true
        },
        where: {
          deletedAt: null
        }
      })
    ])

    // Get file type distribution
    const fileTypeDistribution = await prisma.file.groupBy({
      by: ['mimeType'],
      _count: {
        id: true
      },
      where: {
        deletedAt: null
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // Get top users by file count
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            files: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        files: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // Get popular tags
    const popularTags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: {
        files: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Format file types for better display
    const formattedFileTypes = fileTypeDistribution.map(type => ({
      type: type.mimeType.split('/')[0] || 'other',
      count: type._count.id
    })).reduce((acc, curr) => {
      const existing = acc.find(item => item.type === curr.type)
      if (existing) {
        existing.count += curr.count
      } else {
        acc.push(curr)
      }
      return acc
    }, [] as Array<{ type: string; count: number }>)

    // Create sample upload trends (simplified version)
    const uploadTrends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayFiles = await prisma.file.count({
        where: {
          createdAt: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          },
          deletedAt: null
        }
      })
      
      const dayBytes = await prisma.file.aggregate({
        _sum: { size: true },
        where: {
          createdAt: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          },
          deletedAt: null
        }
      })

      uploadTrends.push({
        date: date.toISOString().split('T')[0],
        uploads: dayFiles,
        bytes: dayBytes._sum.size || 0
      })
    }

    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        totalFiles,
        totalFolders,
        totalTags,
        newFilesCount,
        newUsersCount,
        totalStorageUsed: totalStorageUsed._sum.size || 0,
        period
      },
      charts: {
        uploadTrends,
        fileTypeDistribution: formattedFileTypes,
        popularTags: popularTags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          count: tag._count.files
        }))
      },
      topUsers: topUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        fileCount: user._count.files
      }))
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}