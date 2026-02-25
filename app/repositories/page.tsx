import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import Link from 'next/link'

export default async function RepositoriesPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← 返回 Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">我的仓库</h1>
            <p className="text-muted-foreground mt-2">
              管理您的 GitHub 仓库翻译项目
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">还没有仓库</h2>
            <p className="text-muted-foreground mb-6">
              添加您的第一个 GitHub 仓库开始翻译
            </p>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
              disabled
            >
              添加仓库（即将推出）
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">功能说明</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• 添加您的 GitHub 仓库</li>
            <li>• 选择需要翻译的文件和目录</li>
            <li>• 配置目标语言</li>
            <li>• 自动翻译并提交 Pull Request</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
