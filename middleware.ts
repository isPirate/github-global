import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'

// 定义公开路由
const publicRoutes = ['/', '/login', '/api/auth/signin', '/api/auth/callback']
const protectedRoutes = ['/dashboard']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route))
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // 如果是公开路由，直接放行
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // 如果是受保护路由，检查用户是否已登录
  if (isProtectedRoute) {
    const session = await getSession()

    if (!session) {
      // 未登录，重定向到登录页
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)'],
}
