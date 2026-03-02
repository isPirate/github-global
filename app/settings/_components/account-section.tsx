'use client'

import type { User } from './settings-form'

interface AccountSectionProps {
  user: User
}

export default function AccountSection({ user }: AccountSectionProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">账户信息</h2>

      <div className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-4">
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-lg">{user.username}</p>
            <p className="text-sm text-muted-foreground">
              {user.email || '未设置邮箱'}
            </p>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">登录方式</p>
            <p className="font-medium">GitHub OAuth</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">账户类型</p>
            <p className="font-medium">GitHub 用户</p>
          </div>
        </div>
      </div>
    </div>
  )
}
