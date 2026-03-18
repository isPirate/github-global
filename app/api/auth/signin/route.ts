import { NextRequest, NextResponse } from 'next/server'
import {
  getGitHubAppClientId,
  getGitHubAppUserCallbackUrl,
} from '@/lib/config/app'

export async function GET(request: NextRequest) {
  const clientId = getGitHubAppClientId()
  const redirectUri =
    getGitHubAppUserCallbackUrl() ||
    new URL('/api/auth/callback', request.nextUrl.origin).toString()
  const state = Math.random().toString(36).substring(2, 15)

  if (!clientId) {
    return NextResponse.json(
      { error: 'GitHub App user authorization environment variables are not configured' },
      { status: 500 }
    )
  }

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'read:user,user:email')
  url.searchParams.set('state', state)

  return NextResponse.redirect(url)
}
