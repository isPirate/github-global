import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// POST /api/repositories/[id]/enable - Enable translation for a repository
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
      include: {
        config: true,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Check if configuration exists
    if (!repository.config) {
      return NextResponse.json(
        { error: 'Please configure translation settings first' },
        { status: 400 }
      )
    }

    // Enable the repository
    const updatedRepository = await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        isActive: true,
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
    console.error('[API] Error enabling repository:', error)
    return NextResponse.json(
      { error: 'Failed to enable repository', message: String(error) },
      { status: 500 }
    )
  }
}
