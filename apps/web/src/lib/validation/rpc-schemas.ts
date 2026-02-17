/**
 * Zod Schemas for RPC Response Validation
 *
 * Provides runtime validation for all Supabase RPC function responses
 * and unsafe type assertions throughout the codebase
 */

import { z } from "zod";

/**
 * Supabase Auth User Schema
 * Validates users from admin.auth.admin.listUsers()
 */
export const SupabaseAuthUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email().nullable().optional(),
    app_metadata: z.record(z.unknown()).optional(),
    user_metadata: z.record(z.unknown()).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    confirmed_at: z.string().nullable().optional(),
    last_sign_in_at: z.string().nullable().optional(),
  })
  .passthrough(); // Allow additional fields from Supabase

export type SupabaseAuthUser = z.infer<typeof SupabaseAuthUserSchema>;

/**
 * Array of Supabase Auth Users
 */
export const SupabaseAuthUserArraySchema = z.array(SupabaseAuthUserSchema);

/**
 * Assessment Response Payload Schema
 * Validates payload for assessment submission mutations
 */
export const AssessmentResponsePayloadSchema = z
  .object({
    session_id: z.string().uuid(),
    item_id: z.string().uuid(),
    response: z.union([
      z.string(),
      z.number(),
      z.array(z.string()),
      z.array(z.number()),
    ]),
    is_correct: z.boolean(),
    time_spent_ms: z.number().int().nonnegative().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type AssessmentResponsePayload = z.infer<
  typeof AssessmentResponsePayloadSchema
>;

/**
 * Mutation Queue Payload Schema
 * Generic schema for mutation queue payloads
 */
export const MutationQueuePayloadSchema = z.record(z.unknown());

export type MutationQueuePayload = z.infer<typeof MutationQueuePayloadSchema>;

/**
 * Cursor Pagination Item Schema
 * Validates items used for cursor-based pagination
 */
export const CursorPaginationItemSchema = z
  .object({
    id: z.string().uuid(),
    created_at: z.string().datetime().optional(),
  })
  .passthrough(); // Allow additional fields

export type CursorPaginationItem = z.infer<typeof CursorPaginationItemSchema>;

/**
 * Validate and parse Supabase Auth Users
 *
 * @param users - Raw users array from Supabase
 * @returns Validated users array or throws ZodError
 */
export function validateSupabaseAuthUsers(users: unknown): SupabaseAuthUser[] {
  return SupabaseAuthUserArraySchema.parse(users);
}

/**
 * Validate and parse Assessment Response Payload
 *
 * @param payload - Raw payload object
 * @returns Validated payload or throws ZodError
 */
export function validateAssessmentResponsePayload(
  payload: unknown,
): AssessmentResponsePayload {
  return AssessmentResponsePayloadSchema.parse(payload);
}

/**
 * Validate and parse Mutation Queue Payload
 *
 * @param payload - Raw payload object
 * @returns Validated payload or throws ZodError
 */
export function validateMutationQueuePayload(
  payload: unknown,
): MutationQueuePayload {
  return MutationQueuePayloadSchema.parse(payload);
}

/**
 * Validate and parse Cursor Pagination Item
 *
 * @param item - Raw item object
 * @returns Validated item or throws ZodError
 */
export function validateCursorPaginationItem(
  item: unknown,
): CursorPaginationItem {
  return CursorPaginationItemSchema.parse(item);
}
