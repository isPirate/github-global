import { RefreshCw, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RepositoryToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  installationUrl: string | null
  refreshing?: boolean
}

export function RepositoryToolbar({
  searchValue,
  onSearchChange,
  onRefresh,
  installationUrl,
  refreshing = false,
}: RepositoryToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">可用仓库</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          显示 GitHub App 已授权的仓库。支持按仓库名称快速筛选，再决定启用、配置和立即翻译。
        </p>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="按仓库名称搜索"
            className="h-12 w-full rounded-2xl border border-border/70 bg-background px-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            {refreshing ? '刷新中...' : '刷新仓库'}
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
    </div>
  )
}
