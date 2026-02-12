import PQueue from 'p-queue'

export interface TranslationTask {
  id: string
  handler: () => Promise<void>
}

export class TranslationQueue {
  private queue: PQueue
  private static instance: TranslationQueue

  private constructor() {
    const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '5', 10)

    // 配置并发队列
    this.queue = new PQueue({
      concurrency,
      timeout: 1000 * 60 * 30, // 单个任务超时 30 分钟
      throwOnTimeout: true,
    })

    // 错误处理
    this.queue.on('error', (error) => {
      console.error('Translation queue error:', error)
    })

    // 任务完成日志
    this.queue.on('completed', (result) => {
      console.log('Translation task completed:', result)
    })

    // 任务失败日志
    this.queue.on('failed', (error, task) => {
      console.error('Translation task failed:', error, task)
    })
  }

  // 单例模式
  static getInstance(): TranslationQueue {
    if (!this.instance) {
      this.instance = new TranslationQueue()
    }
    return this.instance
  }

  // 添加翻译任务
  async addTranslationTask(handler: () => Promise<void>): Promise<void> {
    return this.queue.add(handler)
  }

  // 获取队列状态
  getStatus() {
    return {
      size: this.queue.size, // 等待中的任务数
      pending: this.queue.pending, // 正在处理的任务数
      isPaused: this.queue.isPaused,
    }
  }

  // 暂停队列
  pause(): void {
    this.queue.pause()
  }

  // 恢复队列
  start(): void {
    this.queue.start()
  }

  // 清空队列
  clear(): void {
    this.queue.clear()
  }
}
