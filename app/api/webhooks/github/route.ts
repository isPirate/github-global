import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getGitHubAppManager } from '@/lib/github/app'
import { GitHubPushEvent } from '@/lib/github/types'
import { TranslationQueue } from '@/lib/translation/queue'

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // 验证签名
    const manager = getGitHubAppManager()
    const isValid = manager.verifyWebhookSignature(rawBody, signature)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 解析 payload
    const payload = JSON.parse(rawBody) as GitHubPushEvent
    const deliveryId = request.headers.get('x-github-delivery')

    if (!deliveryId) {
      return NextResponse.json({ error: 'Missing delivery ID' }, { status: 400 })
    }

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
        eventType: 'push',
        payload: payload as any,
        repositoryId: payload.repository.id.toString(),
        receivedAt: new Date(),
      },
    })

    // 只处理 push 事件
    if (payload.ref.startsWith('refs/heads/')) {
      // 查找仓库
      const repository = await prisma.repository.findUnique({
        where: { githubRepoId: BigInt(payload.repository.id) },
        include: {
          config: true,
        },
      })

      if (repository && repository.config) {
        // 检查触发模式
        if (repository.config.triggerMode === 'webhook') {
          // 提取变更文件
          const changedFiles: string[] = []
          for (const commit of payload.commits) {
            changedFiles.push(...commit.added, ...commit.modified)
          }

          // 过滤需要翻译的文件
          const filePatterns = repository.config.filePatterns as string[]
          const filesToTranslate = changedFiles.filter((file) => {
            // 检查文件扩展名
            if (!file.match(/\.(md|markdown|txt)$/i)) {
              return false
            }

            // 检查是否匹配包含模式
            const isIncluded = filePatterns.some((pattern) => {
              const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
              const regex = new RegExp(regexPattern)
              return regex.test(file)
            })

            return isIncluded
          })

          if (filesToTranslate.length > 0) {
            // 创建翻译任务
            const task = await prisma.translationTask.create({
              data: {
                repositoryId: repository.id,
                triggerType: 'webhook',
                triggerCommitSha: payload.after,
                status: 'pending',
                totalFiles: filesToTranslate.length,
              },
            })

            // 添加到队列（异步处理）
            const queue = TranslationQueue.getInstance()
            await queue.addTranslationTask(async () => {
              // TODO: 实现实际的翻译逻辑
              console.log(`Processing translation task ${task.id} for ${filesToTranslate.length} files`)
            })

            console.log(`Translation task ${task.id} created for ${filesToTranslate.length} files`)
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
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
