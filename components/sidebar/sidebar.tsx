'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Github, Globe, FileText, Settings, Menu, X } from 'lucide-react'
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
}

const navigationItems = [
  { title: '仓库', href: '/repositories', icon: Github },
  { title: '任务', href: '/tasks', icon: FileText },
  { title: '设置', href: '/settings', icon: Settings },
]

export function Sidebar({ user, processingTaskCount = 0, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Calculate badge for tasks (show count if there are processing tasks)
  const taskBadge = processingTaskCount > 0 ? processingTaskCount : undefined

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-card border-r transition-all duration-300 sidebar-transition',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          'lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg">GitHub Global</span>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigationItems.map((item) => (
            <NavItem
              key={item.href}
              title={item.title}
              href={item.href}
              icon={item.icon}
              badge={item.href === '/tasks' ? taskBadge : undefined}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* User profile */}
        <div className="p-3 border-t">
          <UserProfile
            username={user.username}
            avatarUrl={user.avatarUrl}
            collapsed={collapsed}
          />
        </div>

        {/* Collapse button (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 hidden lg:flex w-6 h-6 items-center justify-center rounded-full bg-background border text-muted-foreground hover:text-foreground shadow-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className={cn('w-3 h-3 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  )
}
