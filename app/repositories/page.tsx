'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Github, Globe } from 'lucide-react'
import ClientAppLayout from '@/components/client-app-layout'
import { RepositoryEmptyState } from '@/components/repository/repository-empty-state'
import { RepositoryGrid } from '@/components/repository/repository-grid'
import { RepositoryToolbar } from '@/components/repository/repository-toolbar'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, PageSection } from '@/components/layout/page-shell'
import { StatCard } from '@/components/metrics/stat-card'
import { useToast } from '@/components/toast/use-toast'

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  private: boolean
  owner: {
    login: string
    type: string
  }
  isActive: boolean
  hasConfig: boolean
  dbId?: string
}

interface Installation {
  id: string
  account: {
    login: string
    type: string
  }
}

interface RepositoriesResponse {
  installations: Installation[]
  repositories: Repository[]
}

interface UserInfo {
  username: string
  avatarUrl?: string | null
}

export default function RepositoriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [installations, setInstallations] = useState<Installation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [installationUrl, setInstallationUrl] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    configured: 0,
  })

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/repositories')
      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }

      const data: RepositoriesResponse = await response.json()
      setInstallations(data.installations)
      setRepositories(data.repositories)
      setStats({
        total: data.repositories.length,
        active: data.repositories.filter((repository) => repository.isActive).length,
        configured: data.repositories.filter((repository) => repository.hasConfig)
          .length,
      })
    } catch (err) {
      console.error('Error fetching repositories:', err)
      setError('加载仓库失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAuthAndFetch = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }

      const authData = await response.json()
      if (!authData.user?.accessToken) {
        router.push('/login?relogin=true')
        return
      }

      setUser({
        username: authData.user.username,
        avatarUrl: authData.user.avatarUrl,
      })

      try {
        const urlResponse = await fetch('/api/github-app/install-link')
        if (urlResponse.ok) {
          const urlData = await urlResponse.json()
          setInstallationUrl(urlData.installationUrl)
        }
      } catch (err) {
        console.error('Failed to get installation URL:', err)
      }

      await fetchRepositories()
    } catch (err) {
      console.error('Auth check failed:', err)
      router.push('/login')
    }
  }, [fetchRepositories, router])

  useEffect(() => {
    checkAuthAndFetch()
  }, [checkAuthAndFetch])

  const syncInstallations = async () => {
    try {
      setSyncing(true)

      const response = await fetch('/api/github-app/auto-sync', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to sync')
      }

      const result = await response.json()

      if (result.synced > 0) {
        toast({
          title: '同步成功',
          description: `已同步 ${result.synced} 个仓库`,
          variant: 'success',
        })
        await fetchRepositories()
      } else {
        toast({
          title: '未找到仓库',
          description: result.message || '请先安装 GitHub App',
          variant: 'warning',
        })
      }
    } catch (err) {
      console.error('Error syncing installations:', err)
      toast({
        title: '同步失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'error',
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading || !user) {
    return (
      <ClientAppLayout user={{ username: 'Loading...' }}>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">正在加载仓库...</p>
          </div>
        </div>
      </ClientAppLayout>
    )
  }

  return (
    <ClientAppLayout user={user}>
      <PageShell spacing="comfortable">
        <PageHeader
          eyebrow="Repositories"
          title="我的仓库"
          description="集中管理 GitHub 仓库、授权范围、翻译配置和快速执行入口。"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="全部仓库"
            value={stats.total}
            description="当前同步到控制台的仓库数量"
            icon={<Globe className="h-5 w-5" />}
          />
          <StatCard
            title="已启用"
            value={stats.active}
            description="允许发起翻译任务的仓库"
            icon={<Github className="h-5 w-5" />}
            emphasis="success"
          />
          <StatCard
            title="已配置"
            value={stats.configured}
            description="已完成翻译参数配置的仓库"
            icon={<FileText className="h-5 w-5" />}
            emphasis="primary"
          />
        </div>

        {error ? (
          <PageSection className="rounded-[var(--radius-xl)] border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </PageSection>
        ) : null}

        {installations.length === 0 ? (
          <RepositoryEmptyState
            variant="install"
            installationUrl={installationUrl}
            syncing={syncing}
            onSync={syncInstallations}
          />
        ) : (
          <PageShell>
            <RepositoryToolbar
              onRefresh={fetchRepositories}
              installationUrl={installationUrl}
            />

            {repositories.length === 0 ? (
              <RepositoryEmptyState
                variant="empty"
                installationUrl={installationUrl}
              />
            ) : (
              <RepositoryGrid repositories={repositories} />
            )}

            <PageSection surface className="p-6 md:p-8">
              <h2 className="text-xl font-semibold">添加新仓库的路径</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  '点击“管理仓库权限”，进入 GitHub App 授权页面。',
                  '在 GitHub 中选择要授权的仓库或直接授予全部仓库权限。',
                  '返回当前页面刷新列表，再进入配置页完成翻译设置。',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[var(--radius-lg)] border border-border/70 bg-background/85 p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </PageSection>
          </PageShell>
        )}
      </PageShell>
    </ClientAppLayout>
  )
}
