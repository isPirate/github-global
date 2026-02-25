import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/github-fetch'

export async function GET(request: NextRequest) {
  try {
    console.log('[Test OAuth] Testing GitHub OAuth token exchange...')

    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub OAuth credentials not configured',
          clientId: !!clientId,
          clientSecret: !!clientSecret,
        },
        { status: 500 }
      )
    }

    // Test with a dummy code (will fail but shows if endpoint is reachable)
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'GitHub-Global-App',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: 'test_dummy_code',
        }).toString(),
      })

      const result = await response.json()
      console.log('[Test OAuth] Response:', result)

      return NextResponse.json({
        success: true,
        message: 'OAuth endpoint is reachable',
        response: result,
        clientId: clientId.substring(0, 10) + '...',
        clientSecretConfigured: !!clientSecret,
      })
    } catch (fetchError) {
      console.error('[Test OAuth] Fetch error:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to reach OAuth endpoint',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Test OAuth] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
