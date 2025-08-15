import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      message: 'Upload endpoint test',
      authenticated: !!session,
      methods: ['POST'],
      note: 'Use POST method for actual uploads'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Upload endpoint is working',
      user: session.user.id,
      note: 'This is a test - actual upload logic is in /api/upload'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Test upload failed' },
      { status: 500 }
    )
  }
}