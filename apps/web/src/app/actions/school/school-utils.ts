/**
 * Shared utilities for school actions
 * Common functions used across multiple school modules
 */

import { z } from "zod";

/**
 * Normalize school code (uppercase and trim)
 */
export function normalizeSchoolCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Handle Zod validation errors
 * Returns user-friendly error message
 */
export function handleZodValidationError(error: unknown): {
  success: false;
  error: string;
} {
  if (error instanceof z.ZodError) {
    const firstError = error.issues[0];
    return { success: false, error: firstError?.message || "Invalid input" };
  }
  return { success: false, error: "Validation failed" };
}

/**
 * Shared types for school actions
 */
export interface SchoolData {
  id: string;
  school_code: string;
  school_name: string;
  district?: string;
}

export interface VerifyTeacherParams {
  schoolCode: string;
  staffPin: string;
  teacherName: string;
  phone?: string;
  subject?: string;
}

export interface VerifyTeacherResult {
  success: boolean;
  error?: string;
  schoolId?: string;
  schoolName?: string;
}
