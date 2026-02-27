import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// POST /api/repositories/[id]/disable - Disable translation for a repository
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repositoryId = params.id

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

    // Disable the repository
    const updatedRepository = await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({
      success: true,
      repository: {
        id: updatedRepository.id,
        name: updatedRepository.name,
        isActive: updatedRepository.isActive,
      },
    })
  } catch (error) {
    console.error('[API] Error disabling repository:', error)
    return NextResponse.json(
      { error: 'Failed to disable repository', message: String(error) },
      { status: 500 }
    )
  }
}
