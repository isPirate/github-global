'use client'

import { useRouter } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from './user-menu'

interface TopHeaderProps {
  user: {
    username: string
    avatarUrl?: string | null
  }
  onMenuClick?: () => void
  notificationCount?: number
  className?: string
}

export function TopHeader({
  user,
  onMenuClick,
  notificationCount = 0,
  className,
}: TopHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-border/70 bg-background/88 backdrop-blur-xl',
        className
      )}
    >
      <div className="page-container flex h-[var(--header-height)] items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex rounded-2xl border border-border/70 bg-background/80 p-2.5 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">控制台</p>
          <p className="text-xs text-muted-foreground">
            仓库、任务和设置在各自页面内完成管理与搜索
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/tasks')}
            className="relative inline-flex rounded-2xl border border-border/70 bg-background/80 p-2.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Open tasks"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            ) : null}
          </button>

          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
