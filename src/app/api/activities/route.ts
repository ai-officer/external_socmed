import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get recent files (uploads) - global for all users
    const recentFiles = await prisma.file.findMany({
      where: {
        deletedAt: null
      },
      include: {
        folder: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Get recent folders - global for all users
    const recentFolders = await prisma.folder.findMany({
      where: {},
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Get recent tags - global for all users
    const recentTags = await prisma.tag.findMany({
      where: {},
      include: {
        _count: {
          select: {
            files: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Combine and format activities
    const activities: any[] = []

    // Add file uploads
    recentFiles.forEach(file => {
      const userName = file.user?.name || file.user?.email || 'Unknown User'
      activities.push({
        id: `file-${file.id}`,
        type: 'upload',
        title: 'File Uploaded',
        description: `${userName} uploaded ${file.originalName}${file.folder ? ` to ${file.folder.name}` : ''}`,
        time: file.createdAt.toISOString(),
        icon: 'Upload',
        iconBg: 'bg-blue-50 text-blue-600'
      })
    })

    // Add folder creation
    recentFolders.forEach(folder => {
      const userName = folder.user?.name || folder.user?.email || 'Unknown User'
      activities.push({
        id: `folder-${folder.id}`,
        type: 'folder',
        title: 'Folder Created',
        description: `${userName} created ${folder.name} folder`,
        time: folder.createdAt.toISOString(),
        icon: 'FolderPlus',
        iconBg: 'bg-green-50 text-green-600'
      })
    })

    // Add tag creation
    recentTags.forEach(tag => {
      const userName = tag.user?.name || tag.user?.email || 'Unknown User'
      activities.push({
        id: `tag-${tag.id}`,
        type: 'tag',
        title: 'Tag Created',
        description: `${userName} created ${tag.name} tag (${tag._count.files} files)`,
        time: tag.createdAt.toISOString(),
        icon: 'Tag',
        iconBg: 'bg-yellow-50 text-yellow-600'
      })
    })

    // Sort by date and limit results
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit)

    return NextResponse.json({ activities: sortedActivities })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
