import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getEncryptionService } from '@/lib/crypto/encryption'

// GET /api/user/settings - Get user settings
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })

    // If not exists, create default settings
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: session.user.id },
      })
    }

    return NextResponse.json({
      settings: {
        defaultTargetLanguages: settings.defaultTargetLanguages,
        autoCreatePr: settings.autoCreatePr,
        saveTranslationHistory: settings.saveTranslationHistory,
        emailNotifications: settings.emailNotifications,
        hasOpenRouterKey: !!settings.encryptedOpenRouterKey,
      },
    })
  } catch (error) {
    console.error('[API] Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/user/settings - Update user settings
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Prepare update data
    const updateData: {
      defaultTargetLanguages?: string[]
      autoCreatePr?: boolean
      saveTranslationHistory?: boolean
      emailNotifications?: boolean
      encryptedOpenRouterKey?: string | null
    } = {}

    if (body.defaultTargetLanguages !== undefined) {
      updateData.defaultTargetLanguages = body.defaultTargetLanguages
    }
    if (body.autoCreatePr !== undefined) {
      updateData.autoCreatePr = body.autoCreatePr
    }
    if (body.saveTranslationHistory !== undefined) {
      updateData.saveTranslationHistory = body.saveTranslationHistory
    }
    if (body.emailNotifications !== undefined) {
      updateData.emailNotifications = body.emailNotifications
    }

    // Handle API key with encryption
    if (body.openRouterKey !== undefined) {
      if (body.openRouterKey) {
        const encryptionService = getEncryptionService()
        updateData.encryptedOpenRouterKey = encryptionService.encrypt(body.openRouterKey)
      } else {
        updateData.encryptedOpenRouterKey = null
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...updateData,
      },
      update: updateData,
    })

    return NextResponse.json({
      success: true,
      settings: {
        defaultTargetLanguages: settings.defaultTargetLanguages,
        autoCreatePr: settings.autoCreatePr,
        saveTranslationHistory: settings.saveTranslationHistory,
        emailNotifications: settings.emailNotifications,
        hasOpenRouterKey: !!settings.encryptedOpenRouterKey,
      },
    })
  } catch (error) {
    console.error('[API] Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
