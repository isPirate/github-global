import { BarChart3, CheckCircle2, FolderGit2, LoaderCircle } from 'lucide-react'
import { StatCard } from '@/components/metrics/stat-card'

interface DashboardOverviewProps {
  repositoryCount: number
  configuredCount: number
  totalTaskCount: number
  processingCount: number
}

export function DashboardOverview({
  repositoryCount,
  configuredCount,
  totalTaskCount,
  processingCount,
}: DashboardOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="仓库总数"
        value={repositoryCount}
        description="当前已同步到控制台的仓库数量"
        icon={<FolderGit2 className="h-5 w-5" />}
      />
      <StatCard
        title="已配置仓库"
        value={configuredCount}
        description="已具备翻译配置的仓库"
        icon={<CheckCircle2 className="h-5 w-5" />}
        emphasis="success"
      />
      <StatCard
        title="累计任务"
        value={totalTaskCount}
        description="当前数据库中的翻译任务总量"
        icon={<BarChart3 className="h-5 w-5" />}
      />
      <StatCard
        title="进行中任务"
        value={processingCount}
        description="需要优先关注的运行中任务"
        icon={<LoaderCircle className="h-5 w-5" />}
        emphasis={processingCount > 0 ? 'warning' : 'primary'}
      />
    </div>
  )
}
