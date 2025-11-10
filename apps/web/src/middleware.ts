import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get session from cookies
  const sessionCookie = request.cookies.get('sb-access-token')

  // Check if accessing protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/app')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/verify')

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If already authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/login', '/verify'],
}
