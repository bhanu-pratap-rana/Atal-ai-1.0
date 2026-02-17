import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { authLogger } from "./auth-logger";
import { verifyRoleAuth, verifyProfileAuth, type AuthCheckResult } from "./auth-factory";

/**
 * Validate that required environment variables are set
 * Checks public variables at load time, service role at function call time
 */
function validatePublicVariables() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `See .env.example for setup instructions.`,
    );
  }
}

// Validate public variables on module load
validatePublicVariables();

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions. Log for debugging cookie sync issues.
            authLogger.debug(
              "[createClient] Cookie setAll called from Server Component",
              { error: error instanceof Error ? error.message : String(error) },
            );
          }
        },
      },
    },
  );
}

/**
 * Get current authenticated user with per-request deduplication
 * Uses React.cache() to prevent duplicate auth queries within same request
 * Per Vercel React Best Practices: https://vercel.com/blog/introducing-react-best-practices
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});

/**
 * Create an admin client for server-side operations
 * Uses service role key for elevated permissions
 * WARNING: Only use in server actions - never expose to client
 *
 * Note: Uses @supabase/supabase-js directly (not SSR) to properly bypass RLS
 * The SSR client with cookies doesn't reliably bypass RLS even with service role
 */
/**
 * Verify that the current user has admin or super_admin role
 * Used by admin server actions for authorization
 *
 * @param functionName - Name of the calling function for logging
 * @returns Discriminated union - authorized true with user, or authorized false with error
 */
export async function verifyAdminAuth(
  functionName: string,
): Promise<AuthCheckResult> {
  return verifyRoleAuth({
    functionName,
    requiredRoles: ["admin", "super_admin"],
    errorMessage: "Admin access required",
  });
}

/**
 * Verify that the current user has super_admin role
 * Used by admin server actions that only super_admin can perform
 *
 * @param functionName - Name of the calling function for logging
 * @returns Discriminated union - authorized true with user, or authorized false with error
 */
export async function verifySuperAdminAuth(
  functionName: string,
): Promise<AuthCheckResult> {
  return verifyRoleAuth({
    functionName,
    requiredRoles: ["super_admin"],
    errorMessage: "Only super admins can perform this action",
  });
}

/**
 * Verify that the current user is a teacher (has teacher_profiles entry)
 * Used by teacher server actions for authorization
 *
 * @param functionName - Name of the calling function for logging
 * @returns Discriminated union - authorized true with user, or authorized false with error
 */
export async function verifyTeacherAuth(
  functionName: string,
): Promise<AuthCheckResult> {
  return verifyProfileAuth({
    functionName,
    profileCheckFn: async (user) => {
      const supabase = await createClient();
      const { data: teacherProfile, error } = await supabase
        .from("teacher_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return teacherProfile !== null;
    },
    notFoundMessage: "Only teachers can perform this action",
    errorMessage: "Failed to verify teacher status",
  });
}

/**
 * Verify that the current user is a student (has student_profiles entry)
 * Used by student server actions for authorization
 *
 * @param functionName - Name of the calling function for logging
 * @returns Discriminated union - authorized true with user and profile, or authorized false with error
 */
export async function verifyStudentAuth(
  functionName: string,
): Promise<
  | {
      authorized: true;
      user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
      studentProfile: { user_id: string; name: string };
    }
  | { authorized: false; error: { success: false; error: string } }
> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    authLogger.warn(`[${functionName}] Unauthorized: No authenticated user`);
    return {
      authorized: false,
      error: { success: false, error: "Not authenticated" },
    };
  }

  const supabase = await createClient();

  // Verify user is a student (student_profiles uses user_id as primary key)
  const { data: studentProfile, error: profileError } = await supabase
    .from("student_profiles")
    .select("user_id, name")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (profileError) {
    authLogger.error(
      `[${functionName}] Failed to verify student status`,
      profileError,
    );
    return {
      authorized: false,
      error: { success: false, error: "Failed to verify student status" },
    };
  }

  if (!studentProfile) {
    authLogger.warn(`[${functionName}] Forbidden: User is not a student`, {
      userId: currentUser.id,
    });
    return {
      authorized: false,
      error: { success: false, error: "Only students can perform this action" },
    };
  }

  return { authorized: true, user: currentUser, studentProfile };
}

/**
 * Verify that the current user owns a specific class
 * Used by teacher server actions that require class ownership
 *
 * @param functionName - Name of the calling function for logging
 * @param classId - The class ID to verify ownership of
 * @returns Discriminated union - authorized true with user and classData, or authorized false with error
 */
export async function verifyClassOwnership(
  functionName: string,
  classId: string,
): Promise<
  | {
      authorized: true;
      user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
      classData: { id: string; teacher_id: string; name: string };
    }
  | { authorized: false; error: { success: false; error: string } }
> {
  // First verify teacher auth
  const teacherAuth = await verifyTeacherAuth(functionName);
  if (!teacherAuth.authorized) {
    return teacherAuth;
  }

  const supabase = await createClient();

  // Verify user owns this class
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, teacher_id, name")
    .eq("id", classId)
    .eq("teacher_id", teacherAuth.user.id)
    .maybeSingle();

  if (classError) {
    authLogger.error(
      `[${functionName}] Failed to verify class ownership`,
      classError,
    );
    return {
      authorized: false,
      error: { success: false, error: "Failed to verify class ownership" },
    };
  }

  if (!classData) {
    authLogger.warn(
      `[${functionName}] Forbidden: User does not own this class`,
      {
        userId: teacherAuth.user.id,
        classId,
      },
    );
    return {
      authorized: false,
      error: { success: false, error: "You do not own this class" },
    };
  }

  return { authorized: true, user: teacherAuth.user, classData };
}

export async function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
        "Admin operations require this key. See .env.example for setup instructions.",
    );
  }

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. " +
        "See .env.example for setup instructions.",
    );
  }

  // Use standard supabase-js client with service role key
  // This properly bypasses RLS policies for admin operations
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
