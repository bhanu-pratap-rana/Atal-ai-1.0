/**
 * Time Utilities
 *
 * Centralized time formatting and conversion functions.
 *
 * CLEANUP: Removed unused functions (formatTimeMMSS, formatTimeHumanReadable,
 * isCooldownElapsed, getRemainingCooldown, parseDuration).
 * Only formatTimeTidyCompact is actively used.
 */

/**
 * Format seconds with compact display for OTP cooldown
 * Used by SignUpEmailFlow, TeacherSignupEmailFlow
 *
 * @param seconds - Total seconds to format
 * @returns Formatted time string (e.g., "1:30" or "45s")
 */
export function formatTimeTidyCompact(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
}
