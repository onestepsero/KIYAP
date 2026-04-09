import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from './lib/auth'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/schools']

const ROLE_PATHS: Record<string, string[]> = {
  STUDENT: ['/student'],
  PARENT: ['/parent'],
  TEACHER: ['/teacher'],
  ADMIN: ['/admin'],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (pathname === '/') return NextResponse.redirect(new URL('/login', req.url))

  const user = await getAuthUserFromRequest(req)
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  for (const [role, paths] of Object.entries(ROLE_PATHS)) {
    if (paths.some((p) => pathname.startsWith(p))) {
      if (user.role !== role && user.role !== 'ADMIN') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }
        const redirect = `/${user.role.toLowerCase()}`
        return NextResponse.redirect(new URL(redirect, req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)'],
}
