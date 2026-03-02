import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import AppLayout from '@/components/app-layout'
import SettingsForm from './_components/settings-form'

export default async function SettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch or create user settings
  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  })

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: session.user.id },
    })
  }

  // Fetch installations
  const installations = await prisma.gitHubAppInstallation.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      installationId: true,
      accountLogin: true,
      accountType: true,
      repositorySelection: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const initialSettings = {
    defaultTargetLanguages: settings.defaultTargetLanguages as string[],
    autoCreatePr: settings.autoCreatePr,
    saveTranslationHistory: settings.saveTranslationHistory,
    emailNotifications: settings.emailNotifications,
    hasOpenRouterKey: !!settings.encryptedOpenRouterKey,
  }

  const formattedInstallations = installations.map((inst) => ({
    id: inst.id,
    installationId: inst.installationId.toString(),
    accountLogin: inst.accountLogin,
    accountType: inst.accountType,
    repositorySelection: inst.repositorySelection,
    createdAt: inst.createdAt.toISOString(),
  }))

  return (
    <AppLayout user={{ username: session.user.username, avatarUrl: session.user.avatarUrl }}>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">设置</h1>
          <p className="text-muted-foreground mt-2">
            配置您的账户和偏好设置
          </p>
        </div>

        <SettingsForm
          initialSettings={initialSettings}
          user={{
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
            avatarUrl: session.user.avatarUrl,
          }}
          installations={formattedInstallations}
        />
      </div>
    </AppLayout>
  )
}
