/**
 * ATAL AI - Jyoti (ज्योति) Design Token System
 * 
 * Single Source of Truth for all design tokens.
 * These values MUST match globals.css CSS variables.
 * 
 * @version 2.0 - Consistent Color System
 * @theme Jyoti (Light of Learning)
 * 
 * USAGE:
 * - Import COLORS, GRADIENTS, etc. when needed in JS/TS
 * - Prefer using CSS variable classes (bg-primary, text-primary) in JSX
 * - Use these constants for dynamic styles or JS calculations only
 */

/* ============================================================================
   PRIMARY COLOR SYSTEM - Orange-Yellow (#FF8C42)
   Use for: ALL buttons, progress, active states, icon backgrounds, focus states
   ============================================================================ */

export const COLORS = {
  // Primary - Orange-Yellow (Energy, Wisdom, Learning)
  primary: '#FF8C42',
  primaryDark: '#E67A30',
  primaryLight: '#FFEBD9',
  primaryLighter: '#FFF7F0',

  // Secondary - Charcoal (Stability, Professionalism)
  secondary: '#2D2A26',
  secondaryLight: '#4A4640',
  secondaryLighter: '#6B6560',

  // Accent - Gold (Achievement, Celebration) - USE ONLY FOR REWARDS/ACHIEVEMENTS
  accent: '#FFD54F',
  accentDark: '#FFC107',
  accentLight: '#FFF8E1',

  // Semantic Colors - STATUS INDICATORS ONLY
  success: '#22C55E',
  successLight: '#DCFCE7',
  successDark: '#16A34A',

  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#DC2626',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#D97706',

  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoDark: '#2563EB',

  // Backgrounds
  white: '#FFFFFF',
  cream: '#FFFBF7',
  background: '#FFFFFF',
  surface: '#FFFBF7',

  // Text Colors - Warm Gray Scale
  textPrimary: '#2D2A26',
  textSecondary: '#57534E',
  textTertiary: '#78716C',
  textMuted: '#A8A29E',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Border Colors
  border: '#E8E4E0',
  borderLight: '#F3F0ED',
  borderFocus: '#FF8C42',

  // Gray Scale - Warm Tones (Stone-based)
  gray: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E8E4E0',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },

  // Dark Mode (Admin Dashboard)
  dark: {
    background: '#1C1917',
    surface: '#292524',
    text: '#FAFAF9',
    textSecondary: '#A8A29E',
    border: '#44403C',
  },
} as const

/* ============================================================================
   GRADIENT DEFINITIONS
   ============================================================================ */

export const GRADIENTS = {
  // Primary gradients - Use for buttons, banners, active states
  primary: 'linear-gradient(135deg, #FF7E33 0%, #FF9F5A 100%)',
  primaryHover: 'linear-gradient(135deg, #E86A1F 0%, #FF7E33 100%)',
  primaryVertical: 'linear-gradient(180deg, #FF7E33 0%, #FF9F5A 100%)',

  // Directional variants
  primaryToBR: 'linear-gradient(to bottom right, #FF7E33, #FF9F5A)',
  primaryToR: 'linear-gradient(to right, #FF7E33, #FF9F5A)',
  primaryToB: 'linear-gradient(to bottom, #FF7E33, #FF9F5A)',
} as const

/* ============================================================================
   SHADOW DEFINITIONS
   ============================================================================ */

export const SHADOWS = {
  // Size-based shadows
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.06)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  xl: '0 16px 40px rgba(0, 0, 0, 0.16)',

  // Primary colored shadows - CORRECT rgba(255, 126, 51, x) - NOT rgba(255, 140, 66, x)
  primarySm: '0 2px 8px rgba(255, 126, 51, 0.15)',
  primaryMd: '0 4px 14px rgba(255, 126, 51, 0.25)',
  primaryLg: '0 8px 24px rgba(255, 126, 51, 0.30)',
  primaryXl: '0 12px 28px rgba(255, 126, 51, 0.45)',

  // Component-specific
  button: '0 4px 14px rgba(255, 126, 51, 0.25)',
  buttonHover: '0 8px 20px rgba(255, 126, 51, 0.35)',
  card: '0 4px 12px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',

  none: 'none',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
} as const

/* ============================================================================
   SPACING SCALE
   ============================================================================ */

export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const

/* ============================================================================
   TYPOGRAPHY
   ============================================================================ */

export const TYPOGRAPHY = {
  // Font families
  fontDisplay: "'Baloo 2', var(--font-nunito), system-ui, sans-serif",
  fontBody: "var(--font-nunito), 'Nunito', system-ui, sans-serif",
  fontHindi: "var(--font-devanagari), 'Noto Sans Devanagari', system-ui, sans-serif",
  fontAssamese: "var(--font-bengali), 'Noto Sans Bengali', system-ui, sans-serif",
  fontCode: "'Fira Code', 'Consolas', monospace",

  // Font sizes
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },

  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line heights
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const

/* ============================================================================
   BORDER RADIUS
   ============================================================================ */

export const BORDER_RADIUS = {
  none: '0',
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

/* ============================================================================
   TRANSITIONS
   ============================================================================ */

export const TRANSITIONS = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },

  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  common: {
    all: 'all 200ms ease',
    colors: 'color, background-color, border-color 200ms ease',
    transform: 'transform 200ms ease',
    shadow: 'box-shadow 200ms ease',
  },
} as const

/* ============================================================================
   BREAKPOINTS
   ============================================================================ */

export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/* ============================================================================
   Z-INDEX SCALE
   ============================================================================ */

export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const

/* ============================================================================
   COMPONENT DIMENSIONS
   ============================================================================ */

export const DIMENSIONS = {
  // Buttons
  buttonHeight: {
    sm: '2.25rem',  // 36px
    md: '2.75rem',  // 44px
    lg: '3rem',     // 48px
  },

  // Inputs
  inputHeight: '2.75rem', // 44px

  // Icon boxes
  iconBox: {
    sm: '2.5rem',  // 40px
    md: '3rem',    // 48px
    lg: '4rem',    // 64px
  },

  // Progress bar
  progressHeight: {
    sm: '0.25rem', // 4px
    md: '0.5rem',  // 8px
  },

  // Logo sizes
  logo: {
    sm: '3rem',    // 48px
    md: '5rem',    // 80px
    lg: '6.25rem', // 100px
    xl: '8rem',    // 128px
  },
} as const

/* ============================================================================
   CSS VARIABLE MAPPING
   
   Use these when you need to reference CSS variables in JS
   Prefer using Tailwind classes in JSX: bg-primary, text-text-primary, etc.
   ============================================================================ */

export const CSS_VARS = {
  // Colors
  primary: 'var(--color-primary)',
  primaryDark: 'var(--color-primary-dark)',
  primaryLight: 'var(--color-primary-light)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',

  // Semantic
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',

  // Text
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',

  // Backgrounds
  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  cream: 'var(--color-cream)',

  // Border
  border: 'var(--color-border)',

  // Gradients
  gradientPrimary: 'var(--gradient-primary)',

  // Shadows
  shadowPrimary: 'var(--shadow-primary)',
} as const

/* ============================================================================
   HELPER FUNCTIONS
   ============================================================================ */

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert hex color to RGBA string
 * @example hexToRgba('#FF7E33', 0.25) => 'rgba(255, 126, 51, 0.25)'
 */
export function hexToRgba(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
}

/**
 * Get primary shadow with custom opacity
 * Uses correct primary color RGB values (255, 126, 51)
 */
export function getPrimaryShadow(blur: number, spread: number, opacity: number): string {
  return `0 ${blur}px ${spread}px rgba(255, 126, 51, ${opacity})`
}

/**
 * Check if contrast ratio meets WCAG AA standard (4.5:1)
 */
export function hasGoodContrast(hex1: string, hex2: string): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const v = val / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05) >= 4.5
}

/* ============================================================================
   TAILWIND CLASS REFERENCE
   
   Use these Tailwind classes in JSX instead of hardcoded hex values:
   
   BACKGROUNDS:
   - bg-primary          → #FF7E33
   - bg-primary-dark     → #E86A1F
   - bg-primary-light    → #FFE8DB
   - bg-primary-lighter  → #FFF5EE
   - bg-secondary        → #2D2A26
   - bg-accent           → #FFD54F (achievements only)
   - bg-cream            → #FFFBF7
   - bg-success-light    → #DCFCE7
   - bg-error-light      → #FEE2E2
   - bg-warning-light    → #FEF3C7
   - bg-info-light       → #DBEAFE
   
   TEXT:
   - text-text-primary   → #2D2A26
   - text-text-secondary → #57534E
   - text-text-tertiary  → #78716C
   - text-primary        → #FF7E33
   - text-error          → #EF4444
   - text-success        → #22C55E
   
   BORDERS:
   - border-border       → #E8E4E0
   - border-primary      → #FF7E33
   - border-error        → #EF4444
   
   UTILITY CLASSES (from globals.css):
   - .btn-primary        → Primary gradient button
   - .btn-secondary      → Charcoal button
   - .btn-outline        → Primary border button
   - .card               → White card with shadow
   - .card-gradient      → Card with gradient border
   - .icon-box           → Primary-light icon container
   - .badge              → Primary badge
   - .badge-success      → Success status badge
   - .progress           → Progress bar track
   - .progress-bar       → Progress bar fill (gradient)
   - .alert-info         → Info alert box
   - .gradient-primary   → Primary gradient background
   ============================================================================ */

export default {
  COLORS,
  GRADIENTS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  TRANSITIONS,
  BREAKPOINTS,
  Z_INDEX,
  DIMENSIONS,
  CSS_VARS,
  hexToRgb,
  hexToRgba,
  getPrimaryShadow,
  hasGoodContrast,
}
