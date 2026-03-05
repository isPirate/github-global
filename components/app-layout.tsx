'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { TopHeader } from '@/components/header/top-header'
import { BottomNav } from '@/components/mobile-nav/bottom-nav'

interface AppLayoutProps {
  children: React.ReactNode
  user: {
    username: string
    avatarUrl?: string | null
  }
  processingTaskCount?: number
}

export default function AppLayout({ children, user, processingTaskCount = 0 }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar (hidden on mobile) */}
      <div className="hidden lg:block">
        <Sidebar user={user} processingTaskCount={processingTaskCount} />
      </div>

      {/* Mobile sidebar (shown when open) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[260px]">
            <Sidebar user={user} processingTaskCount={processingTaskCount} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <TopHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={0}
        />

        {/* Main content (scrollable) */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-6">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <BottomNav processingTaskCount={processingTaskCount} />
      </div>
    </div>
  )
}
