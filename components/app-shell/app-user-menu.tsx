'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, LogOut, Settings, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppUserMenuProps {
  user: {
    username: string
    avatarUrl?: string | null
  }
  variant?: 'header' | 'sidebar'
  collapsed?: boolean
  className?: string
}

export function AppUserMenu({
  user,
  variant = 'header',
  collapsed = false,
  className,
}: AppUserMenuProps) {
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

  const avatarSize = variant === 'sidebar' && !collapsed ? 44 : 40
  const userInitial = user.username.charAt(0).toUpperCase()

  return (
    <div ref={menuRef} className={cn('relative overflow-visible', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={cn(
          'transition-all duration-200',
          variant === 'header'
            ? 'inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-background/85 p-1.5 pr-3 hover:bg-background'
            : 'flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-transparent bg-background/60 p-2.5 text-left hover:border-border/70 hover:bg-background',
          variant === 'sidebar' && collapsed && 'justify-center p-2'
        )}
        aria-label="User menu"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.username}
            width={avatarSize}
            height={avatarSize}
            className={cn(
              'rounded-2xl object-cover',
              avatarSize === 44 ? 'h-11 w-11' : 'h-10 w-10'
            )}
          />
        ) : (
          <div
            className={cn(
              avatarSize === 44 ? 'h-11 w-11' : 'h-10 w-10',
              'flex items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary'
            )}
          >
            {userInitial}
          </div>
        )}

        {variant === 'header' ? (
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-foreground">{user.username}</p>
            <p className="text-xs text-muted-foreground">GitHub User</p>
          </div>
        ) : !collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
            <p className="truncate text-xs text-muted-foreground">GitHub Account</p>
          </div>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={cn(
            'absolute z-[70] w-64 rounded-[var(--radius-lg)] border border-border/70 bg-popover p-2 shadow-[var(--shadow-lg)]',
            variant === 'header' && 'right-0 top-full mt-2',
            variant === 'sidebar' && !collapsed && 'bottom-full left-0 right-0 mb-2',
            variant === 'sidebar' && collapsed && 'bottom-0 left-full ml-3'
          )}
        >
          <div className="mb-2 rounded-[var(--radius-md)] bg-accent/60 px-3 py-2">
            <p className="truncate text-sm font-medium">{user.username}</p>
            <p className="truncate text-xs text-muted-foreground">Console account menu</p>
          </div>

          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              {variant === 'header' ? (
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              )}
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
