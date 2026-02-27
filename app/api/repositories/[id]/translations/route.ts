import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/repositories/[id]/translations - Get translation history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repositoryId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify the repository exists and belongs to the user
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Get translation tasks
    const tasks = await prisma.translationTask.findMany({
      where: {
        repositoryId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        files: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Get total count
    const totalCount = await prisma.translationTask.count({
      where: {
        repositoryId,
      },
    })

    return NextResponse.json({
      tasks,
      totalCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[API] Error fetching translations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translations', message: String(error) },
      { status: 500 }
    )
  }
}
