import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSession } from '@/lib/auth/session'
import {
  exchangeCodeForToken,
  fetchGitHubUser,
  fetchGitHubEmails,
} from '@/lib/github-fetch'
import {
  getAppBaseUrl,
  getGitHubAppClientId,
  getGitHubAppClientSecret,
  getGitHubAppUserCallbackUrl,
} from '@/lib/config/app'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const appBaseUrl = getAppBaseUrl()
  const redirectUri = getGitHubAppUserCallbackUrl()

  // 如果 GitHub 返回错误
  if (error) {
    console.error('GitHub App user authorization error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/?error=${error}&description=${encodeURIComponent(errorDescription || '')}`, appBaseUrl)
    )
  }

  if (!code) {
    console.error('Missing authorization code')
    return NextResponse.redirect(new URL('/?error=missing_code', appBaseUrl))
  }

  try {
    console.log('[GitHub App Auth] Starting token exchange...')

    const clientId = getGitHubAppClientId()
    const clientSecret = getGitHubAppClientSecret()

    if (!clientId || !clientSecret) {
      throw new Error('GitHub App user authorization credentials not configured')
    }

    const tokenData = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri)
    console.log('[GitHub App Auth] Token obtained successfully')

    const userData = await fetchGitHubUser(tokenData.access_token)
    console.log('[GitHub App Auth] User data fetched:', userData.login)

    let primaryEmail = userData.email
    try {
      const emails = await fetchGitHubEmails(tokenData.access_token)
      primaryEmail = emails.find((e) => e.primary)?.email || userData.email
      console.log('[GitHub App Auth] Email fetched:', primaryEmail)
    } catch (emailError) {
      console.warn('[GitHub App Auth] Failed to fetch emails, using user email:', emailError)
    }

    console.log('[GitHub App Auth] Creating/updating user in database...')

    const user = await prisma.user.upsert({
      where: { githubId: userData.id.toString() },
      update: {
        username: userData.login,
        email: primaryEmail,
        avatarUrl: userData.avatar_url,
        githubUserAccessToken: tokenData.access_token,
        githubUserAccessTokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        githubUserRefreshToken: tokenData.refresh_token || null,
        githubUserRefreshTokenExpiresAt: tokenData.refresh_token_expires_in
          ? new Date(Date.now() + tokenData.refresh_token_expires_in * 1000)
          : null,
        githubUserTokenScope: tokenData.scope || null,
      },
      create: {
        githubId: userData.id.toString(),
        username: userData.login,
        email: primaryEmail,
        avatarUrl: userData.avatar_url,
        githubUserAccessToken: tokenData.access_token,
        githubUserAccessTokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        githubUserRefreshToken: tokenData.refresh_token || null,
        githubUserRefreshTokenExpiresAt: tokenData.refresh_token_expires_in
          ? new Date(Date.now() + tokenData.refresh_token_expires_in * 1000)
          : null,
        githubUserTokenScope: tokenData.scope || null,
      },
    })

    console.log('[GitHub App Auth] User created/updated:', user.id)

    await createSession({
      id: user.id,
      githubId: user.githubId,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    })

    console.log('[GitHub App Auth] Session created, redirecting to dashboard')

    return NextResponse.redirect(new URL('/dashboard', appBaseUrl))
  } catch (error) {
    console.error('[GitHub App Auth] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.redirect(
      new URL(`/?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`, appBaseUrl)
    )
  }
}
