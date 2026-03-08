'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronLeft, FileText, Github, Globe2, PanelLeft, Settings } from 'lucide-react'
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
  onNavigate?: () => void
}

const navigationItems = [
  { title: '总览', href: '/dashboard', icon: BarChart3 },
  { title: '仓库', href: '/repositories', icon: Github },
  { title: '任务', href: '/tasks', icon: FileText },
  { title: '设置', href: '/settings', icon: Settings },
]

export function Sidebar({
  user,
  processingTaskCount = 0,
  className,
  mobile = false,
  onNavigate,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const taskBadge = processingTaskCount > 0 ? processingTaskCount : undefined

  return (
    <aside
      className={cn(
        'app-surface flex h-full w-[var(--sidebar-width)] flex-col border-r border-border/70 shadow-[var(--shadow-md)]',
        collapsed && !mobile && 'w-[var(--sidebar-collapsed-width)]',
        className
      )}
    >
      <div className="flex h-[var(--header-height)] items-center justify-between gap-3 border-b border-border/70 px-4">
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
              <p className="truncate text-sm font-semibold tracking-[0.18em] text-primary">
                GITHUB GLOBAL
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
            onClick={() => setCollapsed((value) => !value)}
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

      <div className="px-4 py-5">
        {!collapsed || mobile ? (
          <div className="rounded-[var(--radius-lg)] border border-primary/15 bg-primary/[0.06] p-4">
            <p className="text-sm font-medium text-foreground">工作台入口</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              从总览、仓库、任务和设置四个层级组织你的翻译工作流。
            </p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-6">
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

      <div className="border-t border-border/70 p-3">
        <UserProfile
          username={user.username}
          avatarUrl={user.avatarUrl}
          collapsed={collapsed && !mobile}
        />
      </div>
    </aside>
  )
}
