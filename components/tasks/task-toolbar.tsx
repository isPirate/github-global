import { RefreshCw } from 'lucide-react'
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
  onFilterChange: (value: string) => void
  onRefresh: () => void
}

export function TaskToolbar({
  filter,
  onFilterChange,
  onRefresh,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <RefreshCw className="h-4 w-4" />
        刷新任务
      </button>
    </div>
  )
}
