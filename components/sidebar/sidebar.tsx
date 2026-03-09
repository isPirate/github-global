'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronLeft, FileText, Github, Globe2, GripVertical, PanelLeft, Settings } from 'lucide-react'
import { NavItem } from './nav-item'
import { UserProfile } from './user-profile'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: {
    username: string
    avatarUrl?: string | null
  }
  processingTaskCount?: number
  className?: string
  mobile?: boolean
  collapsed: boolean
  width: number
  onToggleCollapse: () => void
  onWidthChange: (value: number) => void
  onNavigate?: () => void
}

const navigationItems = [
  { title: '总览', href: '/dashboard', icon: BarChart3 },
  { title: '仓库', href: '/repositories', icon: Github },
  { title: '任务', href: '/tasks', icon: FileText },
  { title: '设置', href: '/settings', icon: Settings },
]

const MIN_SIDEBAR_WIDTH = 280
const MAX_SIDEBAR_WIDTH = 420

export function Sidebar({
  user,
  processingTaskCount = 0,
  className,
  mobile = false,
  collapsed,
  width,
  onToggleCollapse,
  onWidthChange,
  onNavigate,
}: SidebarProps) {
  const taskBadge = processingTaskCount > 0 ? processingTaskCount : undefined

  useEffect(() => {
    if (mobile) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      const nextWidth = Math.max(
        MIN_SIDEBAR_WIDTH,
        Math.min(MAX_SIDEBAR_WIDTH, event.clientX)
      )
      onWidthChange(nextWidth)
    }

    const stopResize = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', stopResize)
    }

    const startResize = () => {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', stopResize)
    }

    const handle = document.getElementById('app-sidebar-resize-handle')
    handle?.addEventListener('mousedown', startResize)

    return () => {
      handle?.removeEventListener('mousedown', startResize)
      stopResize()
    }
  }, [mobile, onWidthChange])

  return (
    <aside
      style={{
        width: mobile ? 'min(88vw, var(--sidebar-width))' : collapsed ? 'var(--sidebar-collapsed-width)' : `${width}px`,
      }}
      className={cn(
        'app-surface relative flex h-screen flex-col overflow-hidden border-r border-border/70 shadow-[var(--shadow-md)] transition-[width] duration-200',
        className
      )}
    >
      <div className="flex h-[var(--header-height)] shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4">
        <Link
          href="/dashboard"
          className={cn('flex min-w-0 items-center gap-3', collapsed && !mobile && 'justify-center')}
          onClick={onNavigate}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <Globe2 className="h-5 w-5" />
          </div>
          {!collapsed || mobile ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[0.12em] text-primary">
                GitHub Global
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Translation Console
              </p>
            </div>
          ) : null}
        </Link>

        {!mobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-xl border border-border/70 bg-background/80 p-2 text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      <div className="shrink-0 px-4 py-5">
        {!collapsed || mobile ? (
          <div className="rounded-[var(--radius-lg)] border border-primary/15 bg-primary/[0.06] p-4">
            <p className="text-sm font-medium text-foreground">工作台入口</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              从总览、仓库、任务和设置四个层级组织你的翻译工作流。
            </p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        {navigationItems.map((item) => (
          <NavItem
            key={item.href}
            title={item.title}
            href={item.href}
            icon={item.icon}
            badge={item.href === '/tasks' ? taskBadge : undefined}
            collapsed={collapsed && !mobile}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-border/70 p-3">
        <UserProfile
          username={user.username}
          avatarUrl={user.avatarUrl}
          collapsed={collapsed && !mobile}
        />
      </div>

      {!mobile && !collapsed ? (
        <button
          id="app-sidebar-resize-handle"
          type="button"
          aria-label="Resize sidebar"
          className="absolute right-0 top-0 hidden h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center text-muted-foreground/70 lg:flex"
        >
          <GripVertical className="h-4 w-4 rounded-full bg-background/90 shadow-sm" />
        </button>
      ) : null}
    </aside>
  )
}
