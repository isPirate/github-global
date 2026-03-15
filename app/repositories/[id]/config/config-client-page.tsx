'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronRight,
  Info,
  Loader2,
  Play,
  Power,
  PowerOff,
  RefreshCw,
  Settings,
} from 'lucide-react'
import ClientAppLayout from '@/components/client-app-layout'
import ContentScopePicker from '@/components/repository/content-scope-picker'
import LanguageMultiSelect from '@/components/repository/language-multi-select'
import RepositoryFilePicker from '@/components/repository/repository-file-picker'
import { useToast } from '@/components/toast/use-toast'
import { GLOBAL_LANGUAGES } from '@/lib/i18n/languages'
import {
  DEFAULT_SCOPE_MODE,
  type ScopeMode,
  resolveFilePatterns,
  sanitizeSelectedFiles,
  sanitizeTargetLanguages,
} from '@/lib/repository-config'

interface TranslationConfig {
  id?: string
  baseLanguage: string
  targetLanguages: string[]
  scopeMode: ScopeMode
  selectedFiles: string[]
  filePatterns: string[]
  excludePatterns: string[]
  triggerMode: 'webhook' | 'manual'
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
}

interface RepositoryConfigClientPageProps {
  initialUser: {
    username: string
    avatarUrl?: string | null
  }
}

const RUN_MODES = [
  {
    value: 'webhook',
    label: '自动运行',
    description: '仓库支持自动触发时，提交变更后可自动创建翻译任务。',
  },
  {
    value: 'manual',
    label: '仅手动运行',
    description: '只有你点击“立即翻译”时才会创建任务，更适合先试运行。',
  },
] as const

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']

const POPULAR_OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Anthropic' },
  { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', description: 'DeepSeek' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', description: 'Google' },
]

function buildDefaultConfig(): TranslationConfig {
  return {
    baseLanguage: 'auto',
    targetLanguages: [],
    scopeMode: DEFAULT_SCOPE_MODE,
    selectedFiles: [],
    filePatterns: resolveFilePatterns(DEFAULT_SCOPE_MODE, []),
    excludePatterns: [],
    triggerMode: 'webhook',
  }
}

function buildDefaultEngine(): TranslationEngine {
  return {
    engineType: 'openrouter',
    config: {
      model: 'openai/gpt-4o-mini',
      temperature: 0.3,
    },
    isActive: true,
  }
}

export default function RepositoryConfigClientPage({ initialUser }: RepositoryConfigClientPageProps) {
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
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showCustomModelInput, setShowCustomModelInput] = useState(false)
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([])

  const [repository, setRepository] = useState<Repository | null>(null)
  const [config, setConfig] = useState<TranslationConfig>(buildDefaultConfig())
  const [engine, setEngine] = useState<TranslationEngine>(buildDefaultEngine())
  const [apiKey, setApiKey] = useState('')

  const baseLanguageOptions = useMemo(
    () => [{ code: 'auto', name: '自动识别', nativeName: '自动识别（推荐）' }, ...GLOBAL_LANGUAGES],
    []
  )

  const fetchOpenRouterModels = useCallback(async () => {
    try {
      setModelsLoading(true)
      const response = await fetch('/api/openrouter/models')
      if (!response.ok) {
        return
      }

      const data = await response.json()
      setOpenRouterModels(Array.isArray(data.models) ? data.models : [])
    } catch (fetchError) {
      console.error('Error fetching OpenRouter models:', fetchError)
    } finally {
      setModelsLoading(false)
    }
  }, [])

  const availableOpenRouterModels = useMemo(() => {
    const models = [...POPULAR_OPENROUTER_MODELS]

    openRouterModels.forEach((model) => {
      if (!models.find((item) => item.id === model.id)) {
        models.push({
          id: model.id,
          name: model.name,
          description: model.description || '',
        })
      }
    })

    if (engine.config.model && !models.find((item) => item.id === engine.config.model)) {
      models.push({
        id: engine.config.model,
        name: engine.config.model,
        description: 'Custom model',
      })
    }

    return models
  }, [engine.config.model, openRouterModels])

  const isKnownOpenRouterModel = useMemo(
    () =>
      Boolean(engine.config.model) &&
      (POPULAR_OPENROUTER_MODELS.some((item) => item.id === engine.config.model) ||
        openRouterModels.some((item) => item.id === engine.config.model)),
    [engine.config.model, openRouterModels]
  )



  useEffect(() => {
    if (engine.engineType === 'openai' && !OPENAI_MODELS.includes(engine.config.model)) {
      setEngine((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          model: OPENAI_MODELS[0],
        },
      }))
      setShowCustomModelInput(false)
    }

    if (engine.engineType === 'openrouter') {
      if (!showCustomModelInput && !engine.config.model) {
        setEngine((prev) => ({
          ...prev,
          config: {
            ...prev.config,
            model: 'openai/gpt-4o-mini',
          },
        }))
        return
      }

      if (engine.config.model) {
        setShowCustomModelInput(Boolean(engine.config.model) && !isKnownOpenRouterModel)
      }
    }
  }, [engine.config.model, engine.engineType, isKnownOpenRouterModel, showCustomModelInput])

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/repositories/${repositoryId}/config`)
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 404) {
          setError('未找到仓库，可能已被删除，或你没有访问权限')
          return
        }

        throw new Error(data.error || data.message || 'Failed to fetch configuration')
      }

      const nextConfig = data.config
        ? {
            ...buildDefaultConfig(),
            ...data.config,
            baseLanguage: data.config.baseLanguage || 'auto',
            targetLanguages: sanitizeTargetLanguages(
              data.config.baseLanguage || 'auto',
              data.config.targetLanguages || []
            ),
            selectedFiles: sanitizeSelectedFiles(data.config.selectedFiles || []),
            excludePatterns: Array.isArray(data.config.excludePatterns) ? data.config.excludePatterns : [],
          }
        : buildDefaultConfig()

      setConfig(nextConfig)

      if (data.engines && data.engines.length > 0) {
        const activeEngine = data.engines.find((item: TranslationEngine) => item.isActive) || data.engines[0]
        setEngine({
          id: activeEngine.id,
          engineType: activeEngine.engineType,
          config: activeEngine.config,
          isActive: activeEngine.isActive,
          hasApiKey: activeEngine.hasApiKey,
        })
      } else {
        setEngine(buildDefaultEngine())
      }

      setRepository(data.repository || null)
    } catch (fetchError) {
      console.error('Error fetching config:', fetchError)
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load configuration. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [repositoryId])

  useEffect(() => {
    void fetchConfig()
    void fetchOpenRouterModels()
  }, [fetchConfig, fetchOpenRouterModels])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const sanitizedLanguages = sanitizeTargetLanguages(config.baseLanguage, config.targetLanguages)

      if (sanitizedLanguages.length === 0) {
        toast({
          title: '校验失败',
          description: '请至少选择一种目标语言',
          variant: 'warning',
        })
        return
      }

      if (config.scopeMode === 'manual_selection' && config.selectedFiles.length === 0) {
        toast({
          title: '校验失败',
          description: '手动选择文件时，至少需要选中一个文件',
          variant: 'warning',
        })
        return
      }

      if (
        config.scopeMode === 'advanced_rules' &&
        (config.filePatterns.length === 0 || config.filePatterns.some((pattern) => !pattern.trim()))
      ) {
        toast({
          title: '校验失败',
          description: '高级规则模式下，请填写有效的文件规则',
          variant: 'warning',
        })
        return
      }

      if (!apiKey && !engine.hasApiKey) {
        toast({
          title: '校验失败',
          description: '请输入翻译引擎的 API Key',
          variant: 'warning',
        })
        return
      }

      if (!engine.config.model?.trim()) {
        toast({
          title: '校验失败',
          description: '请选择一个翻译模型',
          variant: 'warning',
        })
        return
      }

      const payload = {
        baseLanguage: config.baseLanguage,
        targetLanguages: sanitizedLanguages,
        scopeMode: config.scopeMode,
        selectedFiles: config.selectedFiles,
        filePatterns: config.filePatterns,
        excludePatterns: config.excludePatterns,
        triggerMode: config.triggerMode,
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

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to save configuration')
      }

      toast({
        title: '保存成功',
        description: '仓库翻译配置已更新',
        variant: 'success',
      })

      if (apiKey) {
        setApiKey('')
      }

      await fetchConfig()
    } catch (saveError) {
      console.error('Error saving config:', saveError)
      toast({
        title: '保存失败',
        description: saveError instanceof Error ? saveError.message : 'Failed to save configuration',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      setTogglingActive(true)

      const endpoint = repository?.isActive ? 'disable' : 'enable'
      const response = await fetch(`/api/repositories/${repositoryId}/${endpoint}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || data.message || `Failed to ${endpoint} repository`)
      }

      setRepository((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null))

      toast({
        title: repository?.isActive ? '仓库已禁用' : '仓库已启用',
        description: repository?.isActive ? '翻译功能已关闭' : '现在可以开始翻译了',
        variant: 'success',
      })
    } catch (toggleError) {
      console.error('Error toggling repository:', toggleError)
      toast({
        title: '操作失败',
        description: toggleError instanceof Error ? toggleError.message : 'Failed to toggle repository',
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

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to trigger translation')
      }

      toast({
        title: '翻译任务已创建',
        description: `任务 ID: ${data.taskId}`,
        variant: 'success',
        action: {
          label: '查看进度',
          onClick: () => router.push('/tasks'),
        },
      })
    } catch (translateError) {
      console.error('Error triggering translation:', translateError)
      toast({
        title: '翻译启动失败',
        description: translateError instanceof Error ? translateError.message : 'Failed to trigger translation',
        variant: 'error',
      })
    } finally {
      setTranslating(false)
    }
  }

  const updateFilePattern = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      filePatterns: prev.filePatterns.map((pattern, patternIndex) => (patternIndex === index ? value : pattern)),
    }))
  }

  const updateExcludePattern = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      excludePatterns: prev.excludePatterns.map((pattern, patternIndex) => (patternIndex === index ? value : pattern)),
    }))
  }

  if (loading) {
    return (
      <ClientAppLayout user={initialUser}>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">正在加载配置...</p>
          </div>
        </div>
      </ClientAppLayout>
    )
  }

  return (
    <ClientAppLayout user={initialUser}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/repositories" className="transition-colors hover:text-primary">
          仓库
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/repositories/${repositoryId}/config`} className="transition-colors hover:text-primary">
          {repository?.name || 'Repository'}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">配置</span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{repository?.name || 'Repository'} 翻译配置</h1>
          <p className="max-w-2xl text-muted-foreground">
            先选语言和要翻译的内容，再决定是自动运行还是手动启动。默认配置已经尽量适合开箱即用。
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">推荐默认：自动识别源语言</span>
            <span className="rounded-full bg-muted px-3 py-1">常见文档范围</span>
            <span className="rounded-full bg-muted px-3 py-1">支持手动选文件</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {repository?.isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              已启用
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              未启用
            </span>
          )}

          <button
            type="button"
            onClick={handleTranslateNow}
            disabled={translating || !repository?.isActive}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            立即翻译
          </button>

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={togglingActive}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {togglingActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : repository?.isActive ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            {repository?.isActive ? '禁用翻译' : '启用翻译'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="text-lg font-semibold">1. 语言设置</h2>
            <p className="mt-1 text-sm text-muted-foreground">默认推荐自动识别源语言，再从全球语言中选择目标语言。</p>
          </div>
          <div className="space-y-6 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">基准语言</label>
              <select
                value={config.baseLanguage}
                onChange={(event) => {
                  const nextBaseLanguage = event.target.value
                  setConfig((prev) => ({
                    ...prev,
                    baseLanguage: nextBaseLanguage,
                    targetLanguages: sanitizeTargetLanguages(nextBaseLanguage, prev.targetLanguages),
                  }))
                }}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                {baseLanguageOptions.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeName} ({language.code})
                  </option>
                ))}
              </select>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                如果仓库文档语言不固定，保持“自动识别”会更稳妥。
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">目标语言</label>
              <LanguageMultiSelect
                selectedCodes={config.targetLanguages}
                excludedCodes={config.baseLanguage === 'auto' ? [] : [config.baseLanguage]}
                onChange={(targetLanguages) =>
                  setConfig((prev) => ({
                    ...prev,
                    targetLanguages: sanitizeTargetLanguages(prev.baseLanguage, targetLanguages),
                  }))
                }
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="text-lg font-semibold">2. 翻译内容</h2>
            <p className="mt-1 text-sm text-muted-foreground">先从推荐范围开始，如果需要更精细的控制，再切到手动选文件。</p>
          </div>
          <div className="space-y-5 p-6">
            {config.scopeMode === 'advanced_rules' && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
                当前正在使用高级规则模式。只有你在高级设置里配置的文件规则会生效。
              </div>
            )}

            <ContentScopePicker
              value={config.scopeMode}
              onChange={(scopeMode) =>
                setConfig((prev) => ({
                  ...prev,
                  scopeMode,
                }))
              }
            />

            <RepositoryFilePicker
              repositoryId={repositoryId}
              enabled={config.scopeMode === 'manual_selection'}
              selectedFiles={config.selectedFiles}
              onChange={(selectedFiles) =>
                setConfig((prev) => ({
                  ...prev,
                  selectedFiles,
                }))
              }
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="text-lg font-semibold">3. 运行方式</h2>
            <p className="mt-1 text-sm text-muted-foreground">这里只有一个问题：是自动跑，还是你手动点按钮时再跑。</p>
          </div>
          <div className="space-y-3 p-6">
            {RUN_MODES.map((mode) => {
              const selected = config.triggerMode === mode.value

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, triggerMode: mode.value }))}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border ${selected ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-sm text-muted-foreground">{mode.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="text-lg font-semibold">4. 翻译引擎</h2>
            <p className="mt-1 text-sm text-muted-foreground">默认只保留必要项，更多调优参数放到高级设置里。</p>
          </div>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">引擎类型</label>
              <select
                value={engine.engineType}
                onChange={(event) =>
                  setEngine((prev) => ({
                    ...prev,
                    engineType: event.target.value,
                    config: {
                      ...prev.config,
                      model: event.target.value === 'openai' ? OPENAI_MODELS[0] : 'openai/gpt-4o-mini',
                    },
                  }))
                }
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="openrouter">OpenRouter（推荐）</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key {engine.hasApiKey ? '（已配置）' : ''}</label>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={engine.hasApiKey ? '留空以继续使用当前 API Key' : '输入 API Key'}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                {engine.engineType === 'openrouter' ? '支持后续灵活切换更多模型。' : '适合已经有 OpenAI Key 的团队直接接入。'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">模型</label>
                {engine.engineType === 'openrouter' && (
                  <button
                    type="button"
                    onClick={() => void fetchOpenRouterModels()}
                    disabled={modelsLoading}
                    className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${modelsLoading ? 'animate-spin' : ''}`} />
                    刷新模型列表
                  </button>
                )}
              </div>

              {engine.engineType === 'openrouter' ? (
                <>
                  <select
                    value={showCustomModelInput ? '__custom__' : engine.config.model}
                    onChange={(event) => {
                      if (event.target.value === '__custom__') {
                        setShowCustomModelInput(true)
                        setEngine((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            model: '',
                          },
                        }))
                        return
                      }

                      setShowCustomModelInput(false)
                      setEngine((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          model: event.target.value,
                        },
                      }))
                    }}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                  >
                    {availableOpenRouterModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                    <option value="__custom__">自定义模型 ID…</option>
                  </select>

                  {showCustomModelInput && (
                    <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
                      <label className="text-sm font-medium">自定义模型 ID</label>
                      <input
                        value={engine.config.model}
                        onChange={(event) =>
                          setEngine((prev) => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              model: event.target.value,
                            },
                          }))
                        }
                        placeholder="例如：deepseek/deepseek-v3"
                        className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                      />
                      <p className="text-xs text-muted-foreground">选择“自定义模型 ID”后，直接在这里填写完整模型标识。</p>
                    </div>
                  )}
                </>
              ) : (
                <select
                  value={engine.config.model}
                  onChange={(event) =>
                    setEngine((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        model: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                >
                  {OPENAI_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/30 px-6 py-4">
            <button
              type="button"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 text-left"
            >
              <Settings className="h-4 w-4" />
              <span className="text-lg font-semibold">高级设置</span>
            </button>
            <p className="mt-1 text-sm text-muted-foreground">只有需要精细控制时再展开，包括高级文件规则、自定义模型和 temperature。</p>
          </div>
          {advancedOpen && (
            <div className="space-y-6 p-6">
              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">高级文件规则</div>
                    <div className="text-sm text-muted-foreground">适合已经熟悉 glob 规则的高级用户。开启后，内容范围将完全以规则为准。</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        scopeMode: prev.scopeMode === 'advanced_rules' ? DEFAULT_SCOPE_MODE : 'advanced_rules',
                        filePatterns:
                          prev.scopeMode === 'advanced_rules' && prev.filePatterns.length === 0
                            ? resolveFilePatterns(DEFAULT_SCOPE_MODE, [])
                            : prev.filePatterns,
                      }))
                    }
                    className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                      config.scopeMode === 'advanced_rules'
                        ? 'bg-primary text-primary-foreground'
                        : 'border bg-background text-foreground'
                    }`}
                  >
                    {config.scopeMode === 'advanced_rules' ? '已启用' : '启用'}
                  </button>
                </div>

                {config.scopeMode === 'advanced_rules' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">包含规则</label>
                      <div className="space-y-2">
                        {config.filePatterns.map((pattern, index) => (
                          <div key={`${pattern}-${index}`} className="flex gap-2">
                            <input
                              value={pattern}
                              onChange={(event) => updateFilePattern(index, event.target.value)}
                              placeholder="例如：**/*.md"
                              className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  filePatterns: prev.filePatterns.filter((_, patternIndex) => patternIndex !== index),
                                }))
                              }
                              disabled={config.filePatterns.length === 1}
                              className="rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              删除
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              filePatterns: [...prev.filePatterns, ''],
                            }))
                          }
                          className="text-sm text-primary transition-colors hover:underline"
                        >
                          添加包含规则
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">排除规则（可选）</label>
                      <div className="space-y-2">
                        {config.excludePatterns.map((pattern, index) => (
                          <div key={`${pattern}-${index}`} className="flex gap-2">
                            <input
                              value={pattern}
                              onChange={(event) => updateExcludePattern(index, event.target.value)}
                              placeholder="例如：docs/internal/**"
                              className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  excludePatterns: prev.excludePatterns.filter((_, patternIndex) => patternIndex !== index),
                                }))
                              }
                              className="rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-muted"
                            >
                              删除
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              excludePatterns: [...prev.excludePatterns, ''],
                            }))
                          }
                          className="text-sm text-primary transition-colors hover:underline"
                        >
                          添加排除规则
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <div>
                  <div className="font-medium">模型高级设置</div>
                  <div className="text-sm text-muted-foreground">需要时进一步调整翻译稳定性，例如 temperature。</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature：{engine.config.temperature ?? 0.3}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={engine.config.temperature ?? 0.3}
                    onChange={(event) =>
                      setEngine((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          temperature: Number(event.target.value),
                        },
                      }))
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">值越低，翻译通常越稳定、一致。</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/repositories" className="rounded-lg border px-5 py-2.5 text-sm transition-colors hover:bg-muted">
            返回仓库
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            保存配置
          </button>
        </div>
      </div>
    </ClientAppLayout>
  )
}





