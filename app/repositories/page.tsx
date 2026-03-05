'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ClientAppLayout from '@/components/client-app-layout'
import { QuickTranslateButton } from '@/components/repository/quick-translate-button'
import { SimpleStatCard } from '@/components/repository/stat-card'
import { Github, Globe, FileText, RefreshCw, Settings, Lock } from 'lucide-react'
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

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
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
  }

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/repositories')
      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }

      const data: RepositoriesResponse = await response.json()
      setInstallations(data.installations)

      console.log('[Repositories Page] Loaded repositories:', data.repositories.map(r => ({
        id: r.id,
        dbId: r.dbId,
        name: r.name,
      })))

      setRepositories(data.repositories)

      // Calculate stats
      setStats({
        total: data.repositories.length,
        active: data.repositories.filter(r => r.isActive).length,
        configured: data.repositories.filter(r => r.hasConfig).length,
      })
    } catch (err) {
      console.error('Error fetching repositories:', err)
      setError('Failed to load repositories. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const syncInstallations = async () => {
    try {
      setSyncing(true)

      const response = await fetch('/api/github-app/auto-sync', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to sync')
      }

      const result = await response.json()
      console.log('[Sync] Result:', result)

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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading repositories...</p>
          </div>
        </div>
      </ClientAppLayout>
    )
  }

  return (
    <ClientAppLayout user={user}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <SimpleStatCard
          title="全部仓库"
          value={stats.total}
          icon={Globe}
        />
        <SimpleStatCard
          title="已启用"
          value={stats.active}
          icon={Github}
        />
        <SimpleStatCard
          title="已配置"
          value={stats.configured}
          icon={FileText}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">我的仓库</h1>
          <p className="text-muted-foreground mt-2">
            管理您的 GitHub 仓库翻译项目
          </p>
        </div>
        <button
          onClick={fetchRepositories}
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

      {installations.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">未安装 GitHub App</h2>
            <p className="text-muted-foreground mb-6">
              请先安装 GitHub Global App 到您的 GitHub 账户
            </p>
            <div className="flex flex-col gap-3">
              {installationUrl ? (
                <>
                  <button
                    onClick={syncInstallations}
                    disabled={syncing}
                    className="inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
                    {syncing ? '同步中...' : '已安装？点击同步'}
                  </button>
                  <a
                    href={installationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    安装 GitHub App
                  </a>
                </>
              ) : (
                <span className="text-muted-foreground">加载中...</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">可用的仓库</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  显示 GitHub App 已授权的仓库。要添加新仓库，请在 GitHub 设置中管理权限。
                </p>
              </div>
              {installationUrl && (
                <a
                  href={installationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  管理仓库权限
                </a>
              )}
            </div>
            {repositories.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  没有找到仓库。GitHub App 可能没有访问任何仓库的权限。
                </p>
                {installationUrl && (
                  <a
                    href={installationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    前往 GitHub 添加仓库权限 →
                  </a>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="rounded-lg border bg-card p-5 space-y-4 hover:border-primary/50 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                          {repo.name}
                          {repo.private && (
                            <Lock className="w-3 h-3 text-muted-foreground shrink-0" aria-label="Private repository" />
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {repo.owner.login}/{repo.name}
                        </p>
                      </div>
                      {repo.language && (
                        <span className="shrink-0 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                          {repo.language}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {repo.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {repo.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        ⭐ {repo.stargazers_count}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {repo.dbId ? (
                        <>
                          <QuickTranslateButton
                            repositoryId={repo.dbId}
                            repositoryName={repo.name}
                            isActive={repo.isActive}
                            hasConfig={repo.hasConfig}
                            variant="compact"
                          />
                          <Link
                            href={`/repositories/${repo.dbId}/config`}
                            className="ml-auto inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                        </>
                      ) : (
                        <span className="ml-auto text-sm text-muted-foreground">
                          同步中...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">如何添加新仓库？</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">点击上方"管理仓库权限"按钮</p>
                  <p className="text-sm">会跳转到 GitHub App 安装页面</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">在 GitHub 上选择要授权的仓库</p>
                  <p className="text-sm">可以选择"All repositories"或特定的仓库</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">返回此页面并点击"刷新"</p>
                  <p className="text-sm">新仓库会出现在列表中，点击"配置翻译"即可开始使用</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ClientAppLayout>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
