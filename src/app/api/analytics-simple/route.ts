import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    console.log('Simple Analytics API: Starting')
    
    const session = await getServerSession(authOptions)
    console.log('Simple Analytics API: Session exists:', !!session)
    
    if (!session?.user?.id) {
      console.log('Simple Analytics API: No auth')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Simple Analytics API: Returning mock data')

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
    console.error('Simple Analytics API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown' 
      },
      { status: 500 }
    )
  }
}