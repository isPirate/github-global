import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

export interface SessionUser {
  id: string
  githubId: string
  username: string
  email: string | null
  avatarUrl: string | null
}

export interface Session {
  user: SessionUser
  expires: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) {
    return null
  }

  try {
    // 解析 session（简化版本，生产环境应使用 JWT）
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    )

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
    })

    if (!user) {
      return null
    }

    return sessionData
  } catch {
    return null
  }
}

export async function createSession(user: SessionUser): Promise<void> {
  const session: Session = {
    user,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: 'session',
    value: Buffer.from(JSON.stringify(session)).toString('base64'),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(session.expires),
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session.user
}
