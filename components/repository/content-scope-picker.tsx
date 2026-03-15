'use client'

import { Check } from 'lucide-react'
import type { ScopeMode } from '@/lib/repository-config'

interface ContentScopePickerProps {
  value: ScopeMode
  onChange: (value: Exclude<ScopeMode, 'advanced_rules'>) => void
}

const SCOPE_OPTIONS: Array<{
  value: Exclude<ScopeMode, 'advanced_rules'>
  title: string
  description: string
}> = [
  {
    value: 'preset_common_docs',
    title: '常见文档',
    description: '自动覆盖 README、docs 目录以及常见 Markdown 文档，适合大多数仓库。',
  },
  {
    value: 'preset_readme_docs',
    title: 'README + docs',
    description: '只翻译 README 和 docs 目录，适合先从核心文档开始。',
  },
  {
    value: 'preset_all_markdown',
    title: '全部 Markdown',
    description: '翻译仓库中的全部 Markdown 和 MDX 文件。',
  },
  {
    value: 'manual_selection',
    title: '手动选择文件',
    description: '从仓库文件列表里精确勾选要翻译的文档。',
  },
]

export default function ContentScopePicker({ value, onChange }: ContentScopePickerProps) {
  return (
    <div className="space-y-3">
      {SCOPE_OPTIONS.map((option) => {
        const selected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
              }`}
            >
              {selected && <Check className="h-3.5 w-3.5" />}
            </div>
            <div className="space-y-1">
              <div className="font-medium">{option.title}</div>
              <div className="text-sm text-muted-foreground">{option.description}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
