'use client'

import { CardSkeleton } from './card-skeleton'

export function RepositorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function RepositoryListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
              <div>
                <div className="h-3 w-12 bg-muted rounded animate-pulse mb-1" />
                <div className="h-6 w-8 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-20 bg-muted rounded animate-pulse" />
      </div>

      {/* Cards */}
      <RepositorySkeleton count={6} />
    </div>
  )
}
