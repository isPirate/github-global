'use client'

import { AppUserMenu } from '@/components/app-shell/app-user-menu'

interface HeaderActionsProps {
  user: {
    username: string
    avatarUrl?: string | null
  }
}

export function HeaderActions({ user }: HeaderActionsProps) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <AppUserMenu user={user} variant="header" />
    </div>
  )
}
