'use client'

import Image from 'next/image'
import type { User } from './settings-form'

interface AccountSectionProps {
  user: User
}

export default function AccountSection({ user }: AccountSectionProps) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border/70 bg-card/90 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">账户信息</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          当前登录账户以及基础身份信息。
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {user.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-lg">{user.username}</p>
            <p className="text-sm text-muted-foreground">
              {user.email || '未设置邮箱'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border/70 pt-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-accent/50 p-4">
            <p className="text-sm text-muted-foreground">登录方式</p>
            <p className="mt-1 font-medium">GitHub App 登录</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-accent/50 p-4">
            <p className="text-sm text-muted-foreground">账户类型</p>
            <p className="mt-1 font-medium">GitHub 用户</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-accent/50 p-4">
            <p className="text-sm text-muted-foreground">联系邮箱</p>
            <p className="mt-1 font-medium">{user.email || '未设置邮箱'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
