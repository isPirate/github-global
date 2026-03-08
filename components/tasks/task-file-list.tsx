import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TranslationFile {
  id: string
  filePath: string
  targetLanguage: string
  status: string
  errorMessage?: string
  tokensUsed: number
  prNumber?: number | null
}

interface TaskFileListProps {
  files: TranslationFile[]
  repositoryFullName: string
}

export function TaskFileList({
  files,
  repositoryFullName,
}: TaskFileListProps) {
  return (
    <div className="space-y-2">
      {files.map((file) => {
        const fileStatus =
          file.status === 'completed'
            ? 'success'
            : file.status === 'failed'
              ? 'error'
              : 'default'

        return (
          <div
            key={file.id}
            className={cn(
              'rounded-[var(--radius-md)] border p-3 transition-colors',
              fileStatus === 'success' &&
                'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30',
              fileStatus === 'error' &&
                'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
              fileStatus === 'default' &&
                'border-border/70 bg-background/80'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={file.filePath}>
                  {file.filePath}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>→ {file.targetLanguage}</span>
                  {file.tokensUsed > 0 ? <span>{file.tokensUsed} tokens</span> : null}
                  {file.prNumber ? (
                    <a
                      href={`https://github.com/${repositoryFullName}/pull/${file.prNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      PR #{file.prNumber}
                    </a>
                  ) : null}
                </div>
              </div>
              <span className="rounded-full bg-accent px-2 py-1 text-xs text-foreground">
                {file.status === 'completed'
                  ? '成功'
                  : file.status === 'failed'
                    ? '失败'
                    : '处理中'}
              </span>
            </div>
            {file.errorMessage ? (
              <p className="mt-2 rounded bg-red-100/60 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
                {file.errorMessage}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
