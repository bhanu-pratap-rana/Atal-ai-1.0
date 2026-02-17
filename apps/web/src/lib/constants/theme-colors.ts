/**
 * Theme Color Constants
 *
 * Centralized theme color values used throughout the application.
 * These match CSS variables defined in globals.css.
 *
 * Rule.md Compliance:
 * - Single source of truth for theme colors
 * - No hardcoded hex values scattered throughout components
 * - Type-safe color references
 *
 * Used by:
 * - QR code generation (InvitePanel.tsx)
 * - Error pages (global-error.tsx, offline/page.tsx)
 * - Theme fallbacks for service worker context
 */

/**
 * Primary theme colors
 * Maps to CSS variables: --color-*, --radius-*, --shadow-*
 */
export const THEME_COLORS = {
  /** Primary brand color */
  primary: "#F98819",
  /** Dark variant of primary */
  primaryDark: "#E07510",
  /** Light variant of primary */
  primaryLight: "#FFCFA3",
  /** Lightest variant of primary */
  primaryLightest: "#FFF5EB",

  /** Surface color (backgrounds) */
  surface: "#FFFBF7",
  /** White color */
  white: "#FFFFFF",

  /** Text colors */
  textPrimary: "#2D2A26",
  textSecondary: "#57534E",
  textMuted: "#A8A29E",

  /** Status colors */
  error: "#DC2626",
  success: "#16A34A",
  warning: "#D97706",
  info: "#0284C7",

  /** Gradient */
  gradientPrimary: "linear-gradient(135deg, #F98819 0%, #FFAB4A 100%)",
} as const;

/**
 * QR Code specific color configuration
 * Used by InvitePanel for QR code generation
 */
export const QR_CODE_COLORS = {
  dark: THEME_COLORS.primary, // QR code foreground
  light: THEME_COLORS.white, // QR code background
} as const;

export type ThemeColorKey = keyof typeof THEME_COLORS;
export type QRColorKey = keyof typeof QR_CODE_COLORS;
