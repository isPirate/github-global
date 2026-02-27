'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface TranslationConfig {
  id?: string
  baseLanguage: string
  targetLanguages: string[]
  filePatterns: string[]
  excludePatterns?: string[]
  targetBranchTemplate: string
  commitMessageTemplate: string
  syncStrategy: 'full' | 'incremental' | 'manual'
  triggerMode: 'webhook' | 'cron' | 'manual'
}

interface TranslationEngine {
  id?: string
  engineType: string
  config: {
    model: string
    temperature?: number
    maxTokens?: number
  }
  isActive: boolean
  hasApiKey?: boolean
}

interface Repository {
  id: string
  name: string
  fullName: string
  isActive: boolean
}

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

const SYNC_STRATEGIES = [
  { value: 'full', label: '全量翻译', description: '每次翻译所有匹配的文件' },
  { value: 'incremental', label: '增量翻译', description: '仅翻译修改过的文件' },
  { value: 'manual', label: '手动触发', description: '仅手动触发时翻译' },
]

const TRIGGER_MODES = [
  { value: 'webhook', label: '自动 (Webhook)', description: 'Push 事件自动触发翻译' },
  { value: 'manual', label: '手动', description: '仅手动触发翻译' },
]

export default function RepositoryConfigPage() {
  const router = useRouter()
  const params = useParams()
  const repositoryId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [repository, setRepository] = useState<Repository | null>(null)
  const [config, setConfig] = useState<TranslationConfig>({
    baseLanguage: 'en',
    targetLanguages: [],
    filePatterns: ['**/*.md', '**/*.mdx'],
    excludePatterns: [],
    targetBranchTemplate: 'i18n/{lang}',
    commitMessageTemplate: 'docs: translate to {lang}',
    syncStrategy: 'incremental',
    triggerMode: 'webhook',
  })

  const [engine, setEngine] = useState<TranslationEngine>({
    engineType: 'openrouter',
    config: {
      model: 'openai/gpt-4-turbo',
      temperature: 0.3,
    },
    isActive: true,
  })

  const [apiKey, setApiKey] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  useEffect(() => {
    fetchConfig()
  }, [repositoryId])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[Config Page] Fetching config for repository:', repositoryId)

      const response = await fetch(`/api/repositories/${repositoryId}/config`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Config Page] API error:', response.status, errorData)

        if (response.status === 404) {
          setError('未找到仓库，可能已被删除或您没有权限访问')
          // Don't auto-redirect, let user see the error
          return
        }
        throw new Error(errorData.error || errorData.message || 'Failed to fetch configuration')
      }

      const data = await response.json()

      if (data.config) {
        setConfig(data.config)
        setSelectedLanguages(data.config.targetLanguages || [])
      }

      if (data.engines && data.engines.length > 0) {
        const activeEngine = data.engines.find((e: TranslationEngine) => e.isActive) || data.engines[0]
        setEngine({
          id: activeEngine.id,
          engineType: activeEngine.engineType,
          config: activeEngine.config,
          isActive: activeEngine.isActive,
          hasApiKey: activeEngine.hasApiKey,
        })
      }

      setRepository(data.repository)
      console.log('[Config Page] Config loaded successfully')
    } catch (err) {
      console.error('Error fetching config:', err)
      setError(err instanceof Error ? err.message : 'Failed to load configuration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Validation
      if (selectedLanguages.length === 0) {
        setError('请至少选择一种目标语言')
        return
      }

      if (config.filePatterns.length === 0) {
        setError('请至少添加一个文件匹配模式')
        return
      }

      if (!apiKey && !engine.hasApiKey) {
        setError('请输入翻译引擎的 API Key')
        return
      }

      const payload = {
        ...config,
        targetLanguages: selectedLanguages,
        engine: {
          ...engine,
          apiKey: apiKey || undefined, // Only send if provided
        },
      }

      const response = await fetch(`/api/repositories/${repositoryId}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to save configuration')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // If API key was provided, clear it after saving
      if (apiKey) {
        setApiKey('')
      }
    } catch (err) {
      console.error('Error saving config:', err)
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleLanguage = (langCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((l) => l !== langCode)
        : [...prev, langCode]
    )
  }

  const handleAddFilePattern = () => {
    setConfig((prev) => ({
      ...prev,
      filePatterns: [...prev.filePatterns, ''],
    }))
  }

  const handleUpdateFilePattern = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      filePatterns: prev.filePatterns.map((p, i) => (i === index ? value : p)),
    }))
  }

  const handleRemoveFilePattern = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      filePatterns: prev.filePatterns.filter((_, i) => i !== index),
    }))
  }

  const handleEnableRepository = async () => {
    try {
      const response = await fetch(`/api/repositories/${repositoryId}/enable`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to enable repository')
      }

      setRepository((prev) => (prev ? { ...prev, isActive: true } : null))
    } catch (err) {
      console.error('Error enabling repository:', err)
      alert('Failed to enable repository')
    }
  }

  const handleDisableRepository = async () => {
    try {
      const response = await fetch(`/api/repositories/${repositoryId}/disable`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disable repository')
      }

      setRepository((prev) => (prev ? { ...prev, isActive: false } : null))
    } catch (err) {
      console.error('Error disabling repository:', err)
      alert('Failed to disable repository')
    }
  }

  const handleTranslateNow = async () => {
    try {
      if (!repository?.isActive) {
        alert('请先启用仓库翻译')
        return
      }

      const response = await fetch(`/api/repositories/${repositoryId}/translate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to trigger translation')
      }

      const data = await response.json()
      alert(`翻译任务已创建！任务ID: ${data.taskId}\n您可以在任务页面查看进度。`)
      router.push('/tasks')
    } catch (err) {
      console.error('Error triggering translation:', err)
      alert(err instanceof Error ? err.message : 'Failed to trigger translation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading configuration...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/repositories"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← 返回仓库列表
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {repository?.name || 'Repository'} 翻译配置
              </h1>
              <p className="text-muted-foreground mt-2">
                配置翻译参数和引擎设置
              </p>
            </div>
            <div className="flex items-center gap-2">
              {repository?.isActive ? (
                <>
                  <span className="text-sm text-green-600">● 已启用</span>
                  <button
                    onClick={handleTranslateNow}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    立即翻译
                  </button>
                  <button
                    onClick={handleDisableRepository}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
                  >
                    禁用
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600">○ 未启用</span>
                  <button
                    onClick={handleEnableRepository}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    启用翻译
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-green-600">
            配置保存成功！
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">基本设置</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  基准语言
                </label>
                <select
                  value={config.baseLanguage}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, baseLanguage: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="auto">自动检测</option>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  目标语言 (可多选)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.filter((l) => l.code !== config.baseLanguage).map((lang) => (
                    <label
                      key={lang.code}
                      className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted ${
                        selectedLanguages.includes(lang.code) ? 'bg-primary/10 border-primary' : ''
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
            </div>
          </div>

          {/* File Patterns */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">文件匹配规则</h2>
            <p className="text-sm text-muted-foreground mb-4">
              使用 glob 模式匹配需要翻译的文件
            </p>

            <div className="space-y-2">
              {config.filePatterns.map((pattern, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => handleUpdateFilePattern(index, e.target.value)}
                    placeholder="例如: **/*.md"
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button
                    onClick={() => handleRemoveFilePattern(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    disabled={config.filePatterns.length === 1}
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddFilePattern}
                className="text-sm text-primary hover:underline"
              >
                + 添加文件模式
              </button>
            </div>
          </div>

          {/* Sync Strategy */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">同步策略</h2>

            <div className="space-y-3">
              {SYNC_STRATEGIES.map((strategy) => (
                <label
                  key={strategy.value}
                  className={`flex items-start gap-3 p-4 border rounded-md cursor-pointer hover:bg-muted ${
                    config.syncStrategy === strategy.value ? 'bg-primary/10 border-primary' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="syncStrategy"
                    value={strategy.value}
                    checked={config.syncStrategy === strategy.value}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        syncStrategy: e.target.value as any,
                      }))
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{strategy.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {strategy.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Trigger Mode */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">触发方式</h2>

            <div className="space-y-3">
              {TRIGGER_MODES.map((mode) => (
                <label
                  key={mode.value}
                  className={`flex items-start gap-3 p-4 border rounded-md cursor-pointer hover:bg-muted ${
                    config.triggerMode === mode.value ? 'bg-primary/10 border-primary' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="triggerMode"
                    value={mode.value}
                    checked={config.triggerMode === mode.value}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        triggerMode: e.target.value as any,
                      }))
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-sm text-muted-foreground">{mode.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Branch & Commit Templates */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">分支与提交配置</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  目标分支模板
                </label>
                <input
                  type="text"
                  value={config.targetBranchTemplate}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      targetBranchTemplate: e.target.value,
                    }))
                  }
                  placeholder="i18n/{lang}"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  使用 {'{lang}'} 作为语言代码的占位符
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  提交消息模板
                </label>
                <input
                  type="text"
                  value={config.commitMessageTemplate}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      commitMessageTemplate: e.target.value,
                    }))
                  }
                  placeholder="docs: translate to {lang}"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  使用 {'{lang}'} 作为语言代码的占位符
                </p>
              </div>
            </div>
          </div>

          {/* Translation Engine */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">翻译引擎配置</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">引擎类型</label>
                <select
                  value={engine.engineType}
                  onChange={(e) =>
                    setEngine((prev) => ({ ...prev, engineType: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="openrouter">OpenRouter (推荐)</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  API Key {engine.hasApiKey && ' (已配置)'}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={engine.hasApiKey ? '留空以保持现有 API Key' : '输入 API Key'}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {engine.engineType === 'openrouter'
                    ? '在 OpenRouter 获取 API Key'
                    : '在 OpenAI 获取 API Key'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">模型</label>
                <input
                  type="text"
                  value={engine.config.model}
                  onChange={(e) =>
                    setEngine((prev) => ({
                      ...prev,
                      config: { ...prev.config, model: e.target.value },
                    }))
                  }
                  placeholder="openai/gpt-4-turbo"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  OpenRouter 模型格式: openai/gpt-4-turbo, anthropic/claude-3-opus, etc.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature: {engine.config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={engine.config.temperature || 0.3}
                  onChange={(e) =>
                    setEngine((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        temperature: parseFloat(e.target.value),
                      },
                    }))
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  较低的值会使翻译更加准确和一致
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/repositories"
              className="px-6 py-3 border rounded-md hover:bg-muted"
            >
              取消
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
