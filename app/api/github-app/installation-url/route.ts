import { NextResponse } from 'next/server'
import { getGitHubAppSlug } from '@/lib/config/app'

export async function GET() {
  try {
    const appSlug = getGitHubAppSlug()

    if (!appSlug) {
      return NextResponse.json(
        { error: 'GitHub App slug not configured' },
        { status: 500 }
      )
    }

    // GitHub App installation URL format
    // Use /installations/new for new installations
    const installationUrl = `https://github.com/apps/${appSlug}/installations/new`
    const appUrl = `https://github.com/apps/${appSlug}`

    return NextResponse.json({
      installationUrl,
      appUrl,
      appName: appSlug,
      appSlug,
    })
  } catch (error) {
    console.error('[API] Error getting installation URL:', error)
    return NextResponse.json(
      { error: 'Failed to get installation URL' },
      { status: 500 }
    )
  }
}
