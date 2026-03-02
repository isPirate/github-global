'use client'

import { useState } from 'react'
import type { UserSettings } from './settings-form'

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
]

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
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    settings.defaultTargetLanguages
  )

  const handleToggleLanguage = (langCode: string) => {
    const newLanguages = selectedLanguages.includes(langCode)
      ? selectedLanguages.filter((l) => l !== langCode)
      : [...selectedLanguages, langCode]
    setSelectedLanguages(newLanguages)
    onUpdate('defaultTargetLanguages', newLanguages)
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">偏好设置</h2>
      <p className="text-sm text-muted-foreground mb-6">
        配置默认的翻译偏好，这些设置将作为新仓库的默认值
      </p>

      <div className="space-y-6">
        {/* Default Target Languages */}
        <div>
          <label className="block text-sm font-medium mb-2">
            默认目标语言
          </label>
          <p className="text-sm text-muted-foreground mb-3">
            选择新建仓库时默认的翻译目标语言
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <label
                key={lang.code}
                className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors ${
                  selectedLanguages.includes(lang.code)
                    ? 'bg-primary/10 border-primary'
                    : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang.code)}
                  onChange={() => handleToggleLanguage(lang.code)}
                  className="rounded"
                />
                <span className="text-sm">{lang.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Auto Create PR */}
        <div className="flex items-center justify-between py-3 border-t">
          <div>
            <p className="font-medium">自动创建 PR</p>
            <p className="text-sm text-muted-foreground">
              翻译完成后自动创建 Pull Request
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoCreatePr}
              onChange={(e) => onUpdate('autoCreatePr', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Save Translation History */}
        <div className="flex items-center justify-between py-3 border-t">
          <div>
            <p className="font-medium">保存翻译历史</p>
            <p className="text-sm text-muted-foreground">
              保留翻译历史记录以便追踪和回溯
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.saveTranslationHistory}
              onChange={(e) => onUpdate('saveTranslationHistory', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between py-3 border-t">
          <div>
            <p className="font-medium">邮件通知</p>
            <p className="text-sm text-muted-foreground">
              翻译完成或出错时发送邮件通知
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => onUpdate('emailNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '保存偏好设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
