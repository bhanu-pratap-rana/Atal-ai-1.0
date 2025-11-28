import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
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
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin/login')
  const isStudentAuth = request.nextUrl.pathname.startsWith('/student/start')
  const isTeacherAuth = request.nextUrl.pathname.startsWith('/teacher/start')
  const isJoinRoute = request.nextUrl.pathname.startsWith('/join')
  const isAuthRoute = isStudentAuth || isTeacherAuth

  // If accessing admin login without session, allow (don't redirect)
  if (isAdminRoute && !user) {
    return response
  }

  // If accessing protected route without session, redirect to student start
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/student/start', request.url))
  }

  // If already authenticated and trying to access auth pages, redirect to dashboard
  // BUT allow teacher onboarding and join pages (they handle their own logic)
  if (isAuthRoute && user && !isTeacherAuth && !isJoinRoute) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/app/:path*', '/admin/login', '/student/start', '/teacher/start', '/teacher/:path*', '/join'],
}
