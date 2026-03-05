'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: typeof Github
}

const navigationItems: NavItem[] = [
  { title: '仓库', href: '/repositories', icon: Github },
  { title: '任务', href: '/tasks', icon: FileText },
  { title: '设置', href: '/settings', icon: Settings },
]

export function BottomNav({ processingTaskCount = 0 }: { processingTaskCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t lg:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          const badge = item.href === '/tasks' ? processingTaskCount : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground px-1">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 transition-colors',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
