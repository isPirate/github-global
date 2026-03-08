import { redirect } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { QuickActionsPanel } from '@/components/dashboard/quick-actions-panel'
import { RecentActivityList } from '@/components/dashboard/recent-activity-list'
import { RepositorySummaryPanel } from '@/components/dashboard/repository-summary-panel'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell } from '@/components/layout/page-shell'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/signin')
  }

  const { user } = session

  const [repositoryCount, configuredCount, totalTaskCount, processingCount, installationCount] =
    await Promise.all([
      prisma.repository.count({
        where: { userId: user.id },
      }),
      prisma.translationConfig.count({
        where: {
          repository: {
            userId: user.id,
          },
        },
      }),
      prisma.translationTask.count({
        where: {
          repository: {
            userId: user.id,
          },
        },
      }),
      prisma.translationTask.count({
        where: {
          status: 'processing',
          repository: {
            userId: user.id,
          },
        },
      }),
      prisma.gitHubAppInstallation.count({
        where: { userId: user.id },
      }),
    ])

  const [recentTasks, repositories] = await Promise.all([
    prisma.translationTask.findMany({
      where: {
        repository: {
          userId: user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 4,
      select: {
        id: true,
        status: true,
        triggerType: true,
        processedFiles: true,
        totalFiles: true,
        createdAt: true,
        repository: {
          select: {
            name: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.repository.findMany({
      where: { userId: user.id },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 4,
      select: {
        id: true,
        name: true,
        fullName: true,
        stargazersCount: true,
        isActive: true,
        config: {
          select: {
            id: true,
          },
        },
      },
    }),
  ])

  return (
    <AppLayout
      user={{ username: user.username, avatarUrl: user.avatarUrl }}
      processingTaskCount={processingCount}
    >
      <PageShell spacing="comfortable">
        <PageHeader
          eyebrow="Dashboard"
          title={`欢迎回来，${user.username}`}
          description="这里集中展示当前仓库状态、最近任务和需要优先处理的操作。"
        />

        <DashboardOverview
          repositoryCount={repositoryCount}
          configuredCount={configuredCount}
          totalTaskCount={totalTaskCount}
          processingCount={processingCount}
        />

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <RecentActivityList tasks={recentTasks} />
          <RepositorySummaryPanel
            repositories={repositories.map((repository) => ({
              id: repository.id,
              name: repository.name,
              fullName: repository.fullName,
              stargazersCount: repository.stargazersCount,
              isActive: repository.isActive,
              hasConfig: Boolean(repository.config),
            }))}
          />
        </div>

        <QuickActionsPanel
          username={user.username}
          email={user.email}
          githubId={user.githubId}
          installationCount={installationCount}
        />
      </PageShell>
    </AppLayout>
  )
}
