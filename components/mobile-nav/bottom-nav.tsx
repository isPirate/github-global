'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FileText, Github, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: typeof Github
}

const navigationItems: NavItem[] = [
  { title: '总览', href: '/dashboard', icon: BarChart3 },
  { title: '仓库', href: '/repositories', icon: Github },
  { title: '任务', href: '/tasks', icon: FileText },
  { title: '设置', href: '/settings', icon: Settings },
]

export function BottomNav({
  processingTaskCount = 0,
}: {
  processingTaskCount?: number
}) {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 backdrop-blur-xl lg:hidden">
      <div className="grid h-20 grid-cols-4 gap-1 px-2 pb-4 pt-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          const badge = item.href === '/tasks' ? processingTaskCount : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                />
                {badge > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </div>
              <span>{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
