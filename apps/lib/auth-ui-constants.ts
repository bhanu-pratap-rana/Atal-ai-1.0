/**
 * Shared UI styling constants for authentication components
 * Ensures consistency across all auth-related pages and flows
 */

// Button styling classes
export const BUTTON_BASE_CLASSES = 'w-full text-[17px]'
export const BUTTON_SHADOW =
  'shadow-[0_8px_20px_rgba(255,140,66,0.35)]'
export const BUTTON_HOVER_SHADOW =
  'hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)]'
export const BUTTON_CLASSES = `${BUTTON_BASE_CLASSES} ${BUTTON_SHADOW} ${BUTTON_HOVER_SHADOW} hover:-translate-y-0.5`

// Text styling classes
export const HELP_TEXT_CLASSES = 'text-xs text-text-secondary'
export const ERROR_TEXT_CLASSES = 'text-sm text-red-600'
export const SECONDARY_TEXT_CLASSES = 'text-sm text-text-secondary'

// Form styling classes
export const FORM_GROUP_CLASSES = 'space-y-4'
export const FORM_SECTION_CLASSES = 'space-y-6'

// Input styling classes
export const OTP_INPUT_CLASSES = 'text-center text-2xl font-mono tracking-widest'
export const CLASS_CODE_INPUT_CLASSES =
  'uppercase font-mono text-center text-xl tracking-widest'
export const PIN_INPUT_CLASSES = 'text-center text-2xl font-mono tracking-widest'

// Card styling classes
export const AUTH_CARD_CONTAINER_CLASSES = 'min-h-screen flex items-center justify-center'
export const AUTH_CARD_PADDING_CLASSES = 'p-6'

// Info box styling (use InfoBox component instead of raw classes)
export const INFO_BOX_PADDING = 'p-3'
export const INFO_BOX_BORDER = 'border-l-4'
export const INFO_BOX_ROUNDED = 'rounded'

// Form button groups
export const FORM_BUTTON_GROUP_CLASSES = 'space-y-3'

// Link styling
export const AUTH_LINK_CLASSES =
  'text-sm text-primary font-medium hover:underline transition-colors'

// Modal/Dialog styling
export const MODAL_OVERLAY_CLASSES = 'fixed inset-0 bg-black/50'
export const MODAL_CONTENT_CLASSES =
  'bg-white rounded-lg shadow-lg p-6 max-w-md w-full'

// Loading spinner classes
export const SPINNER_CLASSES = 'w-5 h-5 animate-spin'
