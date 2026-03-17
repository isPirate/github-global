import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { translationQueue } from '@/lib/translation/queue'
import { processTranslationTask } from '@/lib/translation/process-task'

type GitHubWebhookPayload = {
  action?: string
  after?: string
  ref?: string
  deleted?: boolean
  installation?: {
    id?: number
    account_type?: string
    permissions?: Record<string, unknown>
    repository_selection?: string
  }
  sender?: {
    id: number
    login: string
    type?: string
  }
  repository?: {
    id?: number
    full_name?: string
    default_branch?: string
  }
}

const SYSTEM_EVENTS = new Set(['installation', 'installation_repositories'])

function buildExpectedSignature(payload: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
}

function isSignatureValid(payload: string, signature: string, secret: string) {
  const signatureParts = signature.split('=')
  if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
    return false
  }

  const expectedSignature = buildExpectedSignature(payload, secret)

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

async function syncInstallationEvent(payload: GitHubWebhookPayload) {
  const installation = payload.installation
  const sender = payload.sender

  if (!installation?.id || !sender) {
    return
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { githubId: sender.id.toString() },
        { username: sender.login },
      ],
    },
  })

  if (!user) {
    return
  }

  const action = payload.action
  const accountType = installation.account_type || sender.type || 'User'

  if (action === 'created' || action === 'added') {
    await prisma.gitHubAppInstallation.upsert({
      where: { installationId: BigInt(installation.id) },
      create: {
        userId: user.id,
        installationId: BigInt(installation.id),
        githubAccountId: BigInt(sender.id),
        accountLogin: sender.login,
        accountType,
        permissions: installation.permissions || {},
        repositorySelection: installation.repository_selection || 'all',
      },
      update: {
        accountLogin: sender.login,
        accountType,
        permissions: installation.permissions || {},
        repositorySelection: installation.repository_selection || 'all',
      },
    })

    console.log('[Webhook] Installation created/updated for user:', user.username)
  } else if (action === 'deleted') {
    await prisma.gitHubAppInstallation.deleteMany({
      where: { installationId: BigInt(installation.id) },
    })

    console.log('[Webhook] Installation deleted')
  }
}

async function queueWebhookTranslationTask(params: {
  payload: GitHubWebhookPayload
  deliveryId: string
  eventType: string
}) {
  const { payload, deliveryId, eventType } = params

  if (!payload.repository?.id) {
    return { repositoryId: null as string | null, queued: false, reason: 'missing_repository' }
  }

  const repository = await prisma.repository.findUnique({
    where: {
      githubRepoId: BigInt(payload.repository.id),
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
    return { repositoryId: null as string | null, queued: false, reason: 'repository_not_found' }
  }

  const defaultBranch = payload.repository.default_branch || 'main'

  if (eventType === 'push') {
    if (payload.deleted) {
      return { repositoryId: repository.id, queued: false, reason: 'deleted_ref' }
    }

    const expectedRef = `refs/heads/${defaultBranch}`
    if (payload.ref !== expectedRef) {
      return { repositoryId: repository.id, queued: false, reason: 'non_default_branch' }
    }
  }

  if (!repository.isActive) {
    return { repositoryId: repository.id, queued: false, reason: 'repository_disabled' }
  }

  if (!repository.config) {
    return { repositoryId: repository.id, queued: false, reason: 'missing_config' }
  }

  if (repository.config.triggerMode !== 'webhook') {
    return { repositoryId: repository.id, queued: false, reason: 'trigger_mode_manual' }
  }

  if (repository.engines.length === 0) {
    return { repositoryId: repository.id, queued: false, reason: 'missing_engine' }
  }

  const commitSha = payload.after || null

  if (commitSha) {
    const existingTask = await prisma.translationTask.findFirst({
      where: {
        repositoryId: repository.id,
        triggerType: 'webhook',
        triggerCommitSha: commitSha,
      },
    })

    if (existingTask) {
      return { repositoryId: repository.id, queued: false, reason: 'duplicate_commit' }
    }
  }

  const task = await prisma.translationTask.create({
    data: {
      repositoryId: repository.id,
      triggerType: 'webhook',
      triggerCommitSha: commitSha,
      status: 'pending',
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: 0,
    },
  })

  await prisma.translationHistory.create({
    data: {
      taskId: task.id,
      repositoryId: repository.id,
      eventType: 'created',
      eventData: {
        triggerType: 'webhook',
        eventType,
        action: payload.action || null,
        deliveryId,
        ref: payload.ref || null,
        after: payload.after || null,
        defaultBranch,
        timestamp: new Date().toISOString(),
      },
    },
  })

  translationQueue.add(
    async () => {
      await processTranslationTask(task.id, repository)
    },
    { taskId: task.id }
  )

  console.log('[Webhook] Queued translation task:', task.id, 'repository:', repository.fullName, 'event:', eventType)

  return {
    repositoryId: repository.id,
    queued: true,
    reason: 'queued',
    taskId: task.id,
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (!isSignatureValid(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody) as GitHubWebhookPayload
    const deliveryId = request.headers.get('x-github-delivery')
    const eventType = request.headers.get('x-github-event')

    if (!deliveryId) {
      return NextResponse.json({ error: 'Missing delivery ID' }, { status: 400 })
    }

    console.log('[Webhook] Received event:', eventType, 'delivery:', deliveryId)

    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { githubDeliveryId: deliveryId },
    })

    if (existingEvent?.processed) {
      return NextResponse.json({ message: 'Already processed' }, { status: 200 })
    }

    let webhookRepositoryId: string | null = null
    let webhookResult: Record<string, unknown> | null = null

    if (eventType && SYSTEM_EVENTS.has(eventType)) {
      const repository = payload.repository?.id
        ? await prisma.repository.findUnique({
            where: { githubRepoId: BigInt(payload.repository.id) },
            select: { id: true },
          })
        : null

      webhookRepositoryId = repository?.id || null
      await syncInstallationEvent(payload)
    } else if (eventType) {
      const result = await queueWebhookTranslationTask({ payload, deliveryId, eventType })
      webhookRepositoryId = result.repositoryId
      webhookResult = result
    }

    await prisma.webhookEvent.create({
      data: {
        repositoryId: webhookRepositoryId,
        githubDeliveryId: deliveryId,
        eventType: eventType || 'unknown',
        payload: payload as any,
        processed: true,
        processedAt: new Date(),
        receivedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      eventType,
      ...(webhookResult ? { result: webhookResult } : {}),
    })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error', message: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub Webhook endpoint is ready',
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'X-Hub-Signature-256': 'sha256=<signature>',
    },
  })
}
