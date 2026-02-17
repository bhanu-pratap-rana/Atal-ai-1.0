"use server";

import { createClient } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkSchoolFinderRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

// Types
export interface District {
  name: string;
}

export interface Block {
  name: string;
  district: string;
}

export interface SchoolData {
  id: string;
  school_code: string;
  school_name: string;
  district: string;
  block?: string;
  address?: string;
}

/**
 * Get all unique districts from schools table
 */
export async function getDistricts() {
  try {
    // SECURITY: Rate limit school finder to prevent abuse
    const isAllowed = await checkSchoolFinderRateLimit("districts");
    if (!isAllowed) {
      authLogger.warn("[getDistricts] Rate limit exceeded");
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
        data: [],
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("schools")
      .select("district")
      .order("district")
      .limit(500);

    if (error) {
      authLogger.error("[getDistricts] Failed to fetch districts", error);
      return { success: false, error: "Failed to fetch districts", data: [] };
    }

    // Get unique districts
    const uniqueDistricts = Array.from(
      new Set((data || []).map((s) => s.district)),
    ).map((district) => ({ name: district }));

    return { success: true, data: uniqueDistricts };
  } catch (error) {
    authLogger.error("[getDistricts] Unexpected error", error);
    return { success: false, error: "An unexpected error occurred", data: [] };
  }
}

/**
 * Get all unique blocks for a specific district
 * Includes "Unassigned Block" option for schools without block assignment
 */
export async function getBlocksByDistrict(district: string) {
  try {
    // SECURITY: Rate limit school finder to prevent abuse
    const isAllowed = await checkSchoolFinderRateLimit(district);
    if (!isAllowed) {
      authLogger.warn("[getBlocksByDistrict] Rate limit exceeded", {
        district,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
        data: [],
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("schools")
      .select("block, district")
      .eq("district", district)
      .order("block")
      .limit(500);

    if (error) {
      authLogger.error("[getBlocksByDistrict] Failed to fetch blocks", error);
      return { success: false, error: "Failed to fetch blocks", data: [] };
    }

    // Check if there are schools with NULL blocks
    const hasUnassignedSchools = (data || []).some((s) => s.block === null);

    // Get unique blocks (excluding nulls)
    const uniqueBlocks = Array.from(
      new Set((data || []).map((s) => s.block).filter(Boolean)),
    ).map((block) => ({ name: block || "", district }));

    // Add "Unassigned Block" option if there are schools without block assignment
    if (hasUnassignedSchools) {
      uniqueBlocks.push({ name: "-- Unassigned Block --", district });
    }

    return { success: true, data: uniqueBlocks };
  } catch (error) {
    authLogger.error("[getBlocksByDistrict] Unexpected error", error);
    return { success: false, error: "An unexpected error occurred", data: [] };
  }
}

/**
 * Get all schools for a district and optional block
 * If block is "-- Unassigned Block --", returns schools with NULL block
 */
export async function getSchoolsByDistrictAndBlock(
  district: string,
  block?: string,
) {
  try {
    // SECURITY: Rate limit school search to prevent abuse
    // Use district as identifier since this is public search
    const isAllowed = await checkSchoolFinderRateLimit(district);
    if (!isAllowed) {
      authLogger.warn("[getSchoolsByDistrictAndBlock] Rate limit exceeded", {
        district,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
        data: [],
      };
    }

    const supabase = await createClient();

    let query = supabase
      .from("schools")
      .select("id, school_code, school_name, district, block, address")
      .eq("district", district)
      .order("school_name")
      .limit(200);

    if (block) {
      // Handle "Unassigned Block" selection - returns schools with NULL block
      if (block === "-- Unassigned Block --") {
        query = query.is("block", null);
      } else {
        query = query.eq("block", block);
      }
    }

    const { data, error } = await query;

    if (error) {
      authLogger.error(
        "[getSchoolsByDistrictAndBlock] Failed to fetch schools",
        error,
      );
      return { success: false, error: "Failed to fetch schools", data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    authLogger.error("[getSchoolsByDistrictAndBlock] Unexpected error", error);
    return { success: false, error: "An unexpected error occurred", data: [] };
  }
}

/**
 * Get school PIN status (exists or not)
 */
export async function getSchoolPinStatus(schoolCode: string) {
  try {
    // SECURITY: Rate limit school finder to prevent abuse
    const normalizedCode = schoolCode.toUpperCase().trim();
    const isAllowed = await checkSchoolFinderRateLimit(normalizedCode);
    if (!isAllowed) {
      authLogger.warn("[getSchoolPinStatus] Rate limit exceeded", {
        schoolCode: normalizedCode,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
        exists: false,
      };
    }

    const supabase = await createClient();

    // Find school - use .maybeSingle() as school code may not exist
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id")
      .eq("school_code", normalizedCode)
      .maybeSingle();

    if (schoolError) {
      authLogger.error(
        "[getSchoolPinStatus] Error finding school",
        schoolError,
      );
      return {
        success: false,
        error: "Failed to lookup school",
        exists: false,
      };
    }

    if (!school) {
      return {
        success: false,
        error: "School not found",
        exists: false,
      };
    }

    // Check if PIN exists - use .maybeSingle() as PIN may not exist
    const { data: credentials, error: credError } = await supabase
      .from("school_staff_credentials")
      .select("id, rotated_at, created_at")
      .eq("school_id", school.id)
      .maybeSingle();

    if (credError) {
      authLogger.error(
        "[getSchoolPinStatus] Error checking PIN status",
        credError,
      );
      return {
        success: false,
        error: "Failed to check PIN status",
        exists: false,
      };
    }

    return {
      success: true,
      exists: credentials !== null,
      createdAt: credentials?.created_at,
      lastRotatedAt: credentials?.rotated_at,
    };
  } catch (error) {
    authLogger.error("[getSchoolPinStatus] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      exists: false,
    };
  }
}
