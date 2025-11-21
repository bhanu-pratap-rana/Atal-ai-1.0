/**
 * Responsive Design System for ATAL AI PWA
 * Provides unified approach for mobile-first responsive design
 * Supports: Mobile (320px+), Tablet (768px+), Laptop (1024px+)
 */

/**
 * Breakpoint definitions aligned with Tailwind CSS
 * Used for media queries and responsive logic
 */
export const BREAKPOINTS = {
  // Mobile first approach
  xs: 320,      // Extra small phones
  sm: 640,      // Small phones/phablets
  md: 768,      // Tablets (portrait)
  lg: 1024,     // Tablets (landscape) / Laptops
  xl: 1280,     // Desktop
  '2xl': 1536,  // Large desktop
} as const

/**
 * Screen size categories for conditional rendering
 */
export type ScreenSize = 'mobile' | 'tablet' | 'desktop'

/**
 * Responsive spacing scale (matches Tailwind)
 * Used for consistent padding/margins across device sizes
 */
export const RESPONSIVE_SPACING = {
  // Mobile-first: smallest first, scale up
  mobile: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  tablet: {
    xs: '0.75rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '2.5rem',
  },
  desktop: {
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '2.5rem',
    xl: '3rem',
  },
} as const

/**
 * Responsive font sizes for consistent typography
 * Use these for heading and body text across devices
 */
export const RESPONSIVE_FONT_SIZES = {
  // Headings
  h1: {
    mobile: 'text-2xl',    // 24px
    tablet: 'text-3xl',    // 30px
    desktop: 'text-4xl',   // 36px
  },
  h2: {
    mobile: 'text-xl',     // 20px
    tablet: 'text-2xl',    // 24px
    desktop: 'text-3xl',   // 30px
  },
  h3: {
    mobile: 'text-lg',     // 18px
    tablet: 'text-xl',     // 20px
    desktop: 'text-2xl',   // 24px
  },
  // Body text
  body: {
    mobile: 'text-sm',     // 14px
    tablet: 'text-base',   // 16px
    desktop: 'text-base',  // 16px
  },
  // Small text
  small: {
    mobile: 'text-xs',     // 12px
    tablet: 'text-sm',     // 14px
    desktop: 'text-sm',    // 14px
  },
} as const

/**
 * Responsive width classes for cards and containers
 */
export const RESPONSIVE_WIDTHS = {
  // Mobile: full width with padding
  mobile: 'w-full px-4',
  // Tablet: constrained width
  tablet: 'max-w-md',
  // Desktop: standard card width
  desktop: 'max-w-lg',
} as const

/**
 * Card and container responsive classes
 * Use for AuthCard, forms, and main content areas
 */
export const RESPONSIVE_CARD = {
  // Padding: increases on larger screens
  padding: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
  },
  // Gap/spacing inside cards
  gap: {
    mobile: 'space-y-3',
    tablet: 'space-y-4',
    desktop: 'space-y-5',
  },
  // Border radius: subtle on mobile, pronounced on desktop
  radius: {
    mobile: 'rounded-lg',
    tablet: 'rounded-xl',
    desktop: 'rounded-2xl',
  },
} as const

/**
 * Responsive input/button sizing
 */
export const RESPONSIVE_INPUT = {
  padding: {
    mobile: 'px-3 py-2.5',      // Easier to tap on mobile
    tablet: 'px-4 py-3',
    desktop: 'px-4 py-3',
  },
  height: {
    mobile: 'h-11',              // 44px minimum for touch targets
    tablet: 'h-12',              // 48px
    desktop: 'h-10',             // 40px
  },
} as const

/**
 * Responsive grid/layout columns
 */
export const RESPONSIVE_GRID = {
  // Number of columns per screen size
  cols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  // Gap between items
  gap: {
    mobile: 'gap-3',
    tablet: 'gap-4',
    desktop: 'gap-6',
  },
} as const

/**
 * Tailwind CSS classes for responsive design
 * These follow mobile-first approach (sm: applies from 640px up)
 */
export const RESPONSIVE_CLASSES = {
  // Full-width container with padding on mobile
  container: 'w-full sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto',

  // Card-like container
  card: 'rounded-lg sm:rounded-xl md:rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 md:p-8',

  // Form container
  formContainer: 'space-y-3 sm:space-y-4 md:space-y-5',

  // Button sizing
  buttonPrimary: 'w-full px-4 py-2.5 sm:py-3 md:py-3 rounded-lg text-sm sm:text-base',

  // Input sizing
  inputField: 'w-full px-3 py-2.5 sm:px-4 sm:py-3 md:py-3 rounded-lg text-sm sm:text-base border border-gray-300',

  // Grid layout
  gridResponsive: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6',

  // Flexbox with responsive wrapping
  flexResponsive: 'flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6',

  // Text responsiveness
  textResponsive: 'text-sm sm:text-base md:text-lg',

  // Spacing utilities
  marginResponsive: 'mb-3 sm:mb-4 md:mb-6',
  paddingResponsive: 'px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6',
} as const

/**
 * Get responsive class based on current screen size
 * Usage: className={getResponsiveClass('padding')}
 * Returns appropriate Tailwind classes for mobile-first approach
 */
export function getResponsiveClass(property: keyof typeof RESPONSIVE_CLASSES): string {
  return RESPONSIVE_CLASSES[property]
}

/**
 * Responsive image sizing
 * Use for profile pictures, logos, etc.
 */
export const RESPONSIVE_IMAGE = {
  // Avatar sizes
  avatar: {
    mobile: 'w-12 h-12',
    tablet: 'w-14 h-14',
    desktop: 'w-16 h-16',
  },
  // Hero/banner images
  hero: {
    mobile: 'h-32',
    tablet: 'h-48',
    desktop: 'h-64',
  },
} as const

/**
 * Hook to get current screen size (for JavaScript-based logic)
 * @returns Current screen size category
 * Usage: const screen = useScreenSize()
 */
export function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.md) return 'mobile'
  if (width < BREAKPOINTS.lg) return 'tablet'
  return 'desktop'
}

/**
 * Mobile-first Tailwind utility classes for common patterns
 * These classes use sm:, md:, lg: modifiers for responsive behavior
 */
export const RESPONSIVE_PATTERNS = {
  // Standard auth form container
  authForm: `
    w-full
    sm:max-w-sm
    md:max-w-md
    lg:max-w-lg
    space-y-4
    sm:space-y-5
    md:space-y-6
  `.trim(),

  // Standard button with proper touch targets
  button: `
    w-full
    px-4
    py-2.5
    sm:py-3
    rounded-lg
    font-medium
    text-sm
    sm:text-base
    transition-all
    hover:shadow-lg
  `.trim(),

  // Standard input field
  input: `
    w-full
    px-3
    py-2.5
    sm:py-3
    rounded-lg
    text-sm
    sm:text-base
    border
    border-gray-300
    focus:outline-none
    focus:ring-2
    focus:ring-primary
  `.trim(),

  // Standard card
  card: `
    rounded-lg
    sm:rounded-xl
    md:rounded-2xl
    bg-white
    border
    border-gray-200
    p-4
    sm:p-6
    md:p-8
    space-y-3
    sm:space-y-4
    md:space-y-5
  `.trim(),

  // Tab buttons for mobile-first
  tabButton: `
    flex-1
    py-2
    px-3
    sm:px-4
    rounded-lg
    font-medium
    text-xs
    sm:text-sm
    transition-colors
  `.trim(),

  // Error/success message
  message: `
    p-3
    sm:p-4
    rounded-lg
    text-xs
    sm:text-sm
    border-l-4
  `.trim(),
} as const

/**
 * Responsive modal/dialog sizing
 */
export const RESPONSIVE_MODAL = {
  width: {
    mobile: 'max-w-[calc(100%-2rem)]',  // Full width with 1rem margins
    tablet: 'max-w-md',
    desktop: 'max-w-lg',
  },
  padding: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
  },
} as const
