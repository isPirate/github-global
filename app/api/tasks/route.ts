import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/tasks - Get all tasks for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const repositoryId = searchParams.get('repositoryId')

    // Build where clause
    const where: any = {
      repository: {
        userId: session.user.id,
      },
    }

    if (status) {
      where.status = status
    }

    if (repositoryId) {
      where.repositoryId = repositoryId
    }

    // Get tasks
    const tasks = await prisma.translationTask.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            fullName: true,
          },
        },
        files: {
          take: 50,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Get total count
    const totalCount = await prisma.translationTask.count({ where })

    return NextResponse.json({
      tasks,
      totalCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[API] Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks', message: String(error) },
      { status: 500 }
    )
  }
}
