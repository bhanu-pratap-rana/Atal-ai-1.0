/**
 * Barrel export file for school actions
 * Re-exports all school functions for backward compatibility
 */

// Teacher verification
export { verifyTeacher } from "./teacher-verification";

// School search
export { searchSchools, getSchoolByCode } from "./school-search";

// Staff PIN management
export { rotateStaffPin } from "./staff-pin-management";

// Admin authorization
export { checkAdminAuth } from "./admin-auth";

// Shared utilities and types
export {
  normalizeSchoolCode,
  handleZodValidationError,
  type SchoolData,
  type VerifyTeacherParams,
  type VerifyTeacherResult,
} from "./school-utils";
