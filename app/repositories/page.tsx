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
  id: number
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
  const [addingRepo, setAddingRepo] = useState<string | null>(null)
  const [deletingRepo, setDeletingRepo] = useState<string | null>(null)

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
      setRepositories(data.repositories)
    } catch (err) {
      console.error('Error fetching repositories:', err)
      setError('Failed to load repositories. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addRepository = async (repo: Repository, installationId: number) => {
    try {
      setAddingRepo(repo.id.toString())

      const response = await fetch('/api/repositories/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubRepoId: repo.id,
          installationId,
          fullName: repo.full_name,
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stargazersCount: repo.stargazers_count,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add repository')
      }

      // Refresh repository list
      await fetchRepositories()
    } catch (err) {
      console.error('Error adding repository:', err)
      alert(err instanceof Error ? err.message : 'Failed to add repository')
    } finally {
      setAddingRepo(null)
    }
  }

  const deleteRepository = async (dbId: string) => {
    if (!confirm('Are you sure you want to remove this repository?')) {
      return
    }

    try {
      setDeletingRepo(dbId)

      const response = await fetch(`/api/repositories/${dbId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete repository')
      }

      // Refresh repository list
      await fetchRepositories()
    } catch (err) {
      console.error('Error deleting repository:', err)
      alert('Failed to delete repository')
    } finally {
      setDeletingRepo(null)
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
              <a
                href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'translate-github-logbal'}/installations`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
              >
                安装 GitHub App
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">可用的仓库</h2>
              {repositories.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                  没有找到仓库。请确保 GitHub App 有权限访问您的仓库。
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
                        {repo.isActive ? (
                          <>
                            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                              已添加
                            </span>
                            {repo.hasConfig && (
                              <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                                已配置
                              </span>
                            )}
                            <button
                              onClick={() => deleteRepository(repo.dbId!)}
                              disabled={deletingRepo === repo.dbId}
                              className="ml-auto text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              {deletingRepo === repo.dbId ? '删除中...' : '删除'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              addRepository(
                                repo,
                                installations[0]?.id || repo.owner.type === 'Organization' ? 0 : 1
                              )
                            }
                            disabled={addingRepo === repo.id.toString()}
                            className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                          >
                            {addingRepo === repo.id.toString() ? '添加中...' : '添加仓库'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">功能说明</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 从您的 GitHub App 安装中选择仓库</li>
                <li>• 配置需要翻译的文件和目标语言</li>
                <li>• 自动翻译并创建 Pull Request</li>
                <li>• 追踪翻译进度和历史记录</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
