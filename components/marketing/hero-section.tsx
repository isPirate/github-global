import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GitPullRequest,
  Globe2,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const highlights = [
  "自动发现并翻译仓库文档",
  "通过 Pull Request 回交结果",
  "集中查看任务、配置和状态",
]

export function HeroSection() {
  return (
    <section className="hero-wash border-b border-border/60">
      <div className="page-container grid min-h-[calc(100vh-var(--header-height))] items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/75 px-4 py-2 text-sm font-medium text-primary shadow-sm">
            <Sparkles className="h-4 w-4" />
            从单点入口升级为完整翻译工作台
          </div>

          <div className="space-y-5">
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-[hsl(var(--brand-ink))] md:text-6xl xl:text-7xl">
              让你的 GitHub 仓库
              <span className="block bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
                稳定地走向多语言协作
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              GitHub Global
              帮你把文档翻译、状态跟踪、PR 回交和配置管理收敛到一个界面里，
              减少手工同步成本，也让仓库运营更可控。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <a href="/api/auth/signin">
                使用 GitHub 登录
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <a href="#workflow">
                查看工作流程
                <Globe2 className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-foreground/88">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden rounded-[calc(var(--radius-xl)+0.25rem)] border-border/70 bg-white/90 shadow-[var(--shadow-lg)] dark:bg-slate-950/80">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
                  Console Preview
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  把翻译工作流收进统一控制台
                </h2>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Globe2 className="h-6 w-6" />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-border/70 bg-slate-950 p-5 text-slate-50">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>最近任务</span>
                  <span>处理中 3</span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">docs-site</p>
                      <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-200">
                        8 / 12
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-full w-2/3 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4" />
                        生成翻译 PR
                      </span>
                      <span className="text-slate-300">启用</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/70 bg-background p-5">
                  <div className="flex items-center gap-3 text-primary">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm font-medium">文档状态</span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold">24</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    当前已覆盖的目标语言文档版本
                  </p>
                </div>
                <div className="rounded-3xl border border-primary/20 bg-primary/[0.06] p-5">
                  <p className="text-sm font-medium text-primary">工作流目标</p>
                  <p className="mt-4 text-3xl font-semibold">1 个面板</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    仓库、任务、配置和入口都在同一个产品体验内完成
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
