'use client'

import { useState } from 'react'
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
      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-green-600">
          设置已保存！
        </div>
      )}

      {/* Account Section - 账户信息放最上面 */}
      <AccountSection user={user} />

      {/* Preferences Section */}
      <PreferencesSection
        settings={settings}
        onUpdate={handleUpdateSettings}
        onSave={handleSavePreferences}
        saving={saving}
      />

      {/* API Key Section */}
      <ApiKeySection
        hasKey={settings.hasOpenRouterKey}
        onSave={handleSaveApiKey}
        onDelete={handleDeleteApiKey}
        saving={saving}
      />

      {/* GitHub App Section */}
      <GitHubAppSection installations={installations} />

      {/* Danger Zone Section - 危险操作放最后 */}
      <DangerZoneSection />
    </div>
  )
}
