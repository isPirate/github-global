import Link from 'next/link'
import UserMenu from './user-menu'

interface AppLayoutProps {
  children: React.ReactNode
  user: {
    username: string
    avatarUrl?: string | null
  }
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="font-semibold text-lg">GitHub Global</span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/repositories"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                仓库
              </Link>
              <Link
                href="/tasks"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                任务
              </Link>
            </nav>

            {/* User Menu */}
            <UserMenu username={user.username} avatarUrl={user.avatarUrl} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
