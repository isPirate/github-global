import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getGitHubAppSlug } from '@/lib/config/app'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const appId = process.env.GITHUB_APP_ID

    if (!appId) {
      return NextResponse.json(
        { error: 'GitHub App ID not configured' },
        { status: 500 }
      )
    }

    const appSlug = getGitHubAppSlug()

    if (!appSlug) {
      return NextResponse.json(
        { error: 'GitHub App slug not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      appId,
      slug: appSlug,
      installationUrl: `https://github.com/apps/${appSlug}/installations/new`,
      appUrl: `https://github.com/apps/${appSlug}`,
      appName: appSlug,
    })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get install link', message: String(error) },
      { status: 500 }
    )
  }
}
