'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { TopHeader } from '@/components/header/top-header'
import { BottomNav } from '@/components/mobile-nav/bottom-nav'

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

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-80 bg-[radial-gradient(circle_at_top,rgba(22,163,74,0.12),transparent_50%)]" />

      <div className="relative z-10 flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar
            user={user}
            processingTaskCount={processingTaskCount}
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
