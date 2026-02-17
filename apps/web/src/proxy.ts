import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createCORSHeaders } from "@/lib/cors";
import { getRoleFromMetadata, isTeacherOrHigher } from "@/lib/auth/role-utils";

/**
 * SECURITY NOTE: API routes (/api/*) are NOT covered by this proxy middleware.
 * Every API route MUST call getCurrentUser() or equivalent auth verification
 * (verifyAdminAuth, verifyTeacherAuth, verifyStudentAuth) before processing requests.
 * This is by design — API routes handle their own auth to support different
 * authentication patterns (session, API key, public endpoints).
 */

/**
 * Creates a Supabase client configured for proxy
 * Centralizes cookie handling for both server actions and regular routes
 * Eliminates duplicate client initialization code
 */
function createProxySupabaseClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
}

export async function proxy(request: NextRequest) {
  // Handle CORS preflight for API routes
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    const corsHeaders = createCORSHeaders(origin);
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Generate a unique request correlation ID for distributed tracing
  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set correlation ID on response for client-side debugging
  response.headers.set("x-request-id", requestId);

  // Add CORS headers to all responses
  const origin = request.headers.get("origin");
  const corsHeaders = createCORSHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip proxy logic for server actions (they have their own auth checks)
  // Server actions are POST requests with specific content types
  const isServerAction =
    request.method === "POST" &&
    (request.headers
      .get("content-type")
      ?.includes("application/x-www-form-urlencoded") ||
      request.headers.get("next-action") !== null);

  // Create Supabase client (handles both server actions and regular routes)
  const supabase = createProxySupabaseClient(request, response);

  if (isServerAction) {
    // Still need to refresh auth token for server actions
    await supabase.auth.getUser();
    return response;
  }

  // CRITICAL: This refreshes the auth token and sets cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define route types clearly
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith("/app");
  const isAdminLoginRoute = pathname.startsWith("/admin/login");
  const isStudentAuthRoute = pathname.startsWith("/student/start");
  const isTeacherAuthRoute = pathname.startsWith("/teacher/start");
  const isJoinRoute = pathname.startsWith("/join");
  const isAuthPage = isStudentAuthRoute || isTeacherAuthRoute;

  // Route access control logic (simplified for clarity)
  if (isAdminLoginRoute) {
    // Admin login page is accessible without authentication
    return response;
  }

  if (isProtectedRoute && !user) {
    // Protected app routes require authentication
    return NextResponse.redirect(new URL("/student/start", request.url));
  }

  if (isAuthPage && user && !isJoinRoute) {
    // Auth pages (login/register) should redirect to dashboard if already authenticated
    // Exception: join routes handle their own logic
    // CRITICAL: No multi-role accounts - redirect based on existing role
    const userRole = getRoleFromMetadata(user.app_metadata);

    // Teacher auth route handling
    if (isTeacherAuthRoute) {
      // If user is already a teacher, redirect to teacher dashboard
      if (isTeacherOrHigher(userRole)) {
        return NextResponse.redirect(
          new URL("/app/teacher/dashboard", request.url),
        );
      }
      // If user is a student, redirect to student dashboard
      // We don't allow students to register as teachers with same account
      if (userRole === "student") {
        return NextResponse.redirect(new URL("/app/dashboard", request.url));
      }
      // If no role yet (anonymous or incomplete registration), allow to stay
      return response;
    }

    // Student auth route handling
    if (isStudentAuthRoute) {
      // If user is a teacher, redirect to teacher dashboard
      // We don't allow teachers to register as students with same account
      if (isTeacherOrHigher(userRole)) {
        return NextResponse.redirect(
          new URL("/app/teacher/dashboard", request.url),
        );
      }
      // If user is a student, redirect to student dashboard
      if (userRole === "student") {
        return NextResponse.redirect(new URL("/app/dashboard", request.url));
      }
      // If no role yet (anonymous or incomplete registration), allow to stay
      return response;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/app/:path*",
    "/admin/login",
    "/student/start",
    "/teacher/start",
    "/teacher/:path*",
    "/join",
  ],
};
