'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemProps {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  collapsed?: boolean
}

export function NavItem({ title, href, icon: Icon, badge, collapsed }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname?.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-3'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
      {!collapsed && (
        <>
          <span className="flex-1">{title}</span>
          {badge && badge > 0 && (
            <span className={cn(
              'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {isActive && (
            <ChevronRight className="h-4 w-4 text-primary ml-auto" />
          )}
        </>
      )}
    </Link>
  )
}
