import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createUserClient } from '@/lib/github-app'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get GitHub App credentials
    const appId = process.env.GITHUB_APP_ID

    if (!appId) {
      return NextResponse.json(
        { error: 'GitHub App ID not configured' },
        { status: 500 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use user's OAuth token to get their GitHub App installations
    const userClient = createUserClient(session.user.accessToken)

    try {
      // Get all installations for the authenticated user
      const response = await userClient.request('GET /user/installations', {
        headers: {
          accept: 'application/vnd.github.v3+json',
        },
      })

      const installations = response.data as any[]

      // Filter installations for our GitHub App
      const appInstallations = installations.filter((inst) => {
        return inst.app_id && inst.app_id.toString() === appId
      })

      if (appInstallations.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No installations found for this GitHub App',
          synced: 0,
        })
      }

      // Sync installations to database
      let syncedCount = 0
      for (const installation of appInstallations) {
        try {
          const account = installation.account

          await prisma.gitHubAppInstallation.upsert({
            where: { installationId: BigInt(installation.id) },
            create: {
              userId: user.id,
              installationId: BigInt(installation.id),
              githubAccountId: BigInt(account.id),
              accountLogin: account.login,
              accountType: account.type,
              permissions: installation.permissions || {},
              repositorySelection: installation.repository_selection || 'all',
            },
            update: {
              accountLogin: account.login,
              accountType: account.type,
              permissions: installation.permissions || {},
              repositorySelection: installation.repository_selection || 'all',
            },
          })

          syncedCount++
          console.log('[Sync] Synced installation:', installation.id, 'for user:', user.username)
        } catch (error) {
          console.error('[Sync] Failed to sync installation:', installation.id, error)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${syncedCount} installation(s)`,
        synced: syncedCount,
      })
    } catch (apiError: any) {
      console.error('[Sync] Error fetching installations:', apiError)

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch installations from GitHub',
        message: apiError.message,
        details: 'Make sure your GitHub App has the correct permissions and you have installed it.',
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[Sync] Error:', error)
    return NextResponse.json(
      { error: 'Failed to sync installations', message: String(error) },
      { status: 500 }
    )
  }
}
