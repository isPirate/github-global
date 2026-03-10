import Link from 'next/link'
import { ExternalLink, Github, Lock, Settings, Star } from 'lucide-react'
import { StatusBadge } from '@/components/feedback/status-badge'
import { QuickTranslateButton } from '@/components/repository/quick-translate-button'
import { Card, CardContent } from '@/components/ui/card'

interface RepositoryCardProps {
  repository: {
    id: number
    name: string
    full_name: string
    description: string | null
    language: string | null
    stargazers_count: number
    private: boolean
    owner: {
      login: string
      type: string
    }
    isActive: boolean
    hasConfig: boolean
    dbId?: string
  }
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <Card className="h-full rounded-[var(--radius-xl)] border-border/70 bg-card/90 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
      <CardContent className="flex h-full flex-col space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold">{repository.name}</h3>
              {repository.private ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : null}
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Github className="h-4 w-4 shrink-0" />
              <span className="truncate">{repository.owner.login}/{repository.name}</span>
            </p>
          </div>
          {repository.language ? (
            <span className="shrink-0 rounded-full bg-info-soft px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-200">
              {repository.language}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={repository.isActive ? 'success' : 'muted'}>
            {repository.isActive ? '已启用' : '未启用'}
          </StatusBadge>
          <StatusBadge tone={repository.hasConfig ? 'info' : 'warning'}>
            {repository.hasConfig ? '已配置' : '待配置'}
          </StatusBadge>
        </div>

        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
          {repository.description || '暂无仓库描述。完成配置后可从这里直接发起翻译。'}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4" />
            {repository.stargazers_count}
          </span>
        </div>

        <div className="mt-auto grid grid-cols-[minmax(0,1fr)_48px_48px] gap-2 border-t border-border/70 pt-4">
          {repository.dbId ? (
            <>
              <QuickTranslateButton
                repositoryId={repository.dbId}
                repositoryName={repository.name}
                isActive={repository.isActive}
                hasConfig={repository.hasConfig}
                variant="compact"
                className="w-full"
              />
              <Link
                href={`/repositories/${repository.dbId}/config`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border/70 bg-background/85 text-foreground transition-all hover:-translate-y-0.5 hover:bg-accent"
                aria-label={`Configure ${repository.name}`}
              >
                <Settings className="h-4 w-4" />
              </Link>
              <a
                href={`https://github.com/${repository.owner.login}/${repository.name}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border/70 bg-background/85 text-foreground transition-all hover:-translate-y-0.5 hover:bg-accent"
                aria-label={`Open ${repository.name} on GitHub`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </>
          ) : (
            <span className="col-span-3 text-sm text-muted-foreground">同步中...</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
