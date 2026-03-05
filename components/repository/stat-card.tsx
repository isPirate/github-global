'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const variantStyles = {
  default: {
    bg: 'bg-background',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    bg: 'bg-background',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-background',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  error: {
    bg: 'bg-background',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
  },
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs 上月</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', styles.iconBg)}>
          <Icon className={cn('w-6 h-6', styles.iconColor)} />
        </div>
      </div>
    </div>
  )
}

interface SimpleStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  href?: string
  className?: string
}

export function SimpleStatCard({ title, value, icon: Icon, href, className }: SimpleStatCardProps) {
  const card = (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50',
        href && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )

  if (href) {
    return <a href={href}>{card}</a>
  }

  return card
}
