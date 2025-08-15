import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Simple Files API: Starting')
    
    const session = await getServerSession(authOptions)
    console.log('Simple Files API: Session exists:', !!session)
    
    if (!session?.user?.id) {
      console.log('Simple Files API: No auth')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Simple Files API: Returning empty data')
    
    return NextResponse.json({
      files: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    })
  } catch (error) {
    console.error('Simple Files API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}