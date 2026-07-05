import { NextRequest, NextResponse } from 'next/server'

/** Routes that do NOT require authentication */
const PUBLIC_PATHS = ['/api/auth/login', '/login', '/_next', '/favicon.ico']

interface JWTPayload {
  userId: string
  email: string
  role: string
  exp?: number
}

function decodeJwt(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    
    const jsonPayload = atob(base64)
    const payload = JSON.parse(jsonPayload) as JWTPayload
    
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null
    }
    
    return payload
  } catch {
    return null
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Extract token
  const authHeader = req.headers.get('authorization')
  let token = null
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else {
    token = req.cookies.get('auth_token')?.value ?? null
  }

  const user = token ? decodeJwt(token) : null

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
