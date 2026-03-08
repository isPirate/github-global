import { CheckCircle2, FileText, Loader2, XCircle } from 'lucide-react'
import { StatCard } from '@/components/metrics/stat-card'

interface TaskSummaryCardsProps {
  total: number
  processing: number
  completed: number
  failed: number
}

export function TaskSummaryCards({
  total,
  processing,
  completed,
  failed,
}: TaskSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="全部任务"
        value={total}
        description="当前分页结果中的任务总量"
        icon={<FileText className="h-5 w-5" />}
      />
      <StatCard
        title="进行中"
        value={processing}
        description="系统会自动轮询更新这些任务"
        icon={<Loader2 className="h-5 w-5" />}
        emphasis={processing > 0 ? 'warning' : 'default'}
      />
      <StatCard
        title="已完成"
        value={completed}
        description="已完成的翻译任务"
        icon={<CheckCircle2 className="h-5 w-5" />}
        emphasis="success"
      />
      <StatCard
        title="失败"
        value={failed}
        description="需要优先查看失败原因或重试"
        icon={<XCircle className="h-5 w-5" />}
        emphasis={failed > 0 ? 'warning' : 'default'}
      />
    </div>
  )
}
