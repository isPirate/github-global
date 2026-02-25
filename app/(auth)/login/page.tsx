'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    const description = searchParams.get('description')
    const message = searchParams.get('message')
    const relogin = searchParams.get('relogin')

    if (relogin === 'true') {
      setErrorMessage('您的会话已过期，请重新登录以获取最新功能。')
    } else if (error) {
      if (description) {
        setErrorMessage(decodeURIComponent(description))
      } else if (message) {
        setErrorMessage(decodeURIComponent(message))
      } else {
        switch (error) {
          case 'oauth_failed':
            setErrorMessage('登录失败，请稍后重试。如果是网络问题，请检查您的网络连接。')
            break
          case 'missing_code':
            setErrorMessage('授权码缺失，请重新尝试登录。')
            break
          case 'access_denied':
            setErrorMessage('您已取消授权。')
            break
          default:
            setErrorMessage(`登录失败: ${error}`)
        }
      }
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">GitHub Global</CardTitle>
          <CardDescription>自动化翻译您的 GitHub 仓库文档</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          <Button asChild className="w-full" size="lg">
            <a href="/api/auth/signin">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              使用 GitHub 登录
            </a>
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            登录即表示您同意我们的服务条款和隐私政策
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
