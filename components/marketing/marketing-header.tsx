import Link from "next/link"
import { ArrowRight, Github, Globe2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="page-container flex h-[var(--header-height)] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold tracking-[0.2em] text-primary">
              GITHUB GLOBAL
            </p>
            <p className="text-sm text-muted-foreground">
              GitHub 仓库自动化翻译平台
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            核心能力
          </a>
          <a href="#workflow" className="hover:text-foreground">
            工作流
          </a>
          <a href="#why" className="hover:text-foreground">
            为什么选择我们
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">查看控制台</Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/login">
              <Github className="h-4 w-4" />
              使用 GitHub 登录
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
