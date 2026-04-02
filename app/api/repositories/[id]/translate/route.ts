import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { translationQueue } from '@/lib/translation/queue'
import { processTranslationTask } from '@/lib/translation/process-task'
import { sanitizeWatchedBranches } from '@/lib/repository-config'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/repositories/[id]/translate - Manually trigger translation
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: repositoryId } = await context.params

    // Get repository with configuration
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
      include: {
        config: true,
        engines: {
          where: { isActive: true },
        },
        installation: true,
        user: {
          include: {
            settings: true,
          },
        },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (!repository.config) {
      return NextResponse.json(
        { error: 'Please configure translation settings first' },
        { status: 400 }
      )
    }

    if (!repository.isActive) {
      return NextResponse.json(
        { error: 'Repository is not active. Please enable it first.' },
        { status: 400 }
      )
    }

    if (repository.engines.length === 0) {
      return NextResponse.json(
        { error: 'No active translation engine found. Please configure an engine.' },
        { status: 400 }
      )
    }

    const sourceBranch = sanitizeWatchedBranches(repository.config.watchedBranches)[0] || null

    // Create a translation task
    const task = await prisma.translationTask.create({
      data: {
        repositoryId: repository.id,
        triggerType: 'manual',
        ...(sourceBranch ? { sourceBranch } : {}),
        status: 'pending',
        totalFiles: 0,
        processedFiles: 0,
        failedFiles: 0,
      },
    })

    // Add to translation queue
    translationQueue.add(
      async () => {
        await processTranslationTask(task.id, repository)
      },
      { taskId: task.id }
    )

    return NextResponse.json({
      success: true,
      taskId: task.id,
      sourceBranch,
      message: 'Translation task created successfully',
    })
  } catch (error) {
    console.error('[API] Error triggering translation:', error)
    return NextResponse.json(
      { error: 'Failed to trigger translation', message: String(error) },
      { status: 500 }
    )
  }
}
