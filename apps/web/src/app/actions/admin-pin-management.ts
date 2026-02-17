"use server";

import {
  createClient,
  createAdminClient,
  verifyAdminAuth,
} from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { PIN_LIMITS } from "@/lib/constants/validation-limits";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";

export interface SchoolPINInfo {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  districtName: string;
  currentPin: string;
  lastRotatedAt: string | null;
  createdAt: string;
  pinHistory?: PinHistoryEntry[];
}

export interface PinHistoryEntry {
  rotatedAt: string;
  rotatedBy?: string;
}

export interface AdminPINActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/** School list item returned by getAllSchoolsWithPINs */
export interface SchoolListItem {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  districtName: string;
  hasPIN: boolean;
  lastRotatedAt: string | null;
  createdAt: string;
}

/** PIN statistics returned by getPINStatistics */
export interface PINStatistics {
  totalSchools: number;
  schoolsWithPINs: number;
  schoolsWithoutPINs: number;
}

/** Database row types for type safety */
interface SchoolRow {
  id: string;
  school_name: string;
  school_code: string | null;
  district: string | null;
}

interface PINCredentialRow {
  school_id: string;
  created_at: string;
  rotated_at: string | null;
}

/**
 * Get school PIN information (if exists)
 * SECURITY: Requires admin or super_admin role
 */
export async function getSchoolPINInfo(
  schoolId: string,
): Promise<AdminPINActionResult> {
  try {
    // SECURITY: Verify admin authorization
    const authCheck = await verifyAdminAuth("getSchoolPINInfo");
    if (!authCheck.authorized) {
      return authCheck.error;
    }

    if (!schoolId) {
      return {
        success: false,
        error: "School ID is required",
      };
    }

    const supabase = await createClient();
    // Use admin client for school_staff_credentials (RLS restricts to service_role only)
    const adminClient = await createAdminClient();

    // Get school info - use .maybeSingle() since school may not exist
    const { data: schoolData, error: schoolError } = await supabase
      .from("schools")
      .select(
        `
        id,
        school_name,
        school_code,
        district
      `,
      )
      .eq("id", schoolId)
      .maybeSingle();

    if (schoolError) {
      authLogger.error(
        "[getSchoolPINInfo] Error looking up school",
        schoolError,
      );
      return {
        success: false,
        error: "Failed to lookup school",
      };
    }

    if (!schoolData) {
      return {
        success: false,
        error: "School not found",
      };
    }

    // Get PIN info from school_staff_credentials (requires service_role to access)
    // Use .maybeSingle() - PIN credentials may not exist for this school yet
    const { data: pinData, error: pinError } = await adminClient
      .from("school_staff_credentials")
      .select("created_at, rotated_at, updated_at")
      .eq("school_id", schoolId)
      .maybeSingle();

    if (pinError) {
      authLogger.error("[getSchoolPINInfo] Error fetching PIN data", pinError);
      // Don't fail - just means no PIN exists yet
    }

    // Build PIN history from rotated_at timestamps
    const pinHistory: PinHistoryEntry[] = [];
    if (pinData?.rotated_at) {
      pinHistory.push({ rotatedAt: pinData.rotated_at });
    }
    if (pinData?.created_at && pinData.created_at !== pinData.rotated_at) {
      pinHistory.push({ rotatedAt: pinData.created_at });
    }

    // PIN may not exist yet, that's ok
    const pinInfo: SchoolPINInfo = {
      schoolId: schoolData.id,
      schoolName: schoolData.school_name,
      schoolCode: schoolData.school_code || "N/A",
      districtName: schoolData.district || "Unknown District",
      currentPin: "Hidden (only shown after rotation)",
      lastRotatedAt: pinData?.rotated_at || null,
      createdAt: pinData?.created_at || new Date().toISOString(),
      pinHistory: pinHistory.length > 0 ? pinHistory : undefined,
    };

    return {
      success: true,
      data: pinInfo,
    };
  } catch (error) {
    authLogger.error("[getSchoolPINInfo] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Rotate school PIN - generates new PIN or uses provided PIN
 * SECURITY: Requires admin or super_admin role
 */
export async function rotateSchoolPIN(
  schoolId: string,
  customPIN?: string,
): Promise<AdminPINActionResult> {
  try {
    // SECURITY: Verify admin authorization
    const authCheck = await verifyAdminAuth("rotateSchoolPIN");
    if (!authCheck.authorized) {
      return authCheck.error;
    }

    if (!schoolId) {
      return {
        success: false,
        error: "School ID is required",
      };
    }

    // TypeScript now knows authCheck.user exists due to discriminated union
    const user = authCheck.user;

    // SECURITY: Rate limit PIN rotation to prevent abuse
    const rateLimitKey = `pin-rotation:${user.id}`;
    const isAllowed = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.pinRotation,
    );
    if (!isAllowed) {
      authLogger.warn("[rotateSchoolPIN] Rate limit exceeded", {
        userId: user.id,
        schoolId,
      });
      return {
        success: false,
        error:
          "Too many PIN rotation requests. Please wait before trying again.",
      };
    }

    // Use admin client with service_role to call the RPC function
    // The rotate_staff_pin function requires service_role to execute
    const supabase = await createAdminClient();

    // Use custom PIN if provided, otherwise generate new PIN
    // Uses rejection sampling to avoid modulo bias in random number generation
    let newPIN: string;

    if (customPIN && typeof customPIN === 'string' && customPIN.trim()) {
      // Use the PIN provided from the UI
      newPIN = customPIN.trim();
      authLogger.debug("[rotateSchoolPIN] Using custom PIN from UI", {
        schoolId,
        pinLength: newPIN.length,
        pinFormat: /^\d{4,6}$/.test(newPIN),
      });
    } else {
      // Generate new PIN using centralized constants
      const range = PIN_LIMITS.max - PIN_LIMITS.min + 1;
      const maxUnbiased = Math.floor(0xffffffff / range) * range;
      let value: number;
      do {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        value = array[0];
      } while (value >= maxUnbiased);
      newPIN = (PIN_LIMITS.min + (value % range)).toString();

      authLogger.debug("[rotateSchoolPIN] Generated new PIN", {
        schoolId,
        pinLength: newPIN.length,
        pinFormat: /^\d{4,6}$/.test(newPIN),
      });
    }

    // Call the rotate_staff_pin function via RPC
    const { data, error } = await supabase.rpc("rotate_staff_pin", {
      p_school_id: schoolId,
      p_new_pin: newPIN,
    });

    if (error) {
      // SEC-6 FIX: Log detailed error server-side only; return generic message to client
      authLogger.error("[rotateSchoolPIN] Failed to rotate PIN", {
        code: error.code,
        message: error.message,
        details: error.details,
      });

      // If schema cache error, provide more helpful message
      if (error.code === "PGRST202") {
        return {
          success: false,
          error:
            "Database schema cache is refreshing. Please wait 30 seconds and try again.",
        };
      }

      return {
        success: false,
        error: "Failed to rotate PIN",
      };
    }

    // Check if function returned success
    if (!data?.[0]?.success) {
      const errorMsg = data?.[0]?.error_message || "Failed to rotate PIN";
      authLogger.error("[rotateSchoolPIN] PIN rotation failed", {
        error: errorMsg,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    authLogger.success("[rotateSchoolPIN] PIN rotated successfully", {
      schoolId,
      newPIN: "****",
    });
    // SEC-007 FIX: Don't include PIN in message (could be logged/cached)
    // PIN is returned only in data for one-time secure display
    return {
      success: true,
      message: "PIN rotated successfully! Copy the new PIN shown below.",
      data: { newPIN },
    };
  } catch (error) {
    authLogger.error("[rotateSchoolPIN] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred while rotating PIN",
    };
  }
}

/**
 * Get all schools with PIN information
 * SECURITY: Requires admin or super_admin role
 */
export async function getAllSchoolsWithPINs(): Promise<AdminPINActionResult> {
  try {
    // SECURITY: Verify admin authorization
    const authCheck = await verifyAdminAuth("getAllSchoolsWithPINs");
    if (!authCheck.authorized) {
      return authCheck.error;
    }

    const supabase = await createClient();
    // Use admin client for school_staff_credentials (RLS restricts to service_role only)
    const adminClient = await createAdminClient();

    // Get all schools
    const { data: schools, error: schoolError } = await supabase
      .from("schools")
      .select(
        `
        id,
        school_name,
        school_code,
        district
      `,
      )
      .order("school_name");

    if (schoolError) {
      authLogger.error(
        "[getAllSchoolsWithPINs] Failed to fetch schools",
        schoolError,
      );
      return {
        success: false,
        error: "Failed to fetch schools",
      };
    }

    // Get all PIN records (requires service_role to access)
    const { data: pins } = await adminClient
      .from("school_staff_credentials")
      .select("school_id, created_at, rotated_at");

    // Map PIN data by school ID
    const pinMap = new Map(
      (pins || []).map((p: PINCredentialRow) => [p.school_id, p]),
    );

    // Build result
    const schoolsWithPINs = (schools || []).map((school: SchoolRow) => {
      const pinInfo = pinMap.get(school.id);
      return {
        schoolId: school.id,
        schoolName: school.school_name,
        schoolCode: school.school_code || "N/A",
        districtName: school.district || "Unknown District",
        hasPIN: pinInfo !== null,
        lastRotatedAt: pinInfo?.rotated_at || null,
        createdAt: pinInfo?.created_at || new Date().toISOString(),
      };
    });

    authLogger.info("[getAllSchoolsWithPINs] Fetched schools with PINs", {
      count: schoolsWithPINs.length,
    });
    return {
      success: true,
      data: schoolsWithPINs,
    };
  } catch (error) {
    authLogger.error("[getAllSchoolsWithPINs] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get PIN statistics
 * SECURITY: Requires admin or super_admin role
 */
export async function getPINStatistics(): Promise<AdminPINActionResult> {
  try {
    // SECURITY: Verify admin authorization
    const authCheck = await verifyAdminAuth("getPINStatistics");
    if (!authCheck.authorized) {
      return authCheck.error;
    }

    const supabase = await createClient();
    // Use admin client for school_staff_credentials (RLS restricts to service_role only)
    const adminClient = await createAdminClient();

    // Get total schools
    const { count: totalSchools } = await supabase
      .from("schools")
      .select("*", { count: "exact", head: true });

    // Get schools with PINs configured (requires service_role to access)
    const { count: schoolsWithPINs } = await adminClient
      .from("school_staff_credentials")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    const stats = {
      totalSchools: totalSchools || 0,
      schoolsWithPINs: schoolsWithPINs || 0,
      schoolsWithoutPINs: (totalSchools || 0) - (schoolsWithPINs || 0),
    };

    authLogger.info("[getPINStatistics] Statistics calculated", stats);
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    authLogger.error("[getPINStatistics] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
