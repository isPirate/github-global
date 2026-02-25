import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import SignOutButton from './sign-out-button'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const { user } = session

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              欢迎回来, {user.username}!
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-12 h-12 rounded-full"
              />
            )}
            <SignOutButton />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">我的仓库</h2>
            <p className="text-muted-foreground">
              查看和管理您的 GitHub 仓库翻译项目
            </p>
            <a
              href="/repositories"
              className="inline-block mt-4 text-primary hover:underline"
            >
              查看仓库 →
            </a>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">翻译任务</h2>
            <p className="text-muted-foreground">
              查看翻译进度和任务状态
            </p>
            <a
              href="/tasks"
              className="inline-block mt-4 text-primary hover:underline"
            >
              查看任务 →
            </a>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">设置</h2>
            <p className="text-muted-foreground">
              配置您的账户和偏好设置
            </p>
            <a
              href="/settings"
              className="inline-block mt-4 text-primary hover:underline"
            >
              打开设置 →
            </a>
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">账户信息</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">用户名:</span> {user.username}
              </p>
              <p>
                <span className="font-medium">邮箱:</span> {user.email || '未设置'}
              </p>
              <p>
                <span className="font-medium">GitHub ID:</span> {user.githubId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
