import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: This refreshes the auth token and sets cookies
  const { data: { user } } = await supabase.auth.getUser()

  // Check if accessing protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/app')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/verify')

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If already authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/app/:path*', '/login', '/verify'],
}
