'use client'

import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeaderActions } from '@/components/app-shell/header-actions'

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
            仓库、任务和设置在各自页面内完成管理与检索
          </p>
        </div>

        <HeaderActions user={user} notificationCount={notificationCount} />
      </div>
    </header>
  )
}
