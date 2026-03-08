import { FileSearch, FolderGit2, Languages, Settings2, ShieldCheck, Workflow } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "仓库级自动化翻译",
    description: "围绕 GitHub 仓库工作，而不是散落在脚本和手工流程里。更适合持续维护文档多语言版本。",
    icon: FolderGit2,
  },
  {
    title: "Pull Request 回交结果",
    description: "翻译结果以 PR 形式回交，保留原有的代码审查和合并节奏，不污染主分支。",
    icon: Workflow,
  },
  {
    title: "多语言目标管理",
    description: "集中管理目标语言和翻译偏好，减少不同仓库、不同任务之间的重复配置。",
    icon: Languages,
  },
  {
    title: "状态与任务追踪",
    description: "统一查看等待中、进行中、已完成和失败任务，让处理优先级更清晰。",
    icon: FileSearch,
  },
  {
    title: "GitHub App 授权路径",
    description: "从产品内部引导安装、同步和管理仓库访问权限，避免用户在多个页面来回切换。",
    icon: ShieldCheck,
  },
  {
    title: "配置与运行分离",
    description: "把仓库配置、任务执行和账户设置分离成清晰模块，降低误操作和认知负担。",
    icon: Settings2,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-[var(--section-space)]">
      <div className="page-container space-y-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Core Capabilities
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            参考稿里的结构感，落到真实可用的产品能力上
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            这次前端重构不是简单换皮，而是把现有仓库管理、任务追踪和配置入口整理成一套更完整的 SaaS 界面。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <Card
                key={feature.title}
                className="rounded-[var(--radius-xl)] border-border/70 bg-card/90 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
              >
                <CardHeader className="space-y-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl leading-8">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-7 text-muted-foreground md:text-base">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
