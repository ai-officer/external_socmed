import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return mock data for testing
    return NextResponse.json({
      overview: {
        totalFiles: 0,
        totalFolders: 0,
        totalTags: 0,
        storageUsed: 0,
        recentUploads: 0
      },
      fileTypes: {},
      uploadTrend: [],
      topTags: [],
      topFolders: []
    })
  } catch (error) {
    console.error('Analytics test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}