import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import TasksClientPage from './tasks-client-page'

export default async function TasksPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/signin')
  }

  return (
    <TasksClientPage
      initialUser={{
        username: session.user.username,
        avatarUrl: session.user.avatarUrl,
      }}
    />
  )
}
