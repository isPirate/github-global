import * as React from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string
  description?: string
  eyebrow?: string
  actions?: React.ReactNode
  align?: "start" | "center"
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  align = "start",
  className,
  ...props
}: PageHeaderProps) {
  const centered = align === "center"

  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        centered && "items-center text-center md:flex-col md:items-center",
        className
      )}
      {...props}
    >
      <div className={cn("max-w-3xl space-y-3", centered && "items-center")}>
        {eyebrow ? (
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </div>
  )
}
