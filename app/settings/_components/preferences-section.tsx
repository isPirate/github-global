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
            新仓库首次进入配置页时，会优先带出这里选择的目标语言。
          </p>
          <LanguageMultiSelect
            selectedCodes={settings.defaultTargetLanguages}
            onChange={(languages) => onUpdate('defaultTargetLanguages', languages)}
          />
        </div>

        <div className="flex items-center justify-between border-t border-border/70 py-3">
          <div>
            <p className="font-medium">自动创建 PR</p>
            <p className="text-sm text-muted-foreground">
              翻译完成后自动创建 Pull Request。
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.autoCreatePr}
              onChange={(event) => onUpdate('autoCreatePr', event.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rtl:peer-checked:after:-translate-x-full" />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border/70 py-3">
          <div>
            <p className="font-medium">保存翻译历史</p>
            <p className="text-sm text-muted-foreground">
              保留翻译任务的历史记录，便于后续追踪和排查。
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.saveTranslationHistory}
              onChange={(event) => onUpdate('saveTranslationHistory', event.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rtl:peer-checked:after:-translate-x-full" />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border/70 py-3">
          <div>
            <p className="font-medium">邮件通知</p>
            <p className="text-sm text-muted-foreground">
              翻译完成或出错时通过邮件提醒你。
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(event) => onUpdate('emailNotifications', event.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rtl:peer-checked:after:-translate-x-full" />
          </label>
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
