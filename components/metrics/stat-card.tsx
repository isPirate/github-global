import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string
  value: React.ReactNode
  description?: string
  icon?: React.ReactNode
  trend?: string
  emphasis?: "default" | "primary" | "success" | "warning"
}

const emphasisMap: Record<NonNullable<StatCardProps["emphasis"]>, string> = {
  default: "border-border/80 bg-card",
  primary:
    "border-primary/20 bg-[linear-gradient(180deg,rgba(242,251,246,0.95),rgba(255,255,255,0.98))] dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.94))]",
  success:
    "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/40",
  warning:
    "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/40",
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  emphasis = "default",
  className,
  ...props
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[var(--radius-xl)] border shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        emphasisMap[emphasis],
        className
      )}
      {...props}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardDescription className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/90">
            {title}
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            {value}
          </CardTitle>
        </div>
        {icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/80 text-primary shadow-sm">
            {icon}
          </div>
        ) : null}
      </CardHeader>
      {(description || trend) ? (
        <CardContent className="flex items-center justify-between gap-3 pt-0">
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          {trend ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {trend}
            </span>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}
