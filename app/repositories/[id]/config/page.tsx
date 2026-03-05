'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ClientAppLayout from '@/components/client-app-layout'
import { useToast } from '@/components/toast/use-toast'
import {
  ChevronRight,
  Play,
  Power,
  PowerOff,
  Settings,
  Plus,
  Trash2,
  Check,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react'

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

interface OpenRouterModel {
  id: string
  name: string
  description?: string
  context_length?: number
  pricing?: {
    prompt?: string
    completion?: string
  }
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

const ENGINE_MODELS = {
  openrouter: [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/gpt-4-turbo',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-opus',
    'google/gemini-pro-1.5',
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ],
}

const POPULAR_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google' },
  { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: 'meta-llama/llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta' },
]

export default function RepositoryConfigPage() {
  const router = useRouter()
  const params = useParams()
  const repositoryId = params.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([])
  const [showCustomModelInput, setShowCustomModelInput] = useState(false)

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
      model: 'openai/gpt-4o',
      temperature: 0.3,
    },
    isActive: true,
  })

  const [apiKey, setApiKey] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  useEffect(() => {
    fetchConfig()
    fetchOpenRouterModels()
  }, [repositoryId])

  const fetchOpenRouterModels = async () => {
    try {
      setModelsLoading(true)
      const response = await fetch('/api/openrouter/models')
      if (response.ok) {
        const data = await response.json()
        setOpenRouterModels(data.models || [])
      }
    } catch (err) {
      console.error('Error fetching OpenRouter models:', err)
    } finally {
      setModelsLoading(false)
    }
  }

  // Combine popular models with fetched models
  const availableModels = useMemo(() => {
    const result: OpenRouterModel[] = []

    // Add popular models first (in order)
    POPULAR_MODELS.forEach(model => {
      result.push({
        id: model.id,
        name: model.name,
        description: `by ${model.provider}`,
      })
    })

    // Add models from OpenRouter that are not in popular list
    openRouterModels.forEach(model => {
      if (!POPULAR_MODELS.find(p => p.id === model.id)) {
        result.push(model)
      }
    })

    // Add currently selected model if not in the list
    if (engine.config.model && !result.find(m => m.id === engine.config.model)) {
      result.push({
        id: engine.config.model,
        name: engine.config.model,
        description: 'Custom model',
      })
    }

    return result
  }, [openRouterModels, engine.config.model])

  // Check if current model is in the available list
  useEffect(() => {
    const isInList = POPULAR_MODELS.some(m => m.id === engine.config.model) ||
                      openRouterModels.some(m => m.id === engine.config.model)
    setShowCustomModelInput(!isInList && engine.config.model !== '')
  }, [engine.config.model, openRouterModels])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/repositories/${repositoryId}/config`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 404) {
          setError('未找到仓库，可能已被删除或您没有权限访问')
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

      // Validation
      if (selectedLanguages.length === 0) {
        toast({
          title: '验证失败',
          description: '请至少选择一种目标语言',
          variant: 'warning',
        })
        return
      }

      if (config.filePatterns.length === 0 || config.filePatterns.some(p => !p.trim())) {
        toast({
          title: '验证失败',
          description: '请至少添加一个有效的文件匹配模式',
          variant: 'warning',
        })
        return
      }

      if (!apiKey && !engine.hasApiKey) {
        toast({
          title: '验证失败',
          description: '请输入翻译引擎的 API Key',
          variant: 'warning',
        })
        return
      }

      const payload = {
        ...config,
        targetLanguages: selectedLanguages,
        engine: {
          ...engine,
          apiKey: apiKey || undefined,
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

      toast({
        title: '保存成功',
        description: '翻译配置已保存',
        variant: 'success',
      })

      // Refresh config after saving
      await fetchConfig()

      // Clear API key if provided
      if (apiKey) {
        setApiKey('')
      }
    } catch (err) {
      console.error('Error saving config:', err)
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : 'Failed to save configuration',
        variant: 'error',
      })
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

  const handleToggleActive = async () => {
    try {
      setTogglingActive(true)

      const endpoint = repository?.isActive ? 'disable' : 'enable'
      const response = await fetch(`/api/repositories/${repositoryId}/${endpoint}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} repository`)
      }

      setRepository((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null))

      toast({
        title: repository?.isActive ? '仓库已禁用' : '仓库已启用',
        description: repository?.isActive
          ? '翻译功能已关闭'
          : '翻译功能已开启，现在可以开始翻译了',
        variant: 'success',
      })
    } catch (err) {
      console.error('Error toggling repository:', err)
      toast({
        title: '操作失败',
        description: err instanceof Error ? err.message : 'Failed to toggle repository',
        variant: 'error',
      })
    } finally {
      setTogglingActive(false)
    }
  }

  const handleTranslateNow = async () => {
    try {
      if (!repository?.isActive) {
        toast({
          title: '仓库未启用',
          description: '请先启用仓库翻译功能',
          variant: 'warning',
        })
        return
      }

      setTranslating(true)

      const response = await fetch(`/api/repositories/${repositoryId}/translate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to trigger translation')
      }

      const data = await response.json()

      toast({
        title: '翻译任务已创建',
        description: `任务ID: ${data.taskId}`,
        variant: 'success',
        action: {
          label: '查看进度',
          onClick: () => router.push('/tasks'),
        },
      })
    } catch (err) {
      console.error('Error triggering translation:', err)
      toast({
        title: '翻译启动失败',
        description: err instanceof Error ? err.message : 'Failed to trigger translation',
        variant: 'error',
      })
    } finally {
      setTranslating(false)
    }
  }

  if (loading) {
    return (
      <ClientAppLayout user={{ username: 'Loading...' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading configuration...</p>
          </div>
        </div>
      </ClientAppLayout>
    )
  }

  return (
    <ClientAppLayout user={{ username: 'User' }}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/repositories" className="hover:text-primary transition-colors">
          仓库
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/repositories/${repositoryId}/config`} className="hover:text-primary transition-colors">
          {repository?.name || 'Repository'}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">配置</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                已启用
              </span>
              <button
                onClick={handleTranslateNow}
                disabled={translating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {translating ? (
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
              <button
                onClick={handleToggleActive}
                disabled={togglingActive}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {togglingActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PowerOff className="w-4 h-4" />
                )}
                禁用
              </button>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                未启用
              </span>
              <button
                onClick={handleToggleActive}
                disabled={togglingActive}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {togglingActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
                启用翻译
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Configuration Sections */}
      <div className="space-y-6">
        {/* Basic Settings */}
        <section className="rounded-lg border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">基本设置</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                基准语言
              </label>
              <select
                value={config.baseLanguage}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, baseLanguage: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
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
                {SUPPORTED_LANGUAGES.filter((l) => l.code !== config.baseLanguage).map((lang) => {
                  const isSelected = selectedLanguages.includes(lang.code)
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleToggleLanguage(lang.code)}
                      className={`flex items-center gap-2 p-3 border rounded-md transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span className="text-sm">{lang.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* File Patterns */}
        <section className="rounded-lg border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">文件匹配规则</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
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
                    className="flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={() => handleRemoveFilePattern(index)}
                    disabled={config.filePatterns.length === 1}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddFilePattern}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加文件模式
              </button>
            </div>
          </div>
        </section>

        {/* Sync Strategy */}
        <section className="rounded-lg border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">同步策略</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {SYNC_STRATEGIES.map((strategy) => {
                const isSelected = config.syncStrategy === strategy.value
                return (
                  <button
                    key={strategy.value}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        syncStrategy: strategy.value as any,
                      }))
                    }
                    className={`w-full flex items-start gap-3 p-4 border rounded-md transition-all ${
                      isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                      isSelected ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {strategy.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Trigger Mode */}
        <section className="rounded-lg border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">触发方式</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {TRIGGER_MODES.map((mode) => {
                const isSelected = config.triggerMode === mode.value
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        triggerMode: mode.value as any,
                      }))
                    }
                    className={`w-full flex items-start gap-3 p-4 border rounded-md transition-all ${
                      isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                      isSelected ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-sm text-muted-foreground">{mode.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Branch & Commit Templates */}
        <section className="rounded-lg border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">分支与提交配置</h2>
          </div>
          <div className="p-6 space-y-4">
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
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
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
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                使用 {'{lang}'} 作为语言代码的占位符
              </p>
            </div>
          </div>
        </section>

        {/* Translation Engine */}
        <section className="rounded-lg border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">翻译引擎配置</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">引擎类型</label>
              <select
                value={engine.engineType}
                onChange={(e) =>
                  setEngine((prev) => ({ ...prev, engineType: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {engine.engineType === 'openrouter'
                  ? '在 OpenRouter 获取 API Key'
                  : '在 OpenAI 获取 API Key'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">模型</label>
                {engine.engineType === 'openrouter' && (
                  <button
                    type="button"
                    onClick={fetchOpenRouterModels}
                    disabled={modelsLoading}
                    className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${modelsLoading ? 'animate-spin' : ''}`} />
                    刷新模型列表
                  </button>
                )}
              </div>

              {engine.engineType === 'openrouter' ? (
                <>
                  <select
                    value={showCustomModelInput ? '__custom__' : engine.config.model}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '__custom__') {
                        setShowCustomModelInput(true)
                        setEngine((prev) => ({
                          ...prev,
                          config: { ...prev.config, model: '' },
                        }))
                      } else {
                        setShowCustomModelInput(false)
                        setEngine((prev) => ({
                          ...prev,
                          config: { ...prev.config, model: value },
                        }))
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.id}
                      </option>
                    ))}
                    <option value="__custom__">自定义模型...</option>
                  </select>

                  {showCustomModelInput && (
                    <input
                      type="text"
                      value={engine.config.model}
                      onChange={(e) =>
                        setEngine((prev) => ({
                          ...prev,
                          config: { ...prev.config, model: e.target.value },
                        }))
                      }
                      placeholder="例如: deepseek/deepseek-v3"
                      className="w-full mt-2 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      autoFocus
                    />
                  )}
                </>
              ) : (
                <select
                  value={engine.config.model}
                  onChange={(e) =>
                    setEngine((prev) => ({
                      ...prev,
                      config: { ...prev.config, model: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {ENGINE_MODELS[engine.engineType as keyof typeof ENGINE_MODELS]?.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              )}

              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {engine.engineType === 'openrouter'
                  ? 'OpenRouter 支持多种模型，选择自定义可输入任何 OpenRouter 支持的模型 ID'
                  : 'OpenAI 官方模型'}
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
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/repositories"
            className="px-6 py-3 border rounded-md hover:bg-muted transition-colors"
          >
            取消
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 inline mr-2" />
                保存配置
              </>
            )}
          </button>
        </div>
      </div>
    </ClientAppLayout>
  )
}
