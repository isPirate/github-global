import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getGitHubAppManager } from '@/lib/github/app'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/repositories/[id]/branches - Get repository branches for watched-branch selection
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: repositoryId } = await context.params

    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
      include: {
        installation: true,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (!repository.installation) {
      return NextResponse.json({ error: 'Repository installation not found' }, { status: 400 })
    }

    const [owner, repo] = repository.fullName.split('/')
    const appManager = getGitHubAppManager()
    const octokit = await appManager.getInstallationOctokit(Number(repository.installation.installationId))

    const [{ data: repoData }, { data: branchData }] = await Promise.all([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      }),
    ])

    const defaultBranch = repoData.default_branch || 'main'
    const branches = branchData
      .map((branch) => branch.name)
      .filter(Boolean)
      .sort((left, right) => {
        if (left === defaultBranch) {
          return -1
        }
        if (right === defaultBranch) {
          return 1
        }
        return left.localeCompare(right)
      })

    return NextResponse.json({
      branches,
      defaultBranch,
    })
  } catch (error) {
    console.error('[API] Error fetching repository branches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repository branches', message: String(error) },
      { status: 500 }
    )
  }
}
