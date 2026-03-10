'use client'

import { AppUserMenu } from '@/components/app-shell/app-user-menu'
import { cn } from '@/lib/utils'

interface UserProfileProps {
  username: string
  avatarUrl?: string | null
  collapsed?: boolean
}

export function UserProfile({
  username,
  avatarUrl,
  collapsed,
}: UserProfileProps) {
  return (
    <AppUserMenu
      user={{ username, avatarUrl }}
      variant="sidebar"
      collapsed={collapsed}
      className={cn('w-full', collapsed && 'flex justify-center')}
    />
  )
}
