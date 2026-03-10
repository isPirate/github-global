'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Play } from 'lucide-react'
import { useToast } from '@/components/toast/use-toast'
import { cn } from '@/lib/utils'

interface QuickTranslateButtonProps {
  repositoryId: string
  repositoryName: string
  isActive: boolean
  hasConfig: boolean
  className?: string
  variant?: 'default' | 'compact'
  onSuccess?: (taskId: string) => void
}

export function QuickTranslateButton({
  repositoryId,
  repositoryName,
  isActive,
  hasConfig,
  className,
  variant = 'default',
  onSuccess,
}: QuickTranslateButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleTranslate = async () => {
    if (!isActive) {
      toast({
        title: '仓库未启用',
        description: '请先启用此仓库才能开始翻译',
        variant: 'warning',
      })
      return
    }

    if (!hasConfig) {
      toast({
        title: '未配置翻译',
        description: '请先配置翻译设置后再触发手动翻译',
        variant: 'warning',
        action: {
          label: '前往配置',
          onClick: () => router.push(`/repositories/${repositoryId}/config`),
        },
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/repositories/${repositoryId}/translate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || '翻译启动失败')
      }

      const data = await response.json()

      toast({
        title: '翻译任务已创建',
        description: `仓库 "${repositoryName}" 的翻译已开始，任务 ID: ${data.taskId}`,
        variant: 'success',
        action: {
          label: '查看进度',
          onClick: () => {
            router.push('/tasks')
          },
        },
      })

      onSuccess?.(data.taskId)
    } catch (error) {
      console.error('Translation error:', error)
      toast({
        title: '翻译启动失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const baseClasses =
    variant === 'compact'
      ? 'min-h-11 rounded-xl px-4 py-2.5 text-sm'
      : 'min-h-12 rounded-2xl px-5 py-3 text-sm'

  if (!isActive) {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center justify-center gap-2 border font-medium transition-all',
          'cursor-not-allowed border-border/70 bg-muted/70 text-muted-foreground',
          baseClasses,
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        翻译不可用
      </button>
    )
  }

  return (
    <button
      onClick={handleTranslate}
      disabled={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        hasConfig
          ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(22,163,74,0.18)] hover:-translate-y-0.5 hover:bg-primary/92'
          : 'border-primary/20 bg-primary/[0.08] text-primary hover:border-primary/35 hover:bg-primary/[0.14]',
        baseClasses,
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          启动中...
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          立即翻译
        </>
      )}
    </button>
  )
}

