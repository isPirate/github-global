import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import SignOutButton from '@/app/dashboard/sign-out-button'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const { user } = session

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
            <h1 className="text-3xl font-bold">设置</h1>
            <p className="text-muted-foreground mt-2">
              配置您的账户和偏好设置
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 账户信息 */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">账户信息</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email || '未设置邮箱'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 偏好设置 */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">偏好设置</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">默认目标语言</p>
                  <p className="text-sm text-muted-foreground">
                    选择默认的翻译目标语言
                  </p>
                </div>
                <select
                  className="rounded-md border bg-background px-3 py-2"
                  disabled
                >
                  <option>英语 (English)</option>
                  <option>日语 (日本語)</option>
                  <option>韩语 (한국어)</option>
                  <option>法语 (Français)</option>
                  <option>德语 (Deutsch)</option>
                  <option>西班牙语 (Español)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">自动提交 PR</p>
                  <p className="text-sm text-muted-foreground">
                    翻译完成后自动创建 Pull Request
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" disabled />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">翻译历史</p>
                  <p className="text-sm text-muted-foreground">
                    保存翻译历史记录
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" disabled checked />
              </div>
            </div>
          </div>

          {/* 危险操作 */}
          <div className="rounded-lg border border-red-500/50 bg-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">危险操作</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">退出登录</p>
                  <p className="text-sm text-muted-foreground">
                    退出当前账户
                  </p>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-yellow-500/10 p-6">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⚠️ 设置功能即将推出。当前只显示基本信息和退出登录功能。
          </p>
        </div>
      </div>
    </div>
  )
}
