'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Loader2, AlertCircle } from 'lucide-react'
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
        description: '请先配置翻译设置',
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
        description: `仓库 "${repositoryName}" 的翻译已开始`,
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

  if (!isActive) {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors',
          'bg-muted text-muted-foreground cursor-not-allowed',
          variant === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2',
          className
        )}
      >
        <AlertCircle className="w-4 h-4" />
        仓库未启用
      </button>
    )
  }

  if (!hasConfig) {
    return (
      <button
        onClick={() => router.push(`/repositories/${repositoryId}/config`)}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors',
          'bg-primary/10 text-primary hover:bg-primary/20',
          variant === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2',
          className
        )}
      >
        <AlertCircle className="w-4 h-4" />
        配置翻译
      </button>
    )
  }

  return (
    <button
      onClick={handleTranslate}
      disabled={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2',
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          启动中...
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          立即翻译
        </>
      )}
    </button>
  )
}
