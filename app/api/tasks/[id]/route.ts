import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/tasks/[id] - Get task details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    const task = await prisma.translationTask.findFirst({
      where: {
        id: taskId,
        repository: {
          userId: session.user.id,
        },
      },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            fullName: true,
          },
        },
        files: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        history: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('[API] Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task', message: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/retry - Retry a failed task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    // Get the task
    const task = await prisma.translationTask.findFirst({
      where: {
        id: taskId,
        repository: {
          userId: session.user.id,
        },
      },
      include: {
        repository: {
          include: {
            config: true,
            engines: {
              where: { isActive: true },
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed tasks can be retried' },
        { status: 400 }
      )
    }

    // Reset task status
    await prisma.translationTask.update({
      where: { id: taskId },
      data: {
        status: 'pending',
        errorMessage: null,
        processedFiles: 0,
        failedFiles: 0,
      },
    })

    // Re-add to queue
    const { translationQueue } = await import('@/lib/translation/queue')
    const { processTranslationTask } = await import('@/app/api/repositories/[id]/translate/route')

    translationQueue.add(
      async () => {
        await processTranslationTask(taskId, task.repository)
      },
      { taskId }
    )

    return NextResponse.json({
      success: true,
      message: 'Task queued for retry',
    })
  } catch (error) {
    console.error('[API] Error retrying task:', error)
    return NextResponse.json(
      { error: 'Failed to retry task', message: String(error) },
      { status: 500 }
    )
  }
}
