import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { deleteRepositoryWebhook } from '@/lib/github-app'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get repository
    const repository = await prisma.repository.findUnique({
      where: { id },
      include: {
        installation: true,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (repository.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete webhook if exists
    if (repository.webhookId && repository.installation) {
      try {
        const [owner, repoName] = repository.fullName.split('/')
        await deleteRepositoryWebhook(
          Number(repository.installation.installationId),
          owner,
          repoName,
          repository.webhookId
        )
      } catch (error) {
        console.error('[API] Failed to delete webhook:', error)
        // Continue with deletion
      }
    }

    // Delete repository (cascade will handle related records)
    await prisma.repository.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting repository:', error)
    return NextResponse.json(
      { error: 'Failed to delete repository', message: String(error) },
      { status: 500 }
    )
  }
}
