import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import RepositoriesClientPage from './repositories-client-page'

export default async function RepositoriesPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/signin')
  }

  return (
    <RepositoriesClientPage
      initialUser={{
        username: session.user.username,
        avatarUrl: session.user.avatarUrl,
      }}
    />
  )
}
