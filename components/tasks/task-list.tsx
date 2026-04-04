import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { TaskItem } from '@/components/tasks/task-item'

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
  sourceBranch?: string | null
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

interface TaskListProps {
  tasks: TranslationTask[]
  expandedTasks: Set<string>
  onToggle: (taskId: string) => void
  onRetry: (taskId: string) => void
  filter: string
}

export function TaskList({
  tasks,
  expandedTasks,
  onToggle,
  onRetry,
  filter,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-7 w-7" />}
        title="没有匹配的任务"
        description={
          filter === 'all'
            ? '还没有翻译任务。完成仓库配置并触发翻译后，任务会出现在这里。'
            : '当前筛选条件下没有任务结果。可以切换状态筛选或稍后刷新。'
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          expanded={expandedTasks.has(task.id)}
          onToggle={() => onToggle(task.id)}
          onRetry={onRetry}
          progress={
            task.totalFiles === 0
              ? 0
              : Math.round((task.processedFiles / task.totalFiles) * 100)
          }
        />
      ))}
    </div>
  )
}
