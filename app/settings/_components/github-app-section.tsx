'use client'

import { useEffect, useState } from 'react'
import type { Installation } from './settings-form'

interface GitHubAppSectionProps {
  installations: Installation[]
}

interface AppInfo {
  installationUrl: string
  appUrl: string
  appName: string
}

export default function GitHubAppSection({ installations }: GitHubAppSectionProps) {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAppInfo() {
      try {
        const response = await fetch('/api/github-app/install-link')
        if (response.ok) {
          const data = await response.json()
          setAppInfo({
            installationUrl: data.installationUrl,
            appUrl: data.appUrl,
            appName: data.appName || data.slug,
          })
        }
      } catch (error) {
        console.error('Failed to fetch app info:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAppInfo()
  }, [])

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">GitHub App 管理</h2>
      <p className="text-sm text-muted-foreground mb-6">
        管理您的 GitHub App 安装和仓库权限
      </p>

      <div className="space-y-4">
        {/* Installations List */}
        {installations.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">已安装的账户</h3>
            {installations.map((installation) => (
              <div
                key={installation.id}
                className="flex items-center justify-between p-4 border rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {installation.accountType === 'Organization' ? '🏢' : '👤'}
                  </div>
                  <div>
                    <p className="font-medium">{installation.accountLogin}</p>
                    <p className="text-sm text-muted-foreground">
                      {installation.accountType === 'Organization' ? '组织' : '个人账户'}
                      {' • '}
                      {installation.repositorySelection === 'all'
                        ? '所有仓库'
                        : '选定仓库'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 border rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">
              尚未安装 GitHub App。安装后可以访问您的仓库并进行翻译。
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          {appInfo && (
            <>
              <a
                href={appInfo.installationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {installations.length > 0 ? '添加更多安装' : '安装 GitHub App'}
              </a>
              <a
                href="https://github.com/settings/installations"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
              >
                管理安装
              </a>
            </>
          )}
          {loading && (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              加载中...
            </div>
          )}
        </div>

        {/* Info */}
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>说明：</strong>GitHub App 用于访问您的仓库并创建翻译 PR。您可以在 GitHub 设置中随时撤销权限。
          </p>
        </div>
      </div>
    </div>
  )
}
