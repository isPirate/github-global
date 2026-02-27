'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TranslationFile {
  id: string
  filePath: string
  targetLanguage: string
  status: string
  errorMessage?: string
  tokensUsed: number
  createdAt: string
  completedAt?: string
}

interface TranslationTask {
  id: string
  repositoryId: string
  triggerType: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalFiles: number
  processedFiles: number
  failedFiles: number
  totalTokens: number
  errorMessage?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  repository: {
    id: string
    name: string
    fullName: string
  }
  files: TranslationFile[]
}

interface TasksResponse {
  tasks: TranslationTask[]
  totalCount: number
  limit: number
  offset: number
}

const STATUS_LABELS = {
  pending: '等待中',
  processing: '进行中',
  completed: '已完成',
  failed: '失败',
}

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function TasksPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TranslationTask[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TranslationTask | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  const pageSize = 20

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  useEffect(() => {
    checkAuthAndFetch()
  }, [page, filter])

  // Auto-refresh when there are processing tasks
  useEffect(() => {
    const hasProcessingTasks = tasks.some(task => task.status === 'processing')

    if (!hasProcessingTasks) {
      return // No processing tasks, no need to poll
    }

    console.log('[AutoRefresh] Starting auto-poll for processing tasks...')

    // Poll every 5 seconds
    const interval = setInterval(() => {
      console.log('[AutoRefresh] Fetching tasks...')
      fetchTasks()
    }, 5000)

    // Cleanup on unmount or when tasks change
    return () => {
      console.log('[AutoRefresh] Stopping auto-poll')
      clearInterval(interval)
    }
  }, [tasks, page, filter])

  const checkAuthAndFetch = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }

      await fetchTasks()
    } catch (err) {
      console.error('Auth check failed:', err)
      router.push('/login')
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      })

      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data: TasksResponse = await response.json()
      setTasks(data.tasks)
      setTotalCount(data.totalCount)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Failed to load tasks. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetryTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to retry task')
      }

      // Refresh tasks
      await fetchTasks()

      // Close detail modal if open
      if (selectedTask?.id === taskId) {
        setSelectedTask(null)
      }

      alert('Task queued for retry')
    } catch (err) {
      console.error('Error retrying task:', err)
      alert('Failed to retry task')
    }
  }

  const getProgressPercentage = (task: TranslationTask) => {
    if (task.totalFiles === 0) return 0
    return Math.round((task.processedFiles / task.totalFiles) * 100)
  }

  if (loading && page === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading tasks...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← 返回 Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">翻译任务</h1>
            <p className="text-muted-foreground mt-2">
              查看和管理翻译任务的执行状态
            </p>
          </div>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
          >
            刷新
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">状态筛选:</span>
            <button
              onClick={() => {
                setFilter('all')
                setPage(0)
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => {
                setFilter('pending')
                setPage(0)
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'pending'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted'
              }`}
            >
              等待中
            </button>
            <button
              onClick={() => {
                setFilter('processing')
                setPage(0)
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'processing'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted'
              }`}
            >
              进行中
            </button>
            <button
              onClick={() => {
                setFilter('completed')
                setPage(0)
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'completed'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted'
              }`}
            >
              已完成
            </button>
            <button
              onClick={() => {
                setFilter('failed')
                setPage(0)
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'failed'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted'
              }`}
            >
              失败
            </button>
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              {filter === 'all'
                ? '还没有翻译任务。配置仓库翻译后，任务会自动出现在这里。'
                : `没有${STATUS_LABELS[filter as keyof typeof STATUS_LABELS]}的任务。`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border bg-card p-6 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{task.repository.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          STATUS_COLORS[task.status]
                        }`}
                      >
                        {STATUS_LABELS[task.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.triggerType === 'manual' ? '手动触发' : '自动触发'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">
                      {task.processedFiles} / {task.totalFiles} 文件
                    </div>
                    {task.totalFiles > 0 && (
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${getProgressPercentage(task)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {task.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{task.errorMessage}</p>
                  </div>
                )}

                {task.failedFiles > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTaskExpansion(task.id)
                      }}
                      className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                      ⚠️ {task.failedFiles} 个文件翻译失败
                      {expandedTasks.has(task.id) ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}

                {task.totalTokens > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    使用 tokens: {task.totalTokens.toLocaleString()}
                  </div>
                )}

                {/* Expanded file details */}
                {expandedTasks.has(task.id) && task.files && task.files.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">文件详情</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {task.files.map((file) => (
                        <div
                          key={file.id}
                          className={`p-2 rounded border ${
                            file.status === 'completed'
                              ? 'bg-green-50 border-green-200'
                              : file.status === 'failed'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" title={file.filePath}>
                                {file.filePath}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  → {file.targetLanguage}
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    file.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : file.status === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {file.status === 'completed'
                                    ? '成功'
                                    : file.status === 'failed'
                                    ? '失败'
                                    : '处理中'}
                                </span>
                                {file.tokensUsed > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {file.tokensUsed} tokens
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {file.errorMessage && (
                            <p className="text-xs text-red-700 mt-2 font-mono bg-red-100/50 p-1.5 rounded">
                              {file.errorMessage}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-muted-foreground">
              第 {page + 1} 页，共 {Math.ceil(totalCount / pageSize)} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= totalCount}
              className="px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      {tasks.some(task => task.status === 'processing') && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse z-40">
          <span className="animate-spin text-lg">🔄</span>
          <div className="flex flex-col">
            <span className="font-medium text-sm">翻译任务进行中</span>
            <span className="text-xs text-blue-100">状态自动更新中...</span>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTask.repository.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    任务 ID: {selectedTask.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <span
                  className={`text-sm px-3 py-1 rounded ${
                    STATUS_COLORS[selectedTask.status]
                  }`}
                >
                  {STATUS_LABELS[selectedTask.status]}
                </span>
                <span className="text-sm text-muted-foreground">
                  创建于 {new Date(selectedTask.createdAt).toLocaleString('zh-CN')}
                </span>
                {selectedTask.startedAt && (
                  <span className="text-sm text-muted-foreground">
                    开始于 {new Date(selectedTask.startedAt).toLocaleString('zh-CN')}
                  </span>
                )}
                {selectedTask.completedAt && (
                  <span className="text-sm text-muted-foreground">
                    完成于 {new Date(selectedTask.completedAt).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">翻译进度</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedTask.processedFiles} / {selectedTask.totalFiles} 文件
                    {selectedTask.failedFiles > 0 && ` (${selectedTask.failedFiles} 失败)`}
                  </span>
                </div>
                {selectedTask.totalFiles > 0 && (
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${getProgressPercentage(selectedTask)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Error */}
              {selectedTask.errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-medium text-red-800 mb-2">错误信息</h3>
                  <p className="text-sm text-red-700">{selectedTask.errorMessage}</p>
                </div>
              )}

              {/* Retry Button for Failed Tasks */}
              {selectedTask.status === 'failed' && (
                <div className="mb-6">
                  <button
                    onClick={() => handleRetryTask(selectedTask.id)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    重试此任务
                  </button>
                </div>
              )}

              {/* Files */}
              <div>
                <h3 className="font-semibold mb-4">文件列表</h3>
                {selectedTask.files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无文件记录</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {selectedTask.files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 border rounded-md hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.filePath}</p>
                            <p className="text-xs text-muted-foreground">
                              目标语言: {file.targetLanguage}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ml-2 ${
                              STATUS_COLORS[file.status as keyof typeof STATUS_COLORS]
                            }`}
                          >
                            {STATUS_LABELS[file.status as keyof typeof STATUS_LABELS]}
                          </span>
                        </div>

                        {file.errorMessage && (
                          <p className="text-xs text-red-600 mt-2">{file.errorMessage}</p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>创建于 {new Date(file.createdAt).toLocaleString('zh-CN')}</span>
                          {file.completedAt && (
                            <span>
                              完成于 {new Date(file.completedAt).toLocaleString('zh-CN')}
                            </span>
                          )}
                          {file.tokensUsed > 0 && <span>Tokens: {file.tokensUsed}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
