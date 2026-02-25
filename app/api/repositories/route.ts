import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserRepositories } from '@/lib/github-app'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's access token from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        installations: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get GitHub access token from session
    const accessToken = session.user?.accessToken

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found. Please re-login.' },
        { status: 401 }
      )
    }

    // Get repositories from GitHub App installations
    const { installations, repositories } = await getUserRepositories(accessToken)

    // Sync installations to database
    for (const installation of installations) {
      await prisma.gitHubAppInstallation.upsert({
        where: { installationId: BigInt(installation.id) },
        create: {
          userId: user.id,
          installationId: BigInt(installation.id),
          githubAccountId: BigInt(0), // We'll get this from the installation
          accountLogin: installation.account.login,
          accountType: installation.account.type,
          permissions: {},
          repositorySelection: 'all',
        },
        update: {
          accountLogin: installation.account.login,
          accountType: installation.account.type,
        },
      })
    }

    // Get repositories from database that match the user's installations
    const dbRepositories = await prisma.repository.findMany({
      where: {
        userId: user.id,
        installationId: {
          in: installations.map((inst) => inst.id.toString()),
        },
      },
      include: {
        config: true,
      },
    })

    // Combine GitHub repositories with database repositories
    const enrichedRepositories = repositories.map((repo) => {
      const dbRepo = dbRepositories.find((r) => r.githubRepoId === BigInt(repo.id))
      return {
        ...repo,
        isActive: dbRepo?.isActive ?? false,
        hasConfig: !!dbRepo?.config,
        dbId: dbRepo?.id,
      }
    })

    return NextResponse.json({
      installations,
      repositories: enrichedRepositories,
    })
  } catch (error) {
    console.error('[API] Error fetching repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories', message: String(error) },
      { status: 500 }
    )
  }
}
