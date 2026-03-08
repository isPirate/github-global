import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] border border-dashed bg-card/90 shadow-sm",
        className
      )}
      {...props}
    >
      <CardHeader className="items-center space-y-4 px-8 pb-0 pt-8 text-center">
        {icon ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary shadow-sm">
            {icon}
          </div>
        ) : null}
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8 pt-4 text-center">
        <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground md:text-base">
          {description}
        </p>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
