/**
 * Design Token System for ATAL AI
 * Centralized color, gradient, and spacing tokens
 *
 * This module provides a single source of truth for all design tokens
 * used throughout the application. It ensures consistency and makes
 * it easy to update the visual design across the entire codebase.
 */

/* ============================================================================
   Color Palette
   ============================================================================ */

export const COLORS = {
  // Brand Colors - Orange-Yellow Theme
  primary: '#FF8C42',
  primaryLight: '#FFD166',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8F9FA',

  // Text Colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#E8E8E8',
  borderLight: '#DDDDDD',

  // Semantic Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Chart/Visualization Colors
  chart1: '#FF8C42',
  chart2: '#FFD166',
  chart3: '#06B6D4',
  chart4: '#8B5CF6',
  chart5: '#EC4899',

  // Accent Colors
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A360F',
    900: '#7C2D12',
  },

  yellow: {
    50: '#FEFCE8',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#145231',
  },

  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Dark mode support
  dark: {
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#ededed',
  },
} as const

/* ============================================================================
   Gradient Definitions
   ============================================================================ */

export const GRADIENTS = {
  // Primary gradient
  primary: 'linear-gradient(135deg, #FF8C42 0%, #FFD166 100%)',

  // Directional gradients
  primaryToBR: 'linear-gradient(to bottom right, #FF8C42, #FFD166)',
  primaryToR: 'linear-gradient(to right, #FF8C42, #FFD166)',
  primaryToB: 'linear-gradient(to bottom, #FF8C42, #FFD166)',

  // Semantic gradients
  successGradient: 'linear-gradient(135deg, #10B981 0%, #D1FAE5 100%)',
  errorGradient: 'linear-gradient(135deg, #EF4444 0%, #FEE2E2 100%)',
  warningGradient: 'linear-gradient(135deg, #F59E0B 0%, #FEF3C7 100%)',
  infoGradient: 'linear-gradient(135deg, #3B82F6 0%, #DBEAFE 100%)',

  // Multi-color gradients for visualizations
  rainbow: 'linear-gradient(90deg, #FF8C42, #FFD166, #10B981, #3B82F6, #8B5CF6, #EC4899)',
  sunset: 'linear-gradient(135deg, #FF8C42 0%, #F59E0B 50%, #EF4444 100%)',
  ocean: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #1E40AF 100%)',
} as const

/* ============================================================================
   Shadow Definitions
   ============================================================================ */

export const SHADOWS = {
  // Size-based shadows with orange tint
  sm: '0 1px 2px rgba(255, 140, 66, 0.15)',
  md: '0 4px 12px rgba(255, 140, 66, 0.2)',
  lg: '0 8px 20px rgba(255, 140, 66, 0.35)',
  xl: '0 12px 28px rgba(255, 140, 66, 0.45)',

  // Additional shadow variations
  none: 'none',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',

  // Semantic shadows
  elevation1: '0 1px 3px rgba(0, 0, 0, 0.1)',
  elevation2: '0 4px 6px rgba(0, 0, 0, 0.1)',
  elevation3: '0 10px 15px rgba(0, 0, 0, 0.1)',
  elevation4: '0 20px 25px rgba(0, 0, 0, 0.1)',
} as const

/* ============================================================================
   Spacing Scale
   ============================================================================ */

export const SPACING = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
} as const

/* ============================================================================
   Typography Scale
   ============================================================================ */

export const TYPOGRAPHY = {
  // Font families
  fontSans: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
  fontMono: 'var(--font-geist-mono), monospace',
  fontDevanagari: 'var(--font-devanagari), system-ui, -apple-system, sans-serif',
  fontBengali: 'var(--font-bengali), system-ui, -apple-system, sans-serif',

  // Font sizes
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
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
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

/* ============================================================================
   Border Radius Scale
   ============================================================================ */

export const BORDER_RADIUS = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const

/* ============================================================================
   Transitions
   ============================================================================ */

export const TRANSITIONS = {
  // Duration
  duration: {
    fastest: '75ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Common transitions
  common: {
    all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    color: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'background 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

/* ============================================================================
   Breakpoints
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
   Z-Index Scale
   ============================================================================ */

export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  notification: 1600,
  max: 1700,
} as const

/* ============================================================================
   Theme Presets
   ============================================================================ */

export const THEME = {
  light: {
    colors: COLORS,
    gradients: GRADIENTS,
    shadows: SHADOWS,
  },
  dark: {
    colors: {
      ...COLORS,
      background: COLORS.dark.background,
      surface: COLORS.dark.surface,
      textPrimary: COLORS.dark.text,
    },
    gradients: GRADIENTS,
    shadows: SHADOWS,
  },
} as const

/* ============================================================================
   CSS Custom Properties (for CSS-in-JS usage)
   ============================================================================ */

export const getCSSVariables = (theme: 'light' | 'dark' = 'light') => {
  const colors = theme === 'light' ? COLORS : { ...COLORS, ...COLORS.dark }

  return {
    '--primary': colors.primary,
    '--primary-light': colors.primaryLight,
    '--background': colors.background,
    '--surface': colors.surface,
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--text-tertiary': colors.textTertiary,
    '--text-on-primary': colors.textOnPrimary,
    '--border': colors.border,
    '--border-light': colors.borderLight,
    '--gradient-primary': GRADIENTS.primary,
  } as const
}

/* ============================================================================
   Helper Functions
   ============================================================================ */

/**
 * Convert hex color to RGB values
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
 * Convert hex color to RGBA with opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
}

/**
 * Get contrast ratio for accessibility (WCAG)
 * Returns true if contrast is sufficient for AA standard
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
  THEME,
  getCSSVariables,
  hexToRgb,
  hexToRgba,
  hasGoodContrast,
}
