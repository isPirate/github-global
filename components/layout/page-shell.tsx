import * as React from "react"

import { cn } from "@/lib/utils"

type PageShellProps = React.HTMLAttributes<HTMLDivElement> & {
  spacing?: "default" | "compact" | "comfortable"
}

const spacingMap: Record<NonNullable<PageShellProps["spacing"]>, string> = {
  compact: "gap-4 md:gap-6",
  default: "gap-6 md:gap-8",
  comfortable: "gap-8 md:gap-10",
}

export function PageShell({
  className,
  spacing = "default",
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn("page-grid", spacingMap[spacing], className)}
      {...props}
    />
  )
}

type PageSectionProps = React.HTMLAttributes<HTMLElement> & {
  surface?: boolean
}

export function PageSection({
  className,
  surface = false,
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)]",
        surface && "app-surface surface-border shadow-soft",
        className
      )}
      {...props}
    />
  )
}
