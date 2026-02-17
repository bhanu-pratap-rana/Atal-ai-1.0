/**
 * Centralized Error Messages
 *
 * Single source of truth for all error messages across the application.
 * Eliminates message duplication and ensures consistency.
 *
 * Rule.md Compliance:
 * - Centralized strings for easy maintenance
 * - Consistent error messaging across all operations
 * - Easy to update messages globally
 * - User-friendly error text
 */

/**
 * Authentication and session errors
 */
export const AUTH_ERRORS = {
  UNAUTHORIZED: "You are not authorized to perform this action",
  SESSION_EXPIRED: "Your session has expired. Please log in again",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_EXISTS: "This email is already registered",
  PHONE_ALREADY_EXISTS: "This phone number is already registered",
} as const;

/**
 * Database and query errors
 */
export const DATABASE_ERRORS = {
  QUERY_FAILED: "Failed to fetch data from database",
  INSERT_FAILED: "Failed to create record",
  UPDATE_FAILED: "Failed to update record",
  DELETE_FAILED: "Failed to delete record",
  TRANSACTION_FAILED: "Transaction failed. Please try again",
  VALIDATION_FAILED: "Data validation failed",
  DUPLICATE_ENTRY: "This record already exists",
  NOT_FOUND: "The requested record was not found",
} as const;

/**
 * School and class management errors
 */
export const SCHOOL_ERRORS = {
  SCHOOL_NOT_FOUND: "School not found",
  SCHOOL_CODE_INVALID: "Invalid school code",
  CLASS_NOT_FOUND: "Class not found",
  CLASS_CODE_INVALID: "Invalid class code",
  PIN_INVALID: "Invalid PIN",
  MAX_CLASSES_REACHED: "Maximum number of classes reached",
  STUDENT_ALREADY_IN_CLASS: "Student is already enrolled in this class",
} as const;

/**
 * Admin operation errors
 */
export const ADMIN_ERRORS = {
  ADMIN_NOT_FOUND: "Admin user not found",
  INVALID_ADMIN_CODE: "Invalid admin code",
  ADMIN_ALREADY_EXISTS: "This admin user already exists",
  CANNOT_DELETE_SELF: "You cannot delete your own account",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions for this operation",
  PASSWORD_RESET_FAILED: "Failed to reset password",
  PIN_GENERATION_FAILED: "Failed to generate PIN",
} as const;

/**
 * Student and teacher errors
 */
export const STUDENT_ERRORS = {
  STUDENT_NOT_FOUND: "Student not found",
  PROFILE_UPDATE_FAILED: "Failed to update student profile",
  PROGRESS_NOT_FOUND: "Student progress not found",
  NO_ACTIVE_ASSESSMENT: "No active assessment found",
  ASSESSMENT_NOT_STARTED: "Assessment has not been started",
} as const;

export const TEACHER_ERRORS = {
  TEACHER_NOT_FOUND: "Teacher not found",
  CLASS_NOT_OWNED: "You do not own this class",
  CANNOT_DELETE_CLASS_WITH_STUDENTS:
    "Cannot delete class with enrolled students",
  PROFILE_UPDATE_FAILED: "Failed to update teacher profile",
} as const;

/**
 * Assessment and learning errors
 */
export const ASSESSMENT_ERRORS = {
  QUESTION_NOT_FOUND: "Question not found",
  ANSWER_INVALID: "Invalid answer format",
  SUBMISSION_FAILED: "Failed to submit assessment",
  TIME_EXCEEDED: "Time limit exceeded",
  ASSESSMENT_ALREADY_COMPLETED: "Assessment already completed",
  QUESTIONS_NOT_LOADED: "Questions failed to load",
} as const;

/**
 * AI and content errors
 */
export const AI_ERRORS = {
  AI_REQUEST_FAILED: "AI request failed",
  TEXT_TO_SPEECH_FAILED: "Text-to-speech generation failed",
  CURRICULUM_NOT_FOUND: "Curriculum content not found",
  CONTENT_GENERATION_FAILED: "Content generation failed",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later",
} as const;

/**
 * File and upload errors
 */
export const FILE_ERRORS = {
  FILE_TOO_LARGE: "File is too large",
  INVALID_FILE_TYPE: "Invalid file type",
  UPLOAD_FAILED: "File upload failed",
  EXPORT_FAILED: "Export failed. Please try again",
} as const;

/**
 * Rate limiting errors
 */
export const RATE_LIMIT_ERRORS = {
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
  WAIT_BEFORE_RETRY: "Too many requests. Please wait before trying again.",
  WAIT_FEW_MINUTES: "Too many requests. Please wait a few minutes and try again.",
  AI_RATE_LIMIT: "Too many requests. Please wait before asking another question.",
  ESSAY_RATE_LIMIT: "Too many requests. Please wait before submitting another essay.",
  QUESTIONS_RATE_LIMIT: "Too many requests. Please wait before generating more questions.",
  SUMMARY_RATE_LIMIT: "Too many requests. Please wait before summarizing more content.",
} as const;

/**
 * Generic operational errors
 */
export const OPERATIONAL_ERRORS = {
  OPERATION_FAILED: "Operation failed. Please try again",
  NETWORK_ERROR: "Network error. Please check your connection",
  SERVER_ERROR: "Server error. Please try again later",
  INVALID_INPUT: "Invalid input provided",
  MISSING_REQUIRED_FIELD: "Missing required field",
  OPERATION_TIMEOUT: "Operation timed out. Please try again",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED_SUCCESSFULLY: "Created successfully",
  UPDATED_SUCCESSFULLY: "Updated successfully",
  DELETED_SUCCESSFULLY: "Deleted successfully",
  SAVED_SUCCESSFULLY: "Saved successfully",
  SUBMITTED_SUCCESSFULLY: "Submitted successfully",
  ACTION_COMPLETED: "Action completed successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
} as const;

/**
 * Validation error messages
 */
export const VALIDATION_ERRORS = {
  INVALID_EMAIL: "Invalid email address",
  INVALID_PHONE: "Invalid phone number",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_WEAK: "Password is too weak",
  PASSWORDS_NOT_MATCHING: "Passwords do not match",
  INVALID_NAME: "Invalid name format",
  INVALID_CODE: "Invalid code format",
} as const;

/**
 * Generic helper to get error message
 */
export function getErrorMessage(
  error: unknown,
  fallback = OPERATIONAL_ERRORS.OPERATION_FAILED,
): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return fallback;
}
