import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSession } from '@/lib/auth/session'
import {
  exchangeCodeForToken,
  fetchGitHubUser,
  fetchGitHubEmails,
} from '@/lib/github-fetch'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 如果 GitHub 返回错误
  if (error) {
    console.error('GitHub OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${error}&description=${encodeURIComponent(errorDescription || '')}`, request.url)
    )
  }

  if (!code) {
    console.error('Missing authorization code')
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }

  try {
    console.log('[OAuth] Starting token exchange...')

    // 从环境变量获取配置
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials not configured')
    }

    // 交换 code for access token
    const tokenData = await exchangeCodeForToken(code, clientId, clientSecret)
    console.log('[OAuth] Token obtained successfully')

    // 获取用户信息
    const userData = await fetchGitHubUser(tokenData.access_token)
    console.log('[OAuth] User data fetched:', userData.login)

    // 获取用户邮箱
    let primaryEmail = userData.email
    try {
      const emails = await fetchGitHubEmails(tokenData.access_token)
      primaryEmail = emails.find((e) => e.primary)?.email || userData.email
      console.log('[OAuth] Email fetched:', primaryEmail)
    } catch (emailError) {
      console.warn('[OAuth] Failed to fetch emails, using user email:', emailError)
    }

    console.log('[OAuth] Creating/updating user in database...')

    // 创建或更新用户
    const user = await prisma.user.upsert({
      where: { githubId: userData.id.toString() },
      update: {
        username: userData.login,
        email: primaryEmail,
        avatarUrl: userData.avatar_url,
      },
      create: {
        githubId: userData.id.toString(),
        username: userData.login,
        email: primaryEmail,
        avatarUrl: userData.avatar_url,
      },
    })

    console.log('[OAuth] User created/updated:', user.id)

    // 创建 session
    await createSession({
      id: user.id,
      githubId: user.githubId,
      username: user.username,
      email: user.email || '',
      avatarUrl: user.avatarUrl,
    })

    console.log('[OAuth] Session created, redirecting to dashboard')

    // 重定向到 dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('[OAuth] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
