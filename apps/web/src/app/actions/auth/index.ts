/**
 * Barrel export file for auth actions
 * Re-exports all auth functions for backward compatibility
 */

// OTP-based authentication
export {
  requestOtp,
  verifyOtp,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from "./auth-otp";

// Username-based authentication
export {
  checkUsernameAvailable,
  registerWithUsername,
  signInWithUsername,
} from "./auth-username";

// Verification and role management
export {
  checkEmailExistsInAuth,
  checkUserIsTeacher,
  signOutUser,
} from "./auth-verification";
