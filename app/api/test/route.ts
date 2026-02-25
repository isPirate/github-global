import { NextResponse } from 'next/server'
import { githubFetch } from '@/lib/github-fetch'

export async function GET() {
  try {
    console.log('[Test] Starting GitHub API connection test...')

    // Test 1: Fetch GitHub API root
    const response = await githubFetch('https://api.github.com', {
      headers: {
        'User-Agent': 'GitHub-Global-Test',
      },
    })

    console.log('[Test] GitHub API response status:', response.status)

    const result = {
      success: true,
      status: response.status,
      message: 'Successfully connected to GitHub API',
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Test] Connection failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.cause : error,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
