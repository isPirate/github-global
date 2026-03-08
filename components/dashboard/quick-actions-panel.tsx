import Link from 'next/link'
import { Github, KeyRound, Rocket, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QuickActionsPanelProps {
  username: string
  email?: string | null
  githubId: string
  installationCount: number
}

export function QuickActionsPanel({
  username,
  email,
  githubId,
  installationCount,
}: QuickActionsPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="rounded-[var(--radius-xl)] border-border/70">
        <CardHeader>
          <CardTitle className="text-xl">下一步建议</CardTitle>
          <p className="text-sm text-muted-foreground">
            结合当前控制台状态，优先完成仓库同步、任务查看和配置维护。
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button asChild className="h-auto justify-start rounded-[var(--radius-lg)] px-4 py-4">
            <Link href="/repositories" className="flex-col items-start gap-2">
              <Github className="h-5 w-5" />
              <span>同步仓库</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto justify-start rounded-[var(--radius-lg)] px-4 py-4"
          >
            <Link href="/tasks" className="flex-col items-start gap-2">
              <Rocket className="h-5 w-5" />
              <span>查看任务</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto justify-start rounded-[var(--radius-lg)] px-4 py-4"
          >
            <Link href="/settings" className="flex-col items-start gap-2">
              <Settings2 className="h-5 w-5" />
              <span>调整设置</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-xl)] border-border/70">
        <CardHeader>
          <CardTitle className="text-xl">账户摘要</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">用户名</p>
            <p className="mt-1 font-medium text-foreground">{username}</p>
          </div>
          <div>
            <p className="text-muted-foreground">邮箱</p>
            <p className="mt-1 font-medium text-foreground">{email || '未设置'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">GitHub ID</p>
            <p className="mt-1 font-medium text-foreground">{githubId}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-accent/60 p-4">
            <div className="flex items-center gap-2 text-primary">
              <KeyRound className="h-4 w-4" />
              <span className="font-medium">安装记录</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              当前检测到 {installationCount} 个 GitHub App 安装记录。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
