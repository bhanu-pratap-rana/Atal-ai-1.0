/**
 * Server Action Error Handling Utilities
 * Centralizes error handling patterns used across all action files
 */

import { z } from "zod";

/**
 * Standard response type for all server actions
 */
interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Handle Zod validation errors in a consistent way
 * Returns a standardized error response
 */
export function handleZodError(error: unknown): ActionResponse {
  if (error instanceof z.ZodError) {
    const firstError = error.issues[0];
    return {
      success: false,
      error: firstError?.message || "Invalid input",
    };
  }
  throw error; // Re-throw if not a ZodError
}

