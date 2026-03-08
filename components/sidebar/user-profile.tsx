'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, LogOut, Settings } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const userInitial = username.charAt(0).toUpperCase()
  const avatar = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={username}
      width={collapsed ? 40 : 44}
      height={collapsed ? 40 : 44}
      className={cn(collapsed ? 'h-10 w-10' : 'h-11 w-11', 'rounded-2xl object-cover')}
    />
  ) : (
    <div
      className={cn(
        collapsed ? 'h-10 w-10' : 'h-11 w-11',
        'flex items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary'
      )}
    >
      {userInitial}
    </div>
  )

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={cn(
          'flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-transparent bg-background/60 p-2.5 text-left transition-colors hover:border-border/70 hover:bg-background',
          collapsed && 'justify-center p-2'
        )}
      >
        {avatar}
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{username}</p>
            <p className="truncate text-xs text-muted-foreground">GitHub Account</p>
          </div>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={cn(
            'absolute bottom-full z-50 mb-2 w-60 rounded-[var(--radius-lg)] border border-border/70 bg-popover p-2 shadow-[var(--shadow-md)]',
            collapsed ? 'left-0' : 'left-0 right-0'
          )}
        >
          <div className="mb-2 rounded-[var(--radius-md)] bg-accent/60 px-3 py-2">
            <p className="truncate text-sm font-medium">{username}</p>
            <p className="truncate text-xs text-muted-foreground">控制台账户菜单</p>
          </div>

          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              总览
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              设置
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
