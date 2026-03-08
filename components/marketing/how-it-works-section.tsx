import { Github, Languages, Rocket } from "lucide-react"

const steps = [
  {
    title: "连接 GitHub 仓库",
    description: "用户从 GitHub 登录开始，通过 GitHub App 授权仓库访问，建立可控的同步边界。",
    icon: Github,
  },
  {
    title: "配置翻译规则",
    description: "按仓库设置目标语言、默认偏好和执行策略，把重复决策前移到配置阶段。",
    icon: Languages,
  },
  {
    title: "执行并追踪任务",
    description: "任务触发后，在控制台查看进度、失败原因和 PR 结果，形成可追踪闭环。",
    icon: Rocket,
  },
]

export function HowItWorksSection() {
  return (
    <section id="workflow" className="py-[var(--section-space)]">
      <div className="page-container grid gap-8 rounded-[calc(var(--radius-xl)+0.5rem)] border border-border/70 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%),var(--panel-gradient)] p-8 shadow-[var(--shadow-md)] md:p-10 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Workflow
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            把翻译流程压缩成一条更清晰的路径
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            参考稿强调流程感，这里我们保留这个优点，但只展示当前产品真正支持的工作方式。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <div
                key={step.title}
                className="rounded-[var(--radius-xl)] border border-border/70 bg-background/90 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-primary/70">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
