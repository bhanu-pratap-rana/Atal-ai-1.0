/**
 * Centralized Validation Schemas
 *
 * All Zod validation schemas used across server actions.
 * Prevents duplicate schema definitions and ensures consistency.
 *
 * Rule.md Compliance:
 * - Single source of truth for validation schemas
 * - Uses constants from validation-limits.ts
 * - Type-safe and reusable
 */

import { z } from "zod";
import {
  PROFILE_LIMITS,
  SCHOOL_LIMITS,
  ASSESSMENT_LIMITS,
  PIN_LIMITS,
} from "@/lib/constants/validation-limits";

// ============================================================================
// Student Schemas
// ============================================================================

/**
 * Schema for joining a class with code and PIN
 */
export const JoinClassSchema = z.object({
  classCode: z
    .string()
    .min(1, "Class code required")
    .max(SCHOOL_LIMITS.schoolCodeMaxLength, "Invalid class code")
    .regex(/^[A-Z0-9-]+$/, "Class code format invalid"),
  pin: z
    .string()
    .length(PIN_LIMITS.length, `PIN must be ${PIN_LIMITS.length} digits`)
    .regex(/^\d{4}$/, "PIN must contain only digits"),
});

/**
 * Schema for student profile data
 */
export const StudentProfileSchema = z.object({
  name: z
    .string()
    .min(
      PROFILE_LIMITS.nameMinLength,
      `Name must be at least ${PROFILE_LIMITS.nameMinLength} characters`,
    )
    .max(PROFILE_LIMITS.nameMaxLength, "Name too long"),
  gender: z.enum(["male", "female"]),
  phone: z.string().optional(),
  rollNumber: z.string().max(PROFILE_LIMITS.rollNumberMaxLength).optional(),
  schoolName: z.string().optional(),
  className: z.string().max(SCHOOL_LIMITS.classNameMaxLength).optional(),
  village: z.string().optional(),
});

// ============================================================================
// Teacher Schemas
// ============================================================================

/**
 * Schema for creating a class
 */
export const CreateClassSchema = z.object({
  name: z
    .string()
    .min(1, "Class name is required")
    .max(
      SCHOOL_LIMITS.classNameMaxLength,
      `Class name must be ${SCHOOL_LIMITS.classNameMaxLength} characters or less`,
    ),
  subject: z
    .string()
    .max(
      SCHOOL_LIMITS.subjectMaxLength,
      `Subject must be ${SCHOOL_LIMITS.subjectMaxLength} characters or less`,
    )
    .optional(),
});

// ============================================================================
// School Schemas
// ============================================================================

/**
 * Schema for school search query
 */
export const SearchQuerySchema = z
  .string()
  .min(1, "Search query required")
  .max(SCHOOL_LIMITS.searchQueryMaxLength, "Search query too long")
  .regex(/^[a-zA-Z0-9\s\-.']+$/, "Search query contains invalid characters");

/**
 * Schema for school code
 */
export const SchoolCodeSchema = z
  .string()
  .min(1, "School code required")
  .max(SCHOOL_LIMITS.schoolCodeMaxLength, "Invalid school code format");

/**
 * Schema for staff PIN (4-8 digits)
 */
export const StaffPinSchema = z
  .string()
  .regex(/^\d{4,8}$/, "PIN must be 4-8 digits");

/**
 * Schema for teacher name
 */
export const TeacherNameSchema = z
  .string()
  .min(1, "Name required")
  .max(PROFILE_LIMITS.nameMaxLength, "Name too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters");

/**
 * Schema for phone number (optional)
 */
export const PhoneSchema = z
  .string()
  .regex(/^\+?[0-9\-\s()]{10,}$/, "Invalid phone number format")
  .optional();

// ============================================================================
// Assessment Schemas
// ============================================================================

/**
 * Schema for a single assessment response
 */
export const AssessmentResponseSchema = z.object({
  itemId: z
    .string()
    .min(1, "Item ID required")
    .max(ASSESSMENT_LIMITS.itemIdMaxLength, "Item ID too long"),
  module: z
    .string()
    .min(1, "Module required")
    .max(ASSESSMENT_LIMITS.moduleNameMaxLength, "Module name too long"),
  isCorrect: z.boolean(),
  rtMs: z
    .number()
    .min(0, "Response time cannot be negative")
    .max(999999, "Response time too long"),
  focusBlurCount: z
    .number()
    .min(0, "Focus blur count cannot be negative")
    .max(ASSESSMENT_LIMITS.focusBlurCountMax, "Focus blur count too high"),
  chosenOption: z
    .string()
    .min(1, "Chosen option required")
    .max(ASSESSMENT_LIMITS.optionIdMaxLength, "Option ID too long"),
});

/**
 * Schema for submitting assessment responses
 */
export const AssessmentSubmitSchema = z.object({
  sessionId: z.string().min(1, "Session ID required").uuid(),
  responses: z
    .array(AssessmentResponseSchema)
    .min(1, "At least one response required")
    .max(ASSESSMENT_LIMITS.responsesMaxCount, "Too many responses"),
});

// ============================================================================
// Admin Schemas
// ============================================================================

/**
 * Schema for admin email input
 */
export const AdminEmailSchema = z
  .string()
  .min(1, "Email required")
  .max(254, "Email too long")
  .email("Invalid email format")
  .transform((email) => email.toLowerCase().trim());

/**
 * Schema for admin password
 */
export const AdminPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long");

/**
 * Schema for class ID (UUID)
 */
export const ClassIdSchema = z.string().uuid("Invalid class ID");

/**
 * Schema for user ID (UUID)
 */
export const UserIdSchema = z.string().uuid("Invalid user ID");

/**
 * Schema for student ID (UUID alias for clarity)
 */
export const StudentIdSchema = z.string().uuid("Invalid student ID");

/**
 * Schema for updating a class
 */
export const UpdateClassSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  name: z
    .string()
    .min(1, "Class name is required")
    .max(
      SCHOOL_LIMITS.classNameMaxLength,
      `Class name must be ${SCHOOL_LIMITS.classNameMaxLength} characters or less`,
    ),
  subject: z
    .string()
    .max(
      SCHOOL_LIMITS.subjectMaxLength,
      `Subject must be ${SCHOOL_LIMITS.subjectMaxLength} characters or less`,
    )
    .optional(),
});

/**
 * Schema for enrollment operations (enroll/remove student)
 */
export const EnrollmentSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  studentId: z.string().uuid("Invalid student ID"),
});

// ============================================================================
// Auth Schemas
// ============================================================================

/**
 * Schema for email validation in auth flows
 * More permissive than admin email - allows standard email formats
 */
export const AuthEmailSchema = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email too long")
  .email("Please enter a valid email address")
  .transform((email) => email.toLowerCase().trim());

/**
 * Schema for password validation in auth flows
 *
 * Rules:
 * - Minimum 8 characters
 * - Maximum 64 characters (supports long passphrases)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Breach checking done server-side via HaveIBeenPwned API (optional, Task 3.3)
 *
 * Security Rationale:
 * - Complexity rules protect against dictionary attacks
 * - Educational platform handling student data requires strong passwords
 * - Prevents common weak passwords like "password123"
 * - Complements breach checking for defense in depth
 */
export const AuthPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password too long")
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    "Password must contain at least one uppercase letter",
  )
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    "Password must contain at least one lowercase letter",
  )
  .refine((pwd) => /\d/.test(pwd), "Password must contain at least one number")
  .refine(
    (pwd) => /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(pwd),
    "Password must contain at least one special character",
  );

/**
 * Schema for OTP token
 */
export const OtpTokenSchema = z
  .string()
  .min(1, "Verification code is required")
  .max(10, "Verification code too long")
  .regex(/^\d+$/, "Verification code must contain only digits");

/**
 * Schema for username validation
 * Rules:
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - Must start with a letter
 * - Case insensitive (transformed to lowercase)
 */
export const UsernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z]/, "Username must start with a letter")
  .regex(
    /^[a-zA-Z]\w*$/,
    "Username can only contain letters, numbers, and underscores",
  )
  .transform((username) => username.toLowerCase().trim());

// ============================================================================
// Teacher Communication Schemas
// ============================================================================

/**
 * Schema for announcement priority levels
 */
export const AnnouncementPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);

/**
 * Schema for creating a class announcement
 */
export const CreateAnnouncementSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  body: z
    .string()
    .min(1, "Body is required")
    .max(5000, "Body must be 5000 characters or less"),
  priority: AnnouncementPrioritySchema.optional().default("normal"),
  isPinned: z.boolean().optional().default(false),
});

/**
 * Schema for updating an announcement
 */
export const UpdateAnnouncementSchema = z.object({
  announcementId: z.string().uuid("Invalid announcement ID"),
  title: z.string().min(1, "Title is required").max(200).optional(),
  body: z.string().min(1, "Body is required").max(5000).optional(),
  priority: AnnouncementPrioritySchema.optional(),
  isPinned: z.boolean().optional(),
});

/**
 * Schema for announcement ID
 */
export const AnnouncementIdSchema = z.string().uuid("Invalid announcement ID");

/**
 * Schema for material types
 */
export const MaterialTypeSchema = z.enum([
  "document",
  "video",
  "link",
  "image",
  "other",
]);

/**
 * Schema for uploading class materials
 */
export const UploadMaterialSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z.string().max(1000, "Description too long").optional(),
  materialType: MaterialTypeSchema,
  fileUrl: z.string().url("Invalid file URL").optional(),
  externalUrl: z.string().url("Invalid URL").optional(),
  topicId: z.string().max(20, "Topic ID too long").optional(),
  moduleId: z.string().max(10, "Module ID too long").optional(),
});

/**
 * Schema for material ID
 */
export const MaterialIdSchema = z.string().uuid("Invalid material ID");

// ============================================================================
// Type Exports
// ============================================================================

export type AnnouncementPriority = z.infer<typeof AnnouncementPrioritySchema>;
export type MaterialType = z.infer<typeof MaterialTypeSchema>;
