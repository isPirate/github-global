import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import RepositoryConfigClientPage from './config-client-page'

export default async function RepositoryConfigPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/signin')
  }

  return (
    <RepositoryConfigClientPage
      initialUser={{
        username: session.user.username,
        avatarUrl: session.user.avatarUrl,
      }}
    />
  )
}
