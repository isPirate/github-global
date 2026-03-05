'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Menu, X } from 'lucide-react'
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

export function TopHeader({ user, onMenuClick, notificationCount = 0, className }: TopHeaderProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
      // Escape to close search
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
        setSearchValue('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      // Navigate to tasks page with search query
      router.push(`/tasks?search=${encodeURIComponent(searchValue.trim())}`)
      setSearchOpen(false)
      setSearchValue('')
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6',
        className
      )}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-muted"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo (mobile only) */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">GG</span>
        </div>
        <span className="font-semibold">GitHub Global</span>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索任务、仓库名称..."
              className="w-full h-10 pl-10 pr-10 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        ) : (
          <button
            onClick={() => {
              setSearchOpen(true)
              setTimeout(() => searchInputRef.current?.focus(), 0)
            }}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">搜索...</span>
            <kbd className="ml-auto hidden md:inline-flex items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell (with badge) */}
        <button
          onClick={() => router.push('/tasks')}
          className="relative p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User menu (desktop only) */}
        <div className="hidden md:block">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
