'use client'

import SignOutButton from '@/app/dashboard/sign-out-button'

export default function DangerZoneSection() {
  return (
    <div className="rounded-lg border border-red-500/50 bg-card p-6">
      <h2 className="text-xl font-semibold mb-4 text-red-600">危险操作</h2>
      <p className="text-sm text-muted-foreground mb-4">
        以下操作不可撤销，请谨慎操作
      </p>

      <div className="space-y-4">
        {/* Sign Out */}
        <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-md border border-red-500/20">
          <div>
            <p className="font-medium">退出登录</p>
            <p className="text-sm text-muted-foreground">
              退出当前账户，清除本地会话
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
