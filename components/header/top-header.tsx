'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Menu, Search, Sparkles, X } from 'lucide-react'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        requestAnimationFrame(() => searchInputRef.current?.focus())
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setSearchValue('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const value = searchValue.trim()
    if (!value) {
      return
    }

    router.push(`/tasks?search=${encodeURIComponent(value)}`)
    setSearchOpen(false)
    setSearchValue('')
  }

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

        <div className="hidden min-w-0 lg:block">
          <p className="text-sm font-medium text-foreground">控制台</p>
          <p className="text-xs text-muted-foreground">
            仓库、任务和配置在同一套界面里完成
          </p>
        </div>

        <div className="min-w-0 flex-1">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="搜索任务、仓库名称或状态..."
                className="h-12 w-full rounded-2xl border border-border/70 bg-background px-11 pr-11 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchValue('')
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true)
                requestAnimationFrame(() => searchInputRef.current?.focus())
              }}
              className="flex h-12 w-full max-w-xl items-center gap-3 rounded-2xl border border-border/70 bg-background/85 px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-background"
            >
              <Search className="h-4 w-4" />
              <span>搜索任务、仓库名称或状态...</span>
              <kbd className="ml-auto hidden rounded-lg border border-border/70 bg-accent px-2 py-1 text-[11px] font-medium text-muted-foreground md:inline-flex">
                Ctrl + K
              </kbd>
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden rounded-2xl border border-primary/15 bg-primary/[0.06] px-3 py-2 text-primary md:flex md:items-center md:gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">前端重构中</span>
          </div>

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
