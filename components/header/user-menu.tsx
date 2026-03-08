'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  user: {
    username: string
    avatarUrl?: string | null
  }
  className?: string
}

export function UserMenu({ user, className }: UserMenuProps) {
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-background/85 p-1.5 pr-3 transition-colors hover:bg-background"
        aria-label="User menu"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.username}
            width={36}
            height={36}
            className="h-9 w-9 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="hidden text-left md:block">
          <p className="text-sm font-medium text-foreground">{user.username}</p>
          <p className="text-xs text-muted-foreground">GitHub 用户</p>
        </div>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[var(--radius-lg)] border border-border/70 bg-popover p-2 shadow-[var(--shadow-md)]">
          <div className="mb-2 rounded-[var(--radius-md)] bg-accent/60 px-3 py-2">
            <p className="truncate text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">控制台账户菜单</p>
          </div>

          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
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
              onClick={() => {
                setIsOpen(false)
                handleLogout()
              }}
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
