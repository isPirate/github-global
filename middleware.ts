import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'

const publicRoutes = new Set(['/', '/api/auth/signin', '/api/auth/callback'])
const protectedRoutes = ['/dashboard', '/repositories', '/tasks', '/settings']

export async function middleware(request: NextRequest) {
  if (request.nextUrl.hostname === '127.0.0.1') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.hostname = 'localhost'
    return NextResponse.redirect(redirectUrl)
  }

  const path = request.nextUrl.pathname

  const isPublicRoute = publicRoutes.has(path)
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  if (isProtectedRoute) {
    const session = await getSession()

    if (!session) {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)'],
}
