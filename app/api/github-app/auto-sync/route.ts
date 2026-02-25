import { NextRequest, NextResponse } from 'next/server'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from 'octokit'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    )
    const currentUser = sessionData.user

    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const appId = process.env.GITHUB_APP_ID
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY

    if (!appId || !privateKey) {
      return NextResponse.json(
        { error: 'GitHub App credentials not configured' },
        { status: 500 }
      )
    }

    // Create GitHub App JWT auth
    const auth = createAppAuth({
      appId: parseInt(appId),
      privateKey: privateKey,
    })

    // Get app authentication token
    const appAuth = await auth({
      type: 'app',
    })

    const octokit = new Octokit({
      auth: appAuth.token,
    })

    // Get all installations for this GitHub App
    const installationsResponse = await octokit.rest.apps.listInstallations({
      per_page: 100,
    })

    const installations = installationsResponse.data

    // Find installations for the current user
    const userInstallations = installations.filter(
      (inst: any) => inst.account.login === currentUser.username
    )

    if (userInstallations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No installations found for your account',
        found: 0,
      })
    }

    // Sync installations to database
    let syncedCount = 0
    for (const installation of userInstallations) {
      try {
        await prisma.gitHubAppInstallation.upsert({
          where: { installationId: BigInt(installation.id) },
          create: {
            userId: currentUser.id,
            installationId: BigInt(installation.id),
            githubAccountId: BigInt(installation.account.id),
            accountLogin: installation.account.login,
            accountType: installation.account.type || 'User',
            permissions: installation.permissions || {},
            repositorySelection: installation.repository_selection || 'all',
          },
          update: {
            accountLogin: installation.account.login,
            accountType: installation.account.type || 'User',
            permissions: installation.permissions || {},
            repositorySelection: installation.repository_selection || 'all',
          },
        })

        syncedCount++
        console.log('[Sync] Synced installation:', installation.id, 'for user:', currentUser.username)
      } catch (error) {
        console.error('[Sync] Failed to sync installation:', installation.id, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} installation(s)`,
      synced: syncedCount,
    })
  } catch (error) {
    console.error('[Sync] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync installations',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
