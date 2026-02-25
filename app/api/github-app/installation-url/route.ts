import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const appName = process.env.GITHUB_APP_NAME

    if (!appName) {
      return NextResponse.json(
        { error: 'GitHub App name not configured' },
        { status: 500 }
      )
    }

    // Convert app name to URL slug format:
    // - Convert to lowercase
    // - Replace spaces with hyphens
    // - Remove special characters
    const appSlug = appName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens

    // GitHub App installation URL format
    // Use /installations/new for new installations
    const installationUrl = `https://github.com/apps/${appSlug}/installations/new`
    const appUrl = `https://github.com/apps/${appSlug}`

    return NextResponse.json({
      installationUrl,
      appUrl,
      appName,
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
