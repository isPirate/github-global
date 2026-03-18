/* eslint-disable @next/next/no-html-link-for-pages */
import { ArrowRight, Github } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section id="why" className="pb-[var(--section-space)]">
      <div className="page-container">
        <div className="overflow-hidden rounded-[calc(var(--radius-xl)+0.5rem)] border border-primary/20 bg-[linear-gradient(135deg,rgba(22,163,74,0.08),rgba(59,130,246,0.08))] px-6 py-10 shadow-[var(--shadow-md)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                Ready To Start
              </p>
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                从一个更完整的前端入口开始管理你的翻译工作流
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                现在的目标不是扩展新功能，而是把现有能力组织成更清晰、更稳定、更像产品的体验。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="gap-2">
                <a href="/api/auth/signin">
                  <Github className="h-4 w-4" />
                  进入控制台
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/repositories">查看仓库入口</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
