import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { authLogger } from "@/lib/auth-logger";

/**
 * GET /api/check-auth-config
 * Returns auth configuration status - requires authentication
 *
 * SECURITY: This endpoint requires authentication to prevent
 * information disclosure to unauthenticated users.
 */
export async function GET() {
  try {
    // SECURITY: Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Rate limiting to prevent abuse
    const isAllowed = await checkRateLimit(
      `auth-config:${user.id}`,
      RATE_LIMITS.ipBased,
    );
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Check auth configuration via Supabase REST API
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch auth settings" },
        { status: 500 },
      );
    }

    const settings = await response.json();

    // Return only non-sensitive settings
    // Auth config rarely changes - cache for 24 hours
    return NextResponse.json({
      status: "success",
      settings: {
        external: settings.external,
        disable_signup: settings.disable_signup,
        autoconfirm: settings.autoconfirm,
        mailer_autoconfirm: settings.mailer_autoconfirm,
        phone_autoconfirm: settings.phone_autoconfirm,
        email_provider_configured:
          Boolean(settings.smtp_host) || Boolean(settings.mailer_provider),
      },
      // Don't expose supabaseUrl in response - already public in client config
      hasAnonKey: true,
    }, {
      headers: {
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    // Log detailed error server-side only; stack only in development
    authLogger.error("[checkAuthConfig] Error checking auth configuration", {
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
