'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { TopHeader } from '@/components/header/top-header'
import { BottomNav } from '@/components/mobile-nav/bottom-nav'

const DEFAULT_SIDEBAR_WIDTH = 304
const MIN_SIDEBAR_WIDTH = 280
const MAX_SIDEBAR_WIDTH = 420

interface ClientAppLayoutProps {
  children: React.ReactNode
  user: {
    username: string
    avatarUrl?: string | null
  }
  processingTaskCount?: number
}

export default function ClientAppLayout({
  children,
  user,
  processingTaskCount = 0,
}: ClientAppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)

  useEffect(() => {
    const storedCollapsed = window.localStorage.getItem('app-sidebar-collapsed')
    const storedWidth = window.localStorage.getItem('app-sidebar-width')

    if (storedCollapsed === 'true') {
      setSidebarCollapsed(true)
    }

    if (storedWidth) {
      const parsed = Number(storedWidth)
      if (!Number.isNaN(parsed)) {
        setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsed)))
      }
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('app-sidebar-collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    window.localStorage.setItem('app-sidebar-width', String(sidebarWidth))
  }, [sidebarWidth])

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-80 bg-[radial-gradient(circle_at_top,rgba(22,163,74,0.12),transparent_50%)]" />

      <div className="relative z-10 flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar
            user={user}
            processingTaskCount={processingTaskCount}
            collapsed={sidebarCollapsed}
            width={sidebarWidth}
            onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
            onWidthChange={setSidebarWidth}
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            />
            <div className="absolute inset-y-0 left-0 w-[min(88vw,var(--sidebar-width))]">
              <Sidebar
                user={user}
                processingTaskCount={processingTaskCount}
                mobile
                collapsed={false}
                width={DEFAULT_SIDEBAR_WIDTH}
                onToggleCollapse={() => undefined}
                onWidthChange={() => undefined}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader
            user={user}
            onMenuClick={() => setSidebarOpen(true)}
            notificationCount={processingTaskCount}
          />

          <main className="flex-1 pb-24 lg:pb-8">
            <div className="page-container py-[var(--page-y)]">{children}</div>
          </main>
        </div>
      </div>

      <BottomNav processingTaskCount={processingTaskCount} />
    </div>
  )
}
