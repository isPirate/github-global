import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// Debug endpoint to check database state
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all repositories for this user with installation info
    const repositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        installation: true,
        config: true,
      },
    })

    return NextResponse.json({
      user: session.user.id,
      repositories: repositories.map(r => ({
        id: r.id,
        githubRepoId: r.githubRepoId.toString(),
        name: r.name,
        installationId: r.installationId,
        installation: r.installation ? {
          id: r.installation.id,
          installationId: r.installation.installationId.toString(),
          accountLogin: r.installation.accountLogin,
        } : null,
        hasConfig: !!r.config,
      })),
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed', message: String(error) },
      { status: 500 }
    )
  }
}
