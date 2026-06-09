'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { TopHeader } from '@/components/header/top-header'
import { BottomNav } from '@/components/mobile-nav/bottom-nav'

const DEFAULT_SIDEBAR_WIDTH = 304
const MIN_SIDEBAR_WIDTH = 280
const MAX_SIDEBAR_WIDTH = 420

let cachedSidebarCollapsed = false
let cachedSidebarWidth = DEFAULT_SIDEBAR_WIDTH
let cachedSidebarInitialized = false

interface ClientAppLayoutProps {
  children: React.ReactNode
  user: {
    username: string
    avatarUrl?: string | null
  }
  processingTaskCount?: number
}

function getInitialSidebarPrefs() {
  if (cachedSidebarInitialized) {
    return {
      collapsed: cachedSidebarCollapsed,
      width: cachedSidebarWidth,
    }
  }

  return {
    collapsed: false,
    width: DEFAULT_SIDEBAR_WIDTH,
  }
}

export default function ClientAppLayout({
  children,
  user,
  processingTaskCount = 0,
}: ClientAppLayoutProps) {
  const initialPrefs = getInitialSidebarPrefs()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarHydrated, setSidebarHydrated] = useState(cachedSidebarInitialized)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialPrefs.collapsed)
  const [sidebarWidth, setSidebarWidth] = useState(initialPrefs.width)

  useEffect(() => {
    if (cachedSidebarInitialized) {
      setSidebarHydrated(true)
      return
    }

    const storedCollapsed = window.localStorage.getItem('app-sidebar-collapsed')
    const storedWidth = window.localStorage.getItem('app-sidebar-width')

    const nextCollapsed = storedCollapsed === 'true'
    let nextWidth = DEFAULT_SIDEBAR_WIDTH

    if (storedWidth) {
      const parsed = Number(storedWidth)
      if (!Number.isNaN(parsed)) {
        nextWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsed))
      }
    }

    cachedSidebarCollapsed = nextCollapsed
    cachedSidebarWidth = nextWidth
    cachedSidebarInitialized = true

    setSidebarCollapsed(nextCollapsed)
    setSidebarWidth(nextWidth)
    setSidebarHydrated(true)
  }, [])

  useEffect(() => {
    if (!sidebarHydrated) {
      return
    }

    cachedSidebarCollapsed = sidebarCollapsed
    cachedSidebarInitialized = true
    window.localStorage.setItem('app-sidebar-collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed, sidebarHydrated])

  useEffect(() => {
    if (!sidebarHydrated) {
      return
    }

    cachedSidebarWidth = sidebarWidth
    cachedSidebarInitialized = true
    window.localStorage.setItem('app-sidebar-width', String(sidebarWidth))
  }, [sidebarWidth, sidebarHydrated])

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-80 bg-[radial-gradient(circle_at_top,rgba(22,163,74,0.12),transparent_50%)]" />

      <div className="relative z-10 flex min-h-screen lg:items-start">
        <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:shrink-0">
          <Sidebar
            user={user}
            processingTaskCount={processingTaskCount}
            collapsed={sidebarCollapsed}
            width={sidebarWidth}
            hydrated={sidebarHydrated}
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
          />

          <main className="flex-1 pb-24 lg:pb-0">
            <div className="page-container py-[var(--page-y)]">{children}</div>
            <div className="hidden border-t border-border/40 pb-4 pt-6 text-xs text-muted-foreground lg:block">
              <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
                <a
                  href="https://beian.mps.gov.cn/#/query/webSearch?code=34162102003426"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <img
                    src="/beian-icon.png"
                    alt="公安备案"
                    className="h-3.5 w-3.5"
                  />
                  皖公网安备34162102003426号
                </a>
                <a
                  href="https://beian.miit.gov.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  皖ICP备2026009215号-1
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>

      <BottomNav processingTaskCount={processingTaskCount} />
    </div>
  )
}
