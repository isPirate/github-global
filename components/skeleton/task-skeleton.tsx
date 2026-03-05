'use client'

import { Skeleton } from './card-skeleton'

export function TaskSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-6 w-40" variant="text" />
            <Skeleton className="h-6 w-20 rounded-full" variant="button" />
            <Skeleton className="h-6 w-24 rounded-full" variant="button" />
          </div>
          <Skeleton className="h-4 w-48" variant="text" />
        </div>

        <div className="text-right">
          <Skeleton className="h-4 w-24 mb-1 ml-auto" variant="text" />
          <Skeleton className="h-2 w-32 rounded-full" variant="text" />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t">
        <Skeleton className="h-9 w-24" variant="button" />
        <Skeleton className="h-9 w-16" variant="button" />
        <Skeleton className="h-9 w-20 ml-auto" variant="button" />
      </div>
    </div>
  )
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded bg-muted animate-pulse" />
              <div>
                <div className="h-3 w-12 bg-muted rounded animate-pulse mb-1" />
                <div className="h-7 w-8 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-20 bg-muted rounded animate-pulse" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16" variant="button" />
        ))}
      </div>

      {/* Cards */}
      <TaskSkeleton count={5} />
    </div>
  )
}
