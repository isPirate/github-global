import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/repositories/[id]/config - Get translation configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repositoryId = params.id

    console.log('[Config API] Fetching config for repository:', repositoryId)

    // Find the repository
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
      include: {
        config: true,
        engines: true,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Get translation engines (without exposing the full API key)
    const engines = repository.engines.map((engine) => ({
      id: engine.id,
      engineType: engine.engineType,
      config: engine.config,
      isActive: engine.isActive,
      hasApiKey: !!engine.encryptedApiKey,
    }))

    return NextResponse.json({
      config: repository.config,
      engines,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repositoryId = params.id
    const body = await request.json()

    // Validate the repository exists and belongs to the user
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Validate required fields
    const {
      baseLanguage,
      targetLanguages,
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

    if (!filePatterns || !Array.isArray(filePatterns) || filePatterns.length === 0) {
      return NextResponse.json(
        { error: 'filePatterns is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate engine configuration
    if (!engine) {
      return NextResponse.json(
        { error: 'Translation engine configuration is required' },
        { status: 400 }
      )
    }

    // For new engines (no id), apiKey is required
    // For existing engines, apiKey is optional (will keep existing if not provided)
    if (!engine.id && !engine.apiKey) {
      return NextResponse.json(
        { error: 'API Key is required for new translation engine' },
        { status: 400 }
      )
    }

    // Upsert translation config
    const config = await prisma.translationConfig.upsert({
      where: { repositoryId },
      create: {
        repositoryId,
        baseLanguage: baseLanguage || 'auto',
        targetLanguages,
        filePatterns,
        excludePatterns: excludePatterns || [],
        targetBranchTemplate: targetBranchTemplate || 'i18n/{lang}',
        commitMessageTemplate: commitMessageTemplate || 'docs: translate to {lang}',
        syncStrategy: syncStrategy || 'full',
        triggerMode: triggerMode || 'webhook',
      },
      update: {
        baseLanguage: baseLanguage || 'auto',
        targetLanguages,
        filePatterns,
        excludePatterns: excludePatterns || [],
        targetBranchTemplate: targetBranchTemplate || 'i18n/{lang}',
        commitMessageTemplate: commitMessageTemplate || 'docs: translate to {lang}',
        syncStrategy: syncStrategy || 'full',
        triggerMode: triggerMode || 'webhook',
      },
    })

    // Upsert translation engine (store API key encrypted - in production, use proper encryption)
    let translationEngine

    if (engine.id) {
      // Update existing engine
      translationEngine = await prisma.translationEngine.update({
        where: { id: engine.id },
        data: {
          // Only update API key if provided
          ...(engine.apiKey && { encryptedApiKey: engine.apiKey }),
          config: engine.config || { model: 'openai/gpt-4-turbo', temperature: 0.3 },
          isActive: engine.isActive !== undefined ? engine.isActive : true,
        },
      })
    } else {
      // Create new engine (apiKey is required here, validated above)
      translationEngine = await prisma.translationEngine.create({
        data: {
          repositoryId,
          engineType: engine.engineType || 'openrouter',
          encryptedApiKey: engine.apiKey!, // Non-null assertion is safe here due to validation
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
        hasApiKey: true,
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
