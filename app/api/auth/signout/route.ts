import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, getSession } from '@/lib/auth/session'
import { getAppBaseUrl } from '@/lib/config/app'
import { revokeGitHubUserTokens } from '@/lib/auth/github-user-token'

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (session) {
    await revokeGitHubUserTokens(session.user.id)
  }

  await deleteSession()

  return NextResponse.redirect(new URL('/', getAppBaseUrl()))
}

export async function GET(request: NextRequest) {
  return POST(request)
}
