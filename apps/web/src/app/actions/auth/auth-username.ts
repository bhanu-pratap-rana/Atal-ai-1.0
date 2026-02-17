"use server";

import { randomBytes } from "node:crypto";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import {
  checkOtpRateLimit,
  checkEnumerationRateLimit,
} from "@/lib/rate-limiter-distributed";
import { UsernameSchema, AuthPasswordSchema } from "@/lib/validation-schemas";
import { authLogger } from "@/lib/auth-logger";
import { validateWithSchema } from "./auth-common";

/**
 * Username-based authentication
 * Handles username/password signup and signin for students
 */

/**
 * Check if username is available
 */
export async function checkUsernameAvailable(username: string): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    // SECURITY FIX: Add rate limiting to prevent username enumeration attacks
    // Limit repeated checks of different usernames to prevent brute-force enumeration
    const enumerationAllowed = await checkEnumerationRateLimit(
      `username:check:${username.toLowerCase()}`,
    );
    if (!enumerationAllowed) {
      authLogger.warn(
        "[checkUsernameAvailable] Username enumeration rate limit exceeded",
        {
          username: username.slice(0, 3) + "*", // Log partial username for privacy
        },
      );
      return {
        available: false,
        error: "Too many username checks. Please try again later.",
      };
    }

    // Validate username format using Zod schema
    const usernameResult = validateWithSchema(username, UsernameSchema);
    if (!usernameResult.success) {
      return { available: false, error: usernameResult.error };
    }
    const validatedUsername = usernameResult.data;

    const adminClient = await createAdminClient();

    // Check if username exists in usernames table
    const { data, error } = await adminClient
      .from("usernames")
      .select("username")
      .ilike("username", validatedUsername)
      .maybeSingle();

    if (error) {
      authLogger.error(
        "[checkUsernameAvailable] Error checking username",
        error,
      );
      return {
        available: false,
        error: "Failed to check username availability",
      };
    }

    return { available: !data };
  } catch (error) {
    authLogger.error("[checkUsernameAvailable] Unexpected error", error);
    return { available: false, error: "An unexpected error occurred" };
  }
}

/**
 * Register a new student with username and password
 * Creates a Supabase user with an internal email and stores the username mapping
 */
export async function registerWithUsername(
  username: string,
  password: string,
): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
}> {
  try {
    // Validate username and password using Zod schemas
    const usernameResult = validateWithSchema(username, UsernameSchema);
    if (!usernameResult.success) return usernameResult;

    const passwordResult = validateWithSchema(password, AuthPasswordSchema);
    if (!passwordResult.success) return passwordResult;

    const trimmedUsername = usernameResult.data;

    // Rate limit check
    const registerAllowed = await checkOtpRateLimit(
      `username:${trimmedUsername}`,
    );
    if (!registerAllowed) {
      authLogger.warn("[registerWithUsername] Rate limit exceeded", {
        username: trimmedUsername,
      });
      return {
        success: false,
        error:
          "Too many registration attempts. Please wait before trying again.",
      };
    }

    const adminClient = await createAdminClient();

    // Check if username is already taken
    const { data: existingUsername } = await adminClient
      .from("usernames")
      .select("username")
      .ilike("username", trimmedUsername)
      .maybeSingle();

    if (existingUsername) {
      authLogger.debug("[registerWithUsername] Username already taken", {
        username: trimmedUsername,
      });
      return {
        success: false,
        error: "This username is already taken. Please choose another.",
      };
    }

    // Generate internal email for Supabase auth
    // Format: username_randomsuffix@student.atal.internal
    const randomSuffix = randomBytes(4).toString("hex");
    const internalEmail = `${trimmedUsername}_${randomSuffix}@student.atal.internal`;

    // Create user with admin API
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: internalEmail,
        password: password,
        email_confirm: true, // Auto-confirm since no real email
        user_metadata: {
          username: trimmedUsername,
          auth_type: "username",
        },
      });

    if (authError) {
      authLogger.error(
        "[registerWithUsername] Failed to create user",
        authError,
      );
      return {
        success: false,
        error: "Failed to create account. Please try again.",
      };
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create account" };
    }

    // SECURITY FIX #3: Atomic signup - ensure username AND profile creation succeed together
    // Store username mapping
    const { error: insertError } = await adminClient.from("usernames").insert({
      user_id: authData.user.id,
      username: trimmedUsername,
    });

    if (insertError) {
      // Rollback: delete the created user
      authLogger.error(
        "[registerWithUsername] Failed to store username, rolling back",
        insertError,
      );
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: "Failed to register username. Please try again.",
      };
    }

    // Create student profile atomically using UPSERT RPC
    // This prevents orphaned users if profile creation fails
    const { error: profileError } = await adminClient.rpc(
      "upsert_student_profile",
      {
        p_user_id: authData.user.id,
        p_name: trimmedUsername, // Use username as initial name
        p_gender: null,
        p_date_of_birth: null,
        p_phone: null,
        p_location: null,
        p_medium: null,
        p_board: null,
        p_class: null,
      },
    );

    if (profileError) {
      // Rollback: delete both username and auth user
      authLogger.error(
        "[registerWithUsername] Failed to create student profile, rolling back",
        profileError,
      );
      await adminClient
        .from("usernames")
        .delete()
        .eq("user_id", authData.user.id);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: "Failed to complete registration. Please try again.",
      };
    }

    authLogger.success(
      "[registerWithUsername] User registered successfully with profile",
      {
        userId: authData.user.id,
        username: trimmedUsername,
      },
    );

    return { success: true, userId: authData.user.id };
  } catch (error) {
    authLogger.error("[registerWithUsername] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Sign in with username and password
 * Looks up the internal email from username and authenticates
 */
export async function signInWithUsername(
  username: string,
  password: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate inputs - username is required, password is required but we don't validate format on login
    const usernameResult = validateWithSchema(username, UsernameSchema);
    if (!usernameResult.success) {
      // For login, return generic error to avoid leaking username format requirements
      return { success: false, error: "Invalid username or password" };
    }
    const trimmedUsername = usernameResult.data;

    if (!password) {
      return { success: false, error: "Password is required" };
    }

    // Rate limit check
    const signinAllowed = await checkOtpRateLimit(`signin:${trimmedUsername}`);
    if (!signinAllowed) {
      authLogger.warn("[signInWithUsername] Rate limit exceeded", {
        username: trimmedUsername,
      });
      return {
        success: false,
        error: "Too many login attempts. Please wait before trying again.",
      };
    }

    const adminClient = await createAdminClient();

    // Look up username to get user_id
    const { data: usernameData, error: lookupError } = await adminClient
      .from("usernames")
      .select("user_id")
      .ilike("username", trimmedUsername)
      .maybeSingle();

    if (lookupError) {
      authLogger.error(
        "[signInWithUsername] Error looking up username",
        lookupError,
      );
      return { success: false, error: "Login failed. Please try again." };
    }

    if (!usernameData) {
      authLogger.debug("[signInWithUsername] Username not found", {
        username: trimmedUsername,
      });
      return { success: false, error: "Invalid username or password" };
    }

    // Get the user's email from auth.users
    const { data: userData, error: userError } =
      await adminClient.auth.admin.getUserById(usernameData.user_id);

    if (userError || !userData.user?.email) {
      authLogger.error("[signInWithUsername] Error getting user", userError);
      return { success: false, error: "Login failed. Please try again." };
    }

    // Now sign in with the internal email and password using regular client
    const supabase = await createClient();
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: password,
      });

    if (signInError) {
      authLogger.debug("[signInWithUsername] Invalid password", {
        username: trimmedUsername,
      });
      return { success: false, error: "Invalid username or password" };
    }

    if (!signInData.user) {
      return { success: false, error: "Login failed" };
    }

    // Check if this is a teacher/admin account (shouldn't be possible with username auth, but check anyway)
    const appRole = signInData.user.app_metadata?.role;
    if (
      appRole === "teacher" ||
      appRole === "admin" ||
      appRole === "super_admin"
    ) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "This account cannot use username login",
      };
    }

    authLogger.success("[signInWithUsername] User signed in successfully", {
      userId: signInData.user.id,
      username: trimmedUsername,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    authLogger.error("[signInWithUsername] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
