import ClientAppLayout from '@/components/client-app-layout'

interface AppLayoutProps {
  children: React.ReactNode
  user: {
    username: string
    avatarUrl?: string | null
  }
  processingTaskCount?: number
}

export default function AppLayout({ children, user, processingTaskCount = 0 }: AppLayoutProps) {
  return (
    <ClientAppLayout user={user} processingTaskCount={processingTaskCount}>
      {children}
    </ClientAppLayout>
  )
}
