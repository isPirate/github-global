import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import AppLayout from '@/components/app-layout'
import { PageShell } from '@/components/layout/page-shell'
import SettingsForm from './_components/settings-form'
import SettingsPageHeader from './_components/settings-page-header'

export default async function SettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/signin')
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
      <PageShell spacing="comfortable">
        <SettingsPageHeader />
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
      </PageShell>
    </AppLayout>
  )
}
