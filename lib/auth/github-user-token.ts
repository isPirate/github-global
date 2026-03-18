import { prisma } from '@/lib/db/prisma'
import {
  getGitHubAppClientId,
  getGitHubAppClientSecret,
} from '@/lib/config/app'
import { refreshUserAccessToken } from '@/lib/github-fetch'

const REFRESH_LEEWAY_MS = 5 * 60 * 1000

type TokenRecord = {
  githubUserAccessToken: string | null
  githubUserAccessTokenExpiresAt: Date | null
  githubUserRefreshToken: string | null
  githubUserRefreshTokenExpiresAt: Date | null
  githubUserTokenScope: string | null
}

function hasUsableAccessToken(record: TokenRecord) {
  if (!record.githubUserAccessToken || !record.githubUserAccessTokenExpiresAt) {
    return false
  }

  return record.githubUserAccessTokenExpiresAt.getTime() - Date.now() > REFRESH_LEEWAY_MS
}

function hasUsableRefreshToken(record: TokenRecord) {
  if (!record.githubUserRefreshToken || !record.githubUserRefreshTokenExpiresAt) {
    return false
  }

  return record.githubUserRefreshTokenExpiresAt.getTime() > Date.now()
}

async function clearGitHubUserTokens(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      githubUserAccessToken: null,
      githubUserAccessTokenExpiresAt: null,
      githubUserRefreshToken: null,
      githubUserRefreshTokenExpiresAt: null,
      githubUserTokenScope: null,
    },
  })
}

export async function getValidGitHubUserAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      githubUserAccessToken: true,
      githubUserAccessTokenExpiresAt: true,
      githubUserRefreshToken: true,
      githubUserRefreshTokenExpiresAt: true,
      githubUserTokenScope: true,
    },
  })

  if (!user) {
    return null
  }

  if (hasUsableAccessToken(user)) {
    return user.githubUserAccessToken
  }

  if (!hasUsableRefreshToken(user)) {
    await clearGitHubUserTokens(userId)
    return null
  }

  const clientId = getGitHubAppClientId()
  const clientSecret = getGitHubAppClientSecret()

  if (!clientId || !clientSecret) {
    throw new Error('GitHub App user authorization credentials not configured')
  }

  try {
    const refreshedToken = await refreshUserAccessToken(
      user.githubUserRefreshToken!,
      clientId,
      clientSecret
    )

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        githubUserAccessToken: refreshedToken.access_token,
        githubUserAccessTokenExpiresAt: refreshedToken.expires_in
          ? new Date(Date.now() + refreshedToken.expires_in * 1000)
          : null,
        githubUserRefreshToken: refreshedToken.refresh_token ?? user.githubUserRefreshToken,
        githubUserRefreshTokenExpiresAt: refreshedToken.refresh_token_expires_in
          ? new Date(Date.now() + refreshedToken.refresh_token_expires_in * 1000)
          : user.githubUserRefreshTokenExpiresAt,
        githubUserTokenScope: refreshedToken.scope || user.githubUserTokenScope,
      },
      select: {
        githubUserAccessToken: true,
      },
    })

    return updatedUser.githubUserAccessToken
  } catch (error) {
    console.error('[Auth] Failed to refresh GitHub App user token:', error)
    await clearGitHubUserTokens(userId)
    return null
  }
}

export async function revokeGitHubUserTokens(userId: string) {
  await clearGitHubUserTokens(userId)
}
