'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function RepositoriesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [installations, setInstallations] = useState<Installation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [installationUrl, setInstallationUrl] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

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

      // Check if session has access token
      const authData = await response.json()
      if (!authData.user?.accessToken) {
        // No access token in session, need to re-login
        router.push('/login?relogin=true')
        return
      }

      // Get GitHub App installation URL
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

      // Log for debugging
      console.log('[Repositories Page] Loaded repositories:', data.repositories.map(r => ({
        id: r.id,
        dbId: r.dbId,
        name: r.name,
      })))

      setRepositories(data.repositories)
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
        // Refresh repository list after sync
        await fetchRepositories()
      } else {
        alert(result.message || 'No installations found. Please install the GitHub App first.')
      }
    } catch (err) {
      console.error('Error syncing installations:', err)
      alert(err instanceof Error ? err.message : 'Failed to sync installations')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading repositories...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
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
            <h1 className="text-3xl font-bold">我的仓库</h1>
            <p className="text-muted-foreground mt-2">
              管理您的 GitHub 仓库翻译项目
            </p>
          </div>
          <button
            onClick={fetchRepositories}
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

        {installations.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
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
                      className="inline-flex items-center justify-center rounded-md border px-6 py-3 hover:bg-muted disabled:opacity-50"
                    >
                      {syncing ? '同步中...' : '已安装？点击同步'}
                    </button>
                    <a
                      href={installationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
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
              <div className="flex items-center justify-between">
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
                    className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
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
                <div className="grid gap-4 md:grid-cols-2">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="rounded-lg border bg-card p-6 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {repo.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {repo.owner.login}/{repo.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {repo.private && (
                            <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded">
                              Private
                            </span>
                          )}
                          {repo.language && (
                            <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                              {repo.language}
                            </span>
                          )}
                        </div>
                      </div>

                      {repo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>⭐ {repo.stargazers_count}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {repo.dbId ? (
                          <Link
                            href={`/repositories/${repo.dbId}/config`}
                            className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                          >
                            {repo.hasConfig ? '编辑配置' : '配置翻译'}
                          </Link>
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
                    <p className="text-sm">新仓库会出现在列表中，点击"启用仓库"即可开始使用</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
