'use client'

import LanguageMultiSelect from '@/components/repository/language-multi-select'
import type { UserSettings } from './settings-form'

interface PreferencesSectionProps {
  settings: UserSettings
  onUpdate: (key: keyof UserSettings, value: unknown) => void
  onSave: () => void
  saving: boolean
}

export default function PreferencesSection({
  settings,
  onUpdate,
  onSave,
  saving,
}: PreferencesSectionProps) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border/70 bg-card/90 p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">偏好设置</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        配置默认翻译偏好。这些设置会作为新仓库配置页的初始值。
      </p>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">默认目标语言</label>
          <p className="mb-3 text-sm text-muted-foreground">
            新仓库首次进入配置页时，会优先带出这里选择的目标语言。翻译任务会默认创建分支并提交 PR，任务历史也会保留用于追踪和排查。
          </p>
          <LanguageMultiSelect
            selectedCodes={settings.defaultTargetLanguages}
            onChange={(languages) => onUpdate('defaultTargetLanguages', languages)}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-2xl bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存偏好设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
