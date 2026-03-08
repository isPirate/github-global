'use client'

import { useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import PreferencesSection from './preferences-section'
import ApiKeySection from './api-key-section'
import GitHubAppSection from './github-app-section'
import AccountSection from './account-section'
import DangerZoneSection from './danger-zone-section'

export interface UserSettings {
  defaultTargetLanguages: string[]
  autoCreatePr: boolean
  saveTranslationHistory: boolean
  emailNotifications: boolean
  hasOpenRouterKey: boolean
}

export interface Installation {
  id: string
  installationId: string
  accountLogin: string
  accountType: string
  repositorySelection: string
  createdAt: string
}

export interface User {
  id: string
  username: string
  email?: string | null
  avatarUrl?: string | null
}

interface SettingsFormProps {
  initialSettings: UserSettings
  user: User
  installations: Installation[]
}

export default function SettingsForm({
  initialSettings,
  user,
  installations,
}: SettingsFormProps) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpdateSettings = (key: keyof UserSettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTargetLanguages: settings.defaultTargetLanguages,
          autoCreatePr: settings.autoCreatePr,
          saveTranslationHistory: settings.saveTranslationHistory,
          emailNotifications: settings.emailNotifications,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApiKey = async (apiKey: string) => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openRouterKey: apiKey }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save API key')
      }

      const data = await response.json()
      setSettings((prev) => ({
        ...prev,
        hasOpenRouterKey: data.settings.hasOpenRouterKey,
      }))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteApiKey = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openRouterKey: '' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete API key')
      }

      setSettings((prev) => ({ ...prev, hasOpenRouterKey: false }))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>设置已保存。</div>
        </div>
      )}

      <AccountSection user={user} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PreferencesSection
          settings={settings}
          onUpdate={handleUpdateSettings}
          onSave={handleSavePreferences}
          saving={saving}
        />
        <div className="space-y-6">
          <ApiKeySection
            hasKey={settings.hasOpenRouterKey}
            onSave={handleSaveApiKey}
            onDelete={handleDeleteApiKey}
            saving={saving}
          />
          <GitHubAppSection installations={installations} />
        </div>
      </div>
      <DangerZoneSection />
    </div>
  )
}
