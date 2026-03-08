'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ClientAppLayout from '@/components/client-app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { PageSection, PageShell } from '@/components/layout/page-shell'
import { TaskList } from '@/components/tasks/task-list'
import { TaskSummaryCards } from '@/components/tasks/task-summary-cards'
import { TaskToolbar } from '@/components/tasks/task-toolbar'
import { useToast } from '@/components/toast/use-toast'

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

export default function TasksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<TranslationTask[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchValue, setSearchValue] = useState('')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<UserInfo | null>(null)

  const pageSize = 20

  const stats = useMemo(
    () => ({
      total: tasks.length,
      processing: tasks.filter((task) => task.status === 'processing').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
      failed: tasks.filter((task) => task.status === 'failed').length,
    }),
    [tasks]
  )

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((previous) => {
      const next = new Set(previous)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const fetchTasks = useCallback(async () => {
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

      if (searchValue.trim()) {
        params.append('search', searchValue.trim())
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
      setError('加载任务失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }, [filter, page, searchValue])

  const checkAuthAndFetch = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/api/auth/signin')
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
      router.push('/api/auth/signin')
    }
  }, [fetchTasks, router])

  useEffect(() => {
    checkAuthAndFetch()
  }, [checkAuthAndFetch])

  useEffect(() => {
    if (!tasks.some((task) => task.status === 'processing')) {
      return
    }

    const interval = setInterval(() => {
      fetchTasks()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchTasks, tasks])

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
    } catch (err) {
      console.error('Error retrying task:', err)
      toast({
        title: '重试失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'error',
      })
    }
  }

  if (loading && page === 0) {
    return (
      <ClientAppLayout user={{ username: 'Loading...' }}>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">正在加载任务...</p>
          </div>
        </div>
      </ClientAppLayout>
    )
  }

  return (
    <ClientAppLayout
      user={user || { username: 'User' }}
      processingTaskCount={stats.processing}
    >
      <PageShell spacing="comfortable">
        <PageHeader
          eyebrow="Tasks"
          title="翻译任务"
          description="查看任务进度、失败原因、PR 出口和文件级执行详情。"
        />

        <TaskSummaryCards
          total={stats.total}
          processing={stats.processing}
          completed={stats.completed}
          failed={stats.failed}
        />

        {error ? (
          <PageSection className="rounded-[var(--radius-xl)] border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </PageSection>
        ) : null}

        <TaskToolbar
          filter={filter}
          searchValue={searchValue}
          onSearchChange={(value) => {
            setSearchValue(value)
            setPage(0)
          }}
          onFilterChange={(value) => {
            setFilter(value)
            setPage(0)
          }}
          onRefresh={fetchTasks}
        />

        <TaskList
          tasks={tasks}
          expandedTasks={expandedTasks}
          onToggle={toggleTaskExpansion}
          onRetry={handleRetryTask}
          filter={filter}
        />

        {totalCount > pageSize ? (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(0, previous - 1))}
              disabled={page === 0}
              className="rounded-2xl border border-border/70 px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-muted-foreground">
              第 {page + 1} 页，共 {Math.ceil(totalCount / pageSize)} 页
            </span>
            <button
              type="button"
              onClick={() => setPage((previous) => previous + 1)}
              disabled={(page + 1) * pageSize >= totalCount}
              className="rounded-2xl border border-border/70 px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        ) : null}

        {tasks.some((task) => task.status === 'processing') ? (
          <div className="fixed bottom-24 right-6 z-40 flex items-center gap-3 rounded-[var(--radius-lg)] bg-blue-600 px-4 py-3 text-white shadow-[var(--shadow-md)] lg:bottom-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">翻译任务进行中</span>
              <span className="text-xs text-blue-100">状态会自动刷新</span>
            </div>
          </div>
        ) : null}
      </PageShell>
    </ClientAppLayout>
  )
}
