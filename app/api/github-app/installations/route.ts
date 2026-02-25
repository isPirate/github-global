import { NextRequest, NextResponse } from 'next/server'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from 'octokit'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
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

    // Get current user info from session (if available)
    const sessionCookie = request.cookies.get('session')
    let currentUser = null
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(
          Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
        )
        currentUser = sessionData.user
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Format installations for display
    const formattedInstallations = installations.map((inst: any) => ({
      id: inst.id,
      account: inst.account,
      permissions: inst.permissions,
      repository_selection: inst.repository_selection,
      created_at: inst.created_at,
      updated_at: inst.updated_at,
      suspended_at: inst.suspended_at,
      suspended_by: inst.suspended_by,
    }))

    return NextResponse.json({
      success: true,
      total: installations.length,
      installations: formattedInstallations,
      currentUser: currentUser ? {
        username: currentUser.username,
        githubId: currentUser.githubId,
      } : null,
    })
  } catch (error) {
    console.error('[API] Error fetching installations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch installations',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
