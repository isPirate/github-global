import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // 验证签名
    const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const signatureParts = signature.split('=')
    if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 })
    }

    const hmac = crypto.createHmac('sha256', webhookSecret)
    hmac.update(rawBody)
    const digest = hmac.digest('hex')
    const expectedSignature = `sha256=${digest}`

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 解析 payload
    const payload = JSON.parse(rawBody)
    const deliveryId = request.headers.get('x-github-delivery')
    const eventType = request.headers.get('x-github-event')

    if (!deliveryId) {
      return NextResponse.json({ error: 'Missing delivery ID' }, { status: 400 })
    }

    console.log('[Webhook] Received event:', eventType, 'delivery:', deliveryId)

    // 检查是否已处理（幂等性）
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { githubDeliveryId: deliveryId },
    })

    if (existingEvent?.processed) {
      return NextResponse.json({ message: 'Already processed' }, { status: 200 })
    }

    // 记录 webhook 事件
    await prisma.webhookEvent.create({
      data: {
        githubDeliveryId: deliveryId,
        eventType: eventType || 'unknown',
        payload: payload as any,
        receivedAt: new Date(),
      },
    })

    // 处理 installation 事件
    if (eventType === 'installation' || eventType === 'installation_repositories') {
      const installation = payload.installation
      const sender = payload.sender

      if (installation && sender) {
        // 查找用户
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { githubId: sender.id.toString() },
              { username: sender.login },
            ],
          },
        })

        if (user) {
          const action = payload.action

          if (action === 'created' || action === 'added') {
            // 创建或更新 installation 记录
            await prisma.gitHubAppInstallation.upsert({
              where: { installationId: BigInt(installation.id) },
              create: {
                userId: user.id,
                installationId: BigInt(installation.id),
                githubAccountId: BigInt(sender.id),
                accountLogin: sender.login,
                accountType: installation.account_type,
                permissions: installation.permissions || {},
                repositorySelection: installation.repository_selection || 'all',
              },
              update: {
                accountLogin: sender.login,
                accountType: installation.account_type,
                permissions: installation.permissions || {},
                repositorySelection: installation.repository_selection || 'all',
              },
            })

            console.log('[Webhook] Installation created/updated for user:', user.username)
          } else if (action === 'deleted') {
            // 删除 installation 记录
            await prisma.gitHubAppInstallation.deleteMany({
              where: { installationId: BigInt(installation.id) },
            })

            console.log('[Webhook] Installation deleted')
          }
        }
      }
    }

    // 标记为已处理
    await prisma.webhookEvent.update({
      where: { githubDeliveryId: deliveryId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error', message: String(error) }, { status: 500 })
  }
}

// Also handle GET requests for debugging
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'GitHub Webhook endpoint is ready',
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'X-Hub-Signature-256': 'sha256=<signature>',
    },
  })
}
