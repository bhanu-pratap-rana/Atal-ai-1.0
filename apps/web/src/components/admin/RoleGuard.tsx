"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  isAdmin,
  isSuperAdmin,
  isTeacherOrHigher,
} from "@/lib/auth/role-utils";
import type { AdminRole } from "@/types/auth";
import { clientLogger } from "@/lib/client-logger";

interface RoleGuardProps {
  readonly children: ReactNode;
  readonly requiredRole: "super_admin" | "admin" | "teacher";
  readonly fallback?: ReactNode;
}

/**
 * RoleGuard component - Protects pages/features based on user role
 * Checks authentication and authorization before rendering children
 * Uses Supabase client directly to read app_metadata.role from the current user
 */
export function RoleGuard({
  children,
  requiredRole,
  fallback,
}: RoleGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const supabase = createClient();

        // Get current session from Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          clientLogger.debug("[RoleGuard] No session, redirecting to login");
          router.push("/admin/login");
          return;
        }

        // Get role from app_metadata (set by admin user creation)
        const role = (session.user.app_metadata?.role as AdminRole) || "user";

        clientLogger.debug("[RoleGuard] User role check", {
          email: session.user.email,
          role,
          requiredRole,
        });

        // Verify required role using role hierarchy: student < teacher < admin < super_admin
        let isAuthorizedForRole = false;

        if (requiredRole === "super_admin") {
          // Only super_admin can access
          isAuthorizedForRole = isSuperAdmin(role);
        } else if (requiredRole === "admin") {
          // admin or super_admin can access
          isAuthorizedForRole = isAdmin(role);
        } else if (requiredRole === "teacher") {
          // teacher, admin, or super_admin can access
          isAuthorizedForRole = isTeacherOrHigher(role);
        }

        setIsAuthorized(isAuthorizedForRole);
      } catch (error) {
        clientLogger.error(
          "[RoleGuard] Authorization check failed",
          error instanceof Error ? error : { error },
        );
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return fallback || <UnauthorizedFallback requiredRole={requiredRole} />;
  }

  return <>{children}</>;
}

/**
 * Default unauthorized fallback component
 */
function UnauthorizedFallback({ requiredRole }: Readonly<{ requiredRole: string }>) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-text mb-2">Access Denied</h1>
        <p className="text-text-secondary mb-6">
          You do not have permission to access this page. This area is
          restricted to {requiredRole} users only.
        </p>
        <button
          onClick={() => router.push("/admin/login")}
          className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
