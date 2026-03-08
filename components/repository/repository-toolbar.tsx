import { RefreshCw, Settings } from 'lucide-react'

interface RepositoryToolbarProps {
  onRefresh: () => void
  installationUrl: string | null
}

export function RepositoryToolbar({
  onRefresh,
  installationUrl,
}: RepositoryToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-semibold">可用仓库</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          显示 GitHub App 已授权的仓库。先完成授权，再决定启用、配置和立即翻译。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          刷新仓库
        </button>
        {installationUrl ? (
          <a
            href={installationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Settings className="h-4 w-4" />
            管理仓库权限
          </a>
        ) : null}
      </div>
    </div>
  )
}
