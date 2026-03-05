'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ClientAppLayout from '@/components/client-app-layout'
import {
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/components/toast/use-toast'
import { cn } from '@/lib/utils'

interface TranslationFile {
  id: string
  filePath: string
  targetLanguage: string
  status: string
  errorMessage?: string
  tokensUsed: number
  createdAt: string
  completedAt?: string
  prNumber?: number | null
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
  prNumber?: number | null
}

interface TasksResponse {
  tasks: TranslationTask[]
  totalCount: number
  limit: number
  offset: number
}

interface UserInfo {
  username: string
  avatarUrl?: string | null
}

interface StatusConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  borderColor: string
  animate?: boolean
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: '等待中',
    icon: Clock,
    bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    borderColor: 'border-gray-200 dark:border-gray-800',
  },
  processing: {
    label: '进行中',
    icon: Loader2,
    bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    borderColor: 'border-blue-200 dark:border-blue-800',
    animate: true,
  },
  completed: {
    label: '已完成',
    icon: CheckCircle,
    bgColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  failed: {
    label: '失败',
    icon: XCircle,
    bgColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    borderColor: 'border-red-200 dark:border-red-800',
  },
}

export default function TasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TranslationTask[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TranslationTask | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<UserInfo | null>(null)
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  const pageSize = 20

  // Update search value when URL changes
  useEffect(() => {
    setSearchValue(searchParams.get('search') || '')
  }, [searchParams])

  // Calculate stats from current tasks
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    }
  }, [tasks])

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
  }, [page, filter, searchValue])

  // Auto-refresh when there are processing tasks
  useEffect(() => {
    const hasProcessingTasks = tasks.some(task => task.status === 'processing')

    if (!hasProcessingTasks) {
      return
    }

    const interval = setInterval(() => {
      fetchTasks()
    }, 5000)

    return () => clearInterval(interval)
  }, [tasks, page, filter])

  const checkAuthAndFetch = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }

      const authData = await response.json()
      setUser({
        username: authData.user.username,
        avatarUrl: authData.user.avatarUrl,
      })

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

      if (searchValue) {
        params.append('search', searchValue)
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

      toast({
        title: '任务已重新排队',
        description: '任务将在队列中重新执行',
        variant: 'success',
      })

      await fetchTasks()

      if (selectedTask?.id === taskId) {
        setSelectedTask(null)
      }
    } catch (err) {
      console.error('Error retrying task:', err)
      toast({
        title: '重试失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'error',
      })
    }
  }

  const getProgressPercentage = (task: TranslationTask) => {
    if (task.totalFiles === 0) return 0
    return Math.round((task.processedFiles / task.totalFiles) * 100)
  }

  if (loading && page === 0) {
    return (
      <ClientAppLayout user={{ username: 'Loading...' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </ClientAppLayout>
    )
  }

  return (
    <ClientAppLayout user={user || { username: 'User' }} processingTaskCount={stats.processing}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">全部任务</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">进行中</p>
              <p className="text-2xl font-bold">{stats.processing}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-green-200 bg-green-50 dark:bg-green-950">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-muted-foreground">已完成</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-red-200 bg-red-50 dark:bg-red-950">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs text-muted-foreground">失败</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">翻译任务</h1>
          <p className="text-muted-foreground mt-2">
            查看和管理翻译任务的执行状态
          </p>
        </div>
        <button
          onClick={fetchTasks}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">状态筛选:</span>
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status)
              setPage(0)
            }}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'border hover:bg-muted'
            )}
          >
            {status === 'all' ? '全部' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filter === 'all'
              ? '还没有翻译任务。配置仓库翻译后，任务会自动出现在这里。'
              : `没有${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label || filter}的任务。`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const config = STATUS_CONFIG[task.status]
            const Icon = config.icon
            const isExpanded = expandedTasks.has(task.id)

            return (
              <div
                key={task.id}
                className={cn(
                  'rounded-lg border bg-card transition-all hover:shadow-md cursor-pointer',
                  isExpanded && 'shadow-md',
                  config.borderColor
                )}
                onClick={() => toggleTaskExpansion(task.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-semibold text-lg">
                        {task.repository.name}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
                          config.bgColor
                        )}
                      >
                        <Icon className={cn('w-3.5 h-3.5', config.animate && 'animate-spin')} />
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.triggerType === 'manual' ? '手动触发' : '自动触发'}
                      </span>
                      {isExpanded && (
                        <span className="text-xs text-muted-foreground">
                          点击收起详情
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="text-right shrink-0">
                    <div className="text-sm text-muted-foreground mb-1">
                      {task.processedFiles} / {task.totalFiles} 文件
                    </div>
                    {task.totalFiles > 0 && (
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${getProgressPercentage(task)}%` }}
                        />
                      </div>
                    )}
                    {task.totalTokens > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {task.totalTokens.toLocaleString()} tokens
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {task.errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" onClick={(e) => e.stopPropagation()}>
                    <p className="text-sm text-red-800">{task.errorMessage}</p>
                  </div>
                )}

                {/* Failed Files indicator */}
                {task.failedFiles > 0 && !isExpanded && (
                  <div className="mb-4 text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {task.failedFiles} 个文件翻译失败，点击查看详情
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  {task.status === 'failed' && (
                    <button
                      onClick={() => handleRetryTask(task.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重试
                    </button>
                  )}
                  {task.files && task.files.length > 0 && task.files.some(f => f.prNumber) && (
                    <a
                      href={`https://github.com/${task.repository.fullName}/pull/${task.files.find(f => f.prNumber)?.prNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      查看 PR
                    </a>
                  )}
                  <a
                    href={`https://github.com/${task.repository.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    GitHub
                  </a>
                </div>

                {/* Expanded file details */}
                {isExpanded && task.files && task.files.length > 0 && (
                  <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                    <h4 className="text-sm font-medium mb-2">
                      文件详情 ({task.processedFiles}/{task.totalFiles} 已处理)
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {task.files.map((file) => {
                        const fileStatus = file.status === 'completed' ? 'success' : file.status === 'failed' ? 'error' : 'default'
                        return (
                          <div
                            key={file.id}
                            className={cn(
                              'p-3 rounded border transition-colors',
                              fileStatus === 'success' && 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900',
                              fileStatus === 'error' && 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900',
                              fileStatus === 'default' && 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" title={file.filePath}>
                                  {file.filePath}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-xs text-muted-foreground">
                                    → {file.targetLanguage}
                                  </span>
                                  {file.tokensUsed > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {file.tokensUsed} tokens
                                    </span>
                                  )}
                                  {file.prNumber && (
                                    <a
                                      href={`https://github.com/${task.repository.fullName}/pull/${file.prNumber}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      PR #{file.prNumber}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs px-2 py-1 rounded">
                                {file.status === 'completed' ? '成功' : file.status === 'failed' ? '失败' : '处理中'}
                              </span>
                            </div>
                            {file.errorMessage && (
                              <p className="text-xs text-red-700 mt-2 font-mono bg-red-100/50 p-1.5 rounded">
                                {file.errorMessage}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            第 {page + 1} 页，共 {Math.ceil(totalCount / pageSize)} 页
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * pageSize >= totalCount}
            className="px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {tasks.some(task => task.status === 'processing') && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-40 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">翻译任务进行中</span>
            <span className="text-xs text-blue-100">状态自动更新中...</span>
          </div>
        </div>
      )}
    </ClientAppLayout>
  )
}
