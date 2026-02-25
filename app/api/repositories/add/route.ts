import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { createRepositoryWebhook } from '@/lib/github-app'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { githubRepoId, installationId } = body

    if (!githubRepoId || !installationId) {
      return NextResponse.json(
        { error: 'Missing required fields: githubRepoId, installationId' },
        { status: 400 }
      )
    }

    // Get installation from database
    const installation = await prisma.gitHubAppInstallation.findUnique({
      where: { installationId: BigInt(installationId) },
    })

    if (!installation) {
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
    }

    if (installation.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if repository already exists
    const existingRepo = await prisma.repository.findUnique({
      where: { githubRepoId: BigInt(githubRepoId) },
    })

    if (existingRepo) {
      return NextResponse.json({ error: 'Repository already added' }, { status: 409 })
    }

    // Parse repo full name
    const repoFullName = body.fullName
    const [owner, repoName] = repoFullName.split('/')

    // Create webhook if secret is configured
    let webhookId: string | undefined
    const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET

    if (webhookSecret && owner && repoName) {
      try {
        webhookId = await createRepositoryWebhook(
          installation.installationId.toNumber(),
          owner,
          repoName,
          webhookSecret
        )
      } catch (error) {
        console.error('[API] Failed to create webhook:', error)
        // Continue without webhook
      }
    }

    // Create repository in database
    const repository = await prisma.repository.create({
      data: {
        userId: session.id,
        installationId: installation.id,
        githubRepoId: BigInt(githubRepoId),
        name: repoName,
        fullName: repoFullName,
        description: body.description || null,
        language: body.language || null,
        stargazersCount: body.stargazersCount || 0,
        webhookId,
      },
    })

    return NextResponse.json({
      success: true,
      repository: {
        id: repository.id,
        githubRepoId: repository.githubRepoId.toString(),
        name: repository.name,
        fullName: repository.fullName,
        isActive: repository.isActive,
      },
    })
  } catch (error) {
    console.error('[API] Error adding repository:', error)
    return NextResponse.json(
      { error: 'Failed to add repository', message: String(error) },
      { status: 500 }
    )
  }
}
