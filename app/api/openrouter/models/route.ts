import { NextResponse } from 'next/server'

// GET /api/openrouter/models - Get available models from OpenRouter
export async function GET() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter and sort models
    const models = data.data
      .filter((model: any) => model.id && model.name)
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json({ models })
  } catch (error) {
    console.error('[API] Error fetching OpenRouter models:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch models',
        models: [], // Return empty array on error
      },
      { status: 500 }
    )
  }
}
