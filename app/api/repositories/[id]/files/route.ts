import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getGitHubAppManager } from '@/lib/github/app'
import { isLikelyTranslatableDocument, resolvePreferredBranch } from '@/lib/repository-config'

type RouteContext = {
  params: Promise<{ id: string }>
}

function splitPath(path: string) {
  const lastSlashIndex = path.lastIndexOf('/')

  return {
    directory: lastSlashIndex >= 0 ? path.slice(0, lastSlashIndex) : '',
    extension: path.includes('.') ? path.slice(path.lastIndexOf('.') + 1).toLowerCase() : '',
  }
}

// GET /api/repositories/[id]/files - Get candidate repository files for manual selection
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
        config: true,
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

    const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
    const defaultBranch = repoData.default_branch || 'main'
    const sourceBranch = resolvePreferredBranch(defaultBranch, repository.config?.watchedBranches)

    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${sourceBranch}`,
    })

    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: refData.object.sha,
      recursive: 'true',
    })

    const files = treeData.tree
      .filter((item) => item.type === 'blob' && typeof item.path === 'string')
      .filter((item) => isLikelyTranslatableDocument(item.path as string))
      .map((item) => {
        const path = item.path as string
        const { directory, extension } = splitPath(path)

        return {
          path,
          directory,
          extension,
          isDocumentationCandidate: true,
        }
      })
      .sort((left, right) => left.path.localeCompare(right.path))

    return NextResponse.json({
      files,
      totalCount: files.length,
      defaultBranch,
      sourceBranch,
    })
  } catch (error) {
    console.error('[API] Error fetching repository files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repository files', message: String(error) },
      { status: 500 }
    )
  }
}
