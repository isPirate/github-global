import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react'
import { StatusBadge } from '@/components/feedback/status-badge'
import { taskStatusTokens } from '@/lib/design-system/tokens'
import { TaskFileList } from '@/components/tasks/task-file-list'
import { cn } from '@/lib/utils'

interface TranslationFile {
  id: string
  filePath: string
  targetLanguage: string
  status: string
  errorMessage?: string
  tokensUsed: number
  createdAt: string
  completedAt?: string
  prNumber?: number | null
}

interface TranslationTask {
  id: string
  repositoryId: string
  triggerType: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalFiles: number
  processedFiles: number
  failedFiles: number
  totalTokens: number
  errorMessage?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  repository: {
    id: string
    name: string
    fullName: string
  }
  files: TranslationFile[]
}

interface TaskItemProps {
  task: TranslationTask
  expanded: boolean
  onToggle: () => void
  onRetry: (taskId: string) => void
  progress: number
}

export function TaskItem({
  task,
  expanded,
  onToggle,
  onRetry,
  progress,
}: TaskItemProps) {
  const config = taskStatusTokens[task.status]
  const firstPr = task.files.find((file) => file.prNumber)?.prNumber

  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] border bg-card/90 p-5 transition-all hover:shadow-[var(--shadow-md)]',
        task.status === 'processing' && 'border-blue-200 dark:border-blue-900',
        task.status === 'failed' && 'border-red-200 dark:border-red-900'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-4 text-left"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">{task.repository.name}</span>
              <StatusBadge tone={config.tone}>{config.label}</StatusBadge>
              <span className="text-xs text-muted-foreground">
                {task.triggerType === 'manual' ? '手动触发' : '自动触发'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                {expanded ? '收起详情' : '展开详情'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(task.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>

          <div className="min-w-[9rem] space-y-2 text-right">
            <div className="text-sm text-muted-foreground">
              {task.processedFiles} / {task.totalFiles} 文件
            </div>
            {task.totalFiles > 0 ? (
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
            {task.totalTokens > 0 ? (
              <div className="text-xs text-muted-foreground">
                {task.totalTokens.toLocaleString()} tokens
              </div>
            ) : null}
          </div>
        </div>
      </button>

      {task.errorMessage ? (
        <div className="mt-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {task.errorMessage}
        </div>
      ) : null}

      {task.failedFiles > 0 && !expanded ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          {task.failedFiles} 个文件翻译失败，展开查看详情
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
        {task.status === 'failed' ? (
          <button
            type="button"
            onClick={() => onRetry(task.id)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        ) : null}

        {firstPr ? (
          <a
            href={`https://github.com/${task.repository.fullName}/pull/${firstPr}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-border/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            查看 PR
          </a>
        ) : null}

        <a
          href={`https://github.com/${task.repository.fullName}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-border/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          GitHub
        </a>
      </div>

      {expanded && task.files.length > 0 ? (
        <div className="mt-4 border-t border-border/70 pt-4">
          <h4 className="mb-3 text-sm font-medium">
            文件详情 ({task.processedFiles}/{task.totalFiles} 已处理)
          </h4>
          <TaskFileList
            files={task.files}
            repositoryFullName={task.repository.fullName}
          />
        </div>
      ) : null}
    </div>
  )
}
