import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      user: session.user,
    })
  } catch (error) {
    console.error('[API] Error getting session:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}
