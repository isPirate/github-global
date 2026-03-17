import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth/session'
import { getAppBaseUrl } from '@/lib/config/app'

export async function POST(request: NextRequest) {
  await deleteSession()

  return NextResponse.redirect(new URL('/', getAppBaseUrl()))
}

export async function GET(request: NextRequest) {
  return POST(request)
}
