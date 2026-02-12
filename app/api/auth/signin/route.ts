import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = process.env.GITHUB_OAUTH_CALLBACK_URL
  const state = Math.random().toString(36).substring(2, 15)

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'read:user,user:email')
  url.searchParams.set('state', state)

  return NextResponse.redirect(url)
}
