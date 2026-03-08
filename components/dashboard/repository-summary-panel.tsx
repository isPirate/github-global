import Link from 'next/link'
import { ArrowRight, Github, Settings2, Star } from 'lucide-react'
import { StatusBadge } from '@/components/feedback/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RepositorySummary {
  id: string
  name: string
  fullName: string
  stargazersCount: number
  isActive: boolean
  hasConfig: boolean
}

interface RepositorySummaryPanelProps {
  repositories: RepositorySummary[]
}

export function RepositorySummaryPanel({
  repositories,
}: RepositorySummaryPanelProps) {
  return (
    <Card className="rounded-[var(--radius-xl)] border-border/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">仓库概览</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            按最近同步的仓库展示当前启用和配置状态。
          </p>
        </div>
        <Link
          href="/repositories"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          管理仓库
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {repositories.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
            还没有可展示的仓库。完成 GitHub App 安装和同步后，这里会出现仓库摘要。
          </div>
        ) : (
          repositories.map((repository) => (
            <div
              key={repository.id}
              className="rounded-[var(--radius-lg)] border border-border/70 bg-background/80 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{repository.name}</p>
                    <StatusBadge tone={repository.isActive ? 'success' : 'muted'}>
                      {repository.isActive ? '已启用' : '未启用'}
                    </StatusBadge>
                    <StatusBadge tone={repository.hasConfig ? 'info' : 'warning'}>
                      {repository.hasConfig ? '已配置' : '待配置'}
                    </StatusBadge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Github className="h-4 w-4" />
                      {repository.fullName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {repository.stargazersCount}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/repositories/${repository.id}/config`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Settings2 className="h-4 w-4" />
                  打开配置
                </Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
