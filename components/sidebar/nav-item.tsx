'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemProps {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  collapsed?: boolean
  onNavigate?: () => void
}

export function NavItem({
  title,
  href,
  icon: Icon,
  badge,
  collapsed,
  onNavigate,
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname?.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-background/90 hover:text-foreground',
        collapsed && 'justify-center px-2.5'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      {!collapsed ? (
        <>
          <span className="flex-1">{title}</span>
          {badge && badge > 0 ? (
            <span
              className={cn(
                'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                isActive
                  ? 'bg-white/18 text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
          {!badge && isActive ? (
            <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
          ) : null}
        </>
      ) : null}
      {collapsed && badge && badge > 0 ? (
        <span
          className={cn(
            'absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold',
            isActive
              ? 'bg-white text-primary'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  )
}
