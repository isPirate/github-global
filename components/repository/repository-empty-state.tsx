import { RefreshCw } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { cn } from '@/lib/utils'

interface RepositoryEmptyStateProps {
  variant: 'install' | 'empty'
  installationUrl: string | null
  syncing?: boolean
  onSync?: () => void
}

export function RepositoryEmptyState({
  variant,
  installationUrl,
  syncing = false,
  onSync,
}: RepositoryEmptyStateProps) {
  if (variant === 'install') {
    return (
      <EmptyState
        title="尚未安装 GitHub App"
        description="先将 GitHub Global App 安装到你的 GitHub 账户，再回到控制台同步可访问仓库。"
        icon={<RefreshCw className={cn('h-7 w-7', syncing && 'animate-spin')} />}
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            {onSync ? (
              <button
                type="button"
                onClick={onSync}
                disabled={syncing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/70 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
              >
                <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
                {syncing ? '同步中...' : '已安装？点击同步'}
              </button>
            ) : null}
            {installationUrl ? (
              <a
                href={installationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
              >
                安装 GitHub App
              </a>
            ) : null}
          </div>
        }
      />
    )
  }

  return (
    <EmptyState
      title="还没有可管理的仓库"
      description="GitHub App 已经安装，但当前没有同步到任何可用仓库。请回到 GitHub 调整授权范围后再刷新。"
      icon={<RefreshCw className="h-7 w-7" />}
      action={
        installationUrl ? (
          <a
            href={installationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            前往 GitHub 调整权限
          </a>
        ) : null
      }
    />
  )
}
