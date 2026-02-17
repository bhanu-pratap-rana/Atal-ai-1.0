/**
 * Shared utilities for server actions
 * Consolidates common patterns like Zod validation error handling
 */

import { z } from "zod";
import { authLogger } from "@/lib/auth-logger";

/**
 * Standard server action result type
 * All server actions should return this structure for consistent error handling
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper: Validate input with Zod schema and return standardized result
 * Eliminates duplicated Zod error handling across server actions
 *
 * @example
 * ```typescript
 * const result = validateInput(formData, MySchema);
 * if (!result.success) {
 *   return { success: false, error: result.error };
 * }
 * const validated = result.data;
 * ```
 */
export function validateInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>,
): ActionResult<T> {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0];
      return {
        success: false,
        error: firstError?.message || "Invalid input",
      };
    }
    throw error;
  }
}

/**
 * Helper: Create standardized error response
 */
export function createErrorResponse(
  message: string,
): ActionResult {
  return {
    success: false,
    error: message,
  };
}

/**
 * Helper: Create standardized success response
 */
export function createSuccessResponse<T>(data?: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Helper: Handle unexpected errors in server actions
 * Logs error and returns generic message for security
 */
export function handleActionError(
  context: string,
  error: unknown,
): ActionResult {
  authLogger.error(`[${context}] Unexpected error`, error);
  return {
    success: false,
    error: "An unexpected error occurred",
  };
}
