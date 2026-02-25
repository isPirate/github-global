import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createUserClient } from '@/lib/github-app'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user?.accessToken) {
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

    // Use the user's access token to query GitHub API
    const userClient = createUserClient(session.user.accessToken)

    // Try to get the App info
    try {
      // Method 1: Try to get app by ID
      const appResponse = await userClient.request('GET /apps/{app_id}', {
        app_id: parseInt(appId),
      })

      const appData = appResponse.data as any
      const slug = appData.slug

      // Generate the correct installation URL
      // Use /installations/new for new installations
      const installationUrl = `https://github.com/apps/${slug}/installations/new`
      const appUrl = `https://github.com/apps/${slug}`

      return NextResponse.json({
        appId,
        slug,
        installationUrl,
        appUrl,
        appName: appData.name,
      })
    } catch (apiError: any) {
      console.error('[API] Error fetching app info:', apiError)

      // If API fails, fall back to slug conversion
      const appName = process.env.GITHUB_APP_NAME || ''
      const fallbackSlug = appName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')

      return NextResponse.json({
        appId,
        slug: fallbackSlug,
        installationUrl: `https://github.com/apps/${fallbackSlug}/installations/new`,
        appUrl: `https://github.com/apps/${fallbackSlug}`,
        error: 'Could not fetch from GitHub API, using fallback',
        apiError: apiError.message,
      })
    }
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get install link', message: String(error) },
      { status: 500 }
    )
  }
}
