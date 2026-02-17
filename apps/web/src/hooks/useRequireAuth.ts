"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

/**
 * Hook to require authentication for a component
 * Redirects to login if user is not authenticated
 *
 * @param redirectTo - URL to redirect to if not authenticated (default: '/student/start')
 * @returns { user, loading } - Current user and loading state
 *
 * @example
 * ```tsx
 * export default function ProtectedPage() {
 *   const { user, loading } = useRequireAuth();
 *
 *   if (loading) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return <div>Welcome, {user.email}!</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo: string = "/student/start") {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push(redirectTo);
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, [router, redirectTo]);

  return { user, loading };
}
