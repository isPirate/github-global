import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getEncryptionService } from '@/lib/crypto/encryption'
import {
  DEFAULT_SCOPE_MODE,
  inferScopeMode,
  normalizeBaseLanguage,
  resolveExcludePatterns,
  resolveFilePatterns,
  sanitizeSelectedFiles,
  sanitizeTargetLanguages,
} from '@/lib/repository-config'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/repositories/[id]/config - Get translation configuration
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: repositoryId } = await context.params

    console.log('[Config API] Fetching config for repository:', repositoryId)

    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
      include: {
        config: true,
        engines: true,
        user: {
          include: {
            settings: true,
          },
        },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    const engines = repository.engines.map((engine) => ({
      id: engine.id,
      engineType: engine.engineType,
      config: engine.config,
      isActive: engine.isActive,
      hasApiKey: !!engine.encryptedApiKey,
    }))
    const hasUserOpenRouterKey = !!repository.user?.settings?.encryptedOpenRouterKey

    const normalizedConfig = repository.config
      ? (() => {
          const scopeMode = inferScopeMode(repository.config.scopeMode, repository.config.filePatterns)

          return {
            ...repository.config,
            baseLanguage: normalizeBaseLanguage(repository.config.baseLanguage),
            targetLanguages: sanitizeTargetLanguages(repository.config.baseLanguage, repository.config.targetLanguages),
            scopeMode,
            selectedFiles: sanitizeSelectedFiles(repository.config.selectedFiles),
            filePatterns: resolveFilePatterns(scopeMode, repository.config.filePatterns),
            excludePatterns: resolveExcludePatterns(scopeMode, repository.config.excludePatterns),
          }
        })()
      : {
          baseLanguage: 'auto',
          targetLanguages: sanitizeTargetLanguages('auto', repository.user?.settings?.defaultTargetLanguages),
          scopeMode: DEFAULT_SCOPE_MODE,
          selectedFiles: [],
          filePatterns: resolveFilePatterns(DEFAULT_SCOPE_MODE, []),
          excludePatterns: [],
          triggerMode: 'webhook',
        }

    return NextResponse.json({
      config: normalizedConfig,
      engines,
      userSettings: {
        hasOpenRouterKey: hasUserOpenRouterKey,
      },
      repository: {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        isActive: repository.isActive,
      },
    })
  } catch (error) {
    console.error('[API] Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration', message: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/repositories/[id]/config - Save or update translation configuration
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: repositoryId } = await context.params
    const body = await request.json()

    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
      include: {
        user: {
          include: {
            settings: true,
          },
        },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    const {
      baseLanguage,
      targetLanguages,
      scopeMode,
      selectedFiles,
      filePatterns,
      excludePatterns,
      targetBranchTemplate,
      commitMessageTemplate,
      syncStrategy,
      triggerMode,
      engine,
    } = body

    if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      return NextResponse.json(
        { error: 'targetLanguages is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    const normalizedBaseLanguage = normalizeBaseLanguage(baseLanguage)
    const sanitizedTargetLanguages = sanitizeTargetLanguages(normalizedBaseLanguage, targetLanguages)
    const normalizedScopeMode = inferScopeMode(scopeMode, filePatterns)
    const normalizedSelectedFiles = sanitizeSelectedFiles(selectedFiles)
    const normalizedFilePatterns = resolveFilePatterns(normalizedScopeMode, filePatterns)
    const normalizedExcludePatterns = resolveExcludePatterns(normalizedScopeMode, excludePatterns)

    if (sanitizedTargetLanguages.length === 0) {
      return NextResponse.json(
        { error: 'targetLanguages must contain at least one language different from baseLanguage' },
        { status: 400 }
      )
    }

    if (normalizedScopeMode === 'manual_selection' && normalizedSelectedFiles.length === 0) {
      return NextResponse.json(
        { error: 'selectedFiles is required when scopeMode is manual_selection' },
        { status: 400 }
      )
    }

    if (normalizedScopeMode === 'advanced_rules' && normalizedFilePatterns.length === 0) {
      return NextResponse.json(
        { error: 'filePatterns is required and must be a non-empty array when using advanced_rules' },
        { status: 400 }
      )
    }

    if (!engine) {
      return NextResponse.json(
        { error: 'Translation engine configuration is required' },
        { status: 400 }
      )
    }

    const hasUserOpenRouterKey = !!repository.user?.settings?.encryptedOpenRouterKey

    if (!engine.id && !engine.apiKey && !hasUserOpenRouterKey) {
      return NextResponse.json(
        { error: 'API Key is required for new translation engine unless a global OpenRouter API key is configured in Settings' },
        { status: 400 }
      )
    }

    const config = await prisma.translationConfig.upsert({
      where: { repositoryId },
      create: {
        repositoryId,
        baseLanguage: normalizedBaseLanguage,
        targetLanguages: sanitizedTargetLanguages,
        scopeMode: normalizedScopeMode,
        selectedFiles: normalizedSelectedFiles,
        filePatterns: normalizedFilePatterns,
        excludePatterns: normalizedExcludePatterns,
        targetBranchTemplate: targetBranchTemplate || 'i18n/{lang}',
        commitMessageTemplate: commitMessageTemplate || 'docs: translate to {lang}',
        syncStrategy: syncStrategy || 'full',
        triggerMode: triggerMode || 'webhook',
      },
      update: {
        baseLanguage: normalizedBaseLanguage,
        targetLanguages: sanitizedTargetLanguages,
        scopeMode: normalizedScopeMode,
        selectedFiles: normalizedSelectedFiles,
        filePatterns: normalizedFilePatterns,
        excludePatterns: normalizedExcludePatterns,
        targetBranchTemplate: targetBranchTemplate || 'i18n/{lang}',
        commitMessageTemplate: commitMessageTemplate || 'docs: translate to {lang}',
        syncStrategy: syncStrategy || 'full',
        triggerMode: triggerMode || 'webhook',
      },
    })

    const encryptionService = getEncryptionService()

    let translationEngine

    if (engine.id) {
      translationEngine = await prisma.translationEngine.update({
        where: { id: engine.id },
        data: {
          ...(engine.apiKey && { encryptedApiKey: encryptionService.encrypt(engine.apiKey) }),
          config: engine.config || { model: 'openai/gpt-4-turbo', temperature: 0.3 },
          isActive: engine.isActive !== undefined ? engine.isActive : true,
        },
      })
    } else {
      translationEngine = await prisma.translationEngine.create({
        data: {
          repositoryId,
          engineType: engine.engineType || 'openrouter',
          encryptedApiKey: engine.apiKey ? encryptionService.encrypt(engine.apiKey) : '',
          config: engine.config || { model: 'openai/gpt-4-turbo', temperature: 0.3 },
          isActive: engine.isActive !== undefined ? engine.isActive : true,
        },
      })
    }

    return NextResponse.json({
      config,
      engine: {
        id: translationEngine.id,
        engineType: translationEngine.engineType,
        config: translationEngine.config,
        isActive: translationEngine.isActive,
        hasApiKey: !!translationEngine.encryptedApiKey,
      },
    })
  } catch (error) {
    console.error('[API] Error saving config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration', message: String(error) },
      { status: 500 }
    )
  }
}
