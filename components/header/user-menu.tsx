'use client'

import { AppUserMenu } from '@/components/app-shell/app-user-menu'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  user: {
    username: string
    avatarUrl?: string | null
  }
  className?: string
}

export function UserMenu({ user, className }: UserMenuProps) {
  return <AppUserMenu user={user} variant="header" className={cn(className)} />
}
