'use client'

import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { AppUserMenu } from '@/components/app-shell/app-user-menu'

interface HeaderActionsProps {
  user: {
    username: string
    avatarUrl?: string | null
  }
  notificationCount?: number
}

export function HeaderActions({ user, notificationCount = 0 }: HeaderActionsProps) {
  const router = useRouter()

  return (
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

      <AppUserMenu user={user} variant="header" />
    </div>
  )
}
