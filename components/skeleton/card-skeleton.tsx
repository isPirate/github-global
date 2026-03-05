'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'button'
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        variant === 'card' && 'h-32',
        variant === 'text' && 'h-4 w-3/4',
        variant === 'button' && 'h-10 w-24',
        !variant && className,
        variant === 'default' && className
      )}
      {...props}
    />
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" variant="text" />
          <Skeleton className="h-4 w-1/2" variant="text" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" variant="text" />
      <Skeleton className="h-4 w-2/3" variant="text" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-9 w-24" variant="button" />
        <Skeleton className="h-9 w-9 ml-auto rounded-md" variant="button" />
      </div>
    </div>
  )
}
