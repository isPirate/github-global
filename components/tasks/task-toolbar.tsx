import { RefreshCw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '等待中' },
  { value: 'processing', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
] as const

interface TaskToolbarProps {
  filter: string
  searchValue: string
  onSearchChange: (value: string) => void
  onFilterChange: (value: string) => void
  onRefresh: () => void
  refreshing?: boolean
}

export function TaskToolbar({
  filter,
  searchValue,
  onSearchChange,
  onFilterChange,
  onRefresh,
  refreshing = false,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="按仓库名称搜索任务"
            className="h-12 w-full rounded-2xl border border-border/70 bg-background px-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          {refreshing ? '刷新中...' : '刷新任务'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">状态筛选</span>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onFilterChange(item.value)}
            className={cn(
              'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
              filter === item.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border/70 bg-background text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
