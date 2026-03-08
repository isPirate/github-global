import Link from 'next/link'
import { ArrowRight, Clock3, ExternalLink, Github } from 'lucide-react'
import { StatusBadge } from '@/components/feedback/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { taskStatusTokens } from '@/lib/design-system/tokens'

interface RecentTask {
  id: string
  status: string
  triggerType: string
  processedFiles: number
  totalFiles: number
  createdAt: Date
  repository: {
    name: string
    fullName: string
  }
}

interface RecentActivityListProps {
  tasks: RecentTask[]
}

export function RecentActivityList({ tasks }: RecentActivityListProps) {
  return (
    <Card className="rounded-[var(--radius-xl)] border-border/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">最近任务</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            最近触发的翻译任务，优先关注进行中和失败项。
          </p>
        </div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          查看全部
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
            还没有翻译任务。完成仓库配置后，任务会出现在这里。
          </div>
        ) : (
          tasks.map((task) => {
            const config =
              taskStatusTokens[task.status as keyof typeof taskStatusTokens] ??
              taskStatusTokens.pending

            return (
              <div
                key={task.id}
                className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border/70 bg-background/80 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{task.repository.name}</p>
                    <StatusBadge tone={config.tone}>{config.label}</StatusBadge>
                    <span className="text-xs text-muted-foreground">
                      {task.triggerType === 'manual' ? '手动触发' : '自动触发'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-4 w-4" />
                      {task.createdAt.toLocaleString('zh-CN')}
                    </span>
                    <span>
                      进度 {task.processedFiles} / {task.totalFiles}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`https://github.com/${task.repository.fullName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  >
                    任务详情
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
