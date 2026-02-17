/**
 * Hooks - Export all custom React hooks
 */

// Auth State Management
export {
  useAuthState,
  type AuthState,
  type AuthActions,
  type AuthStep,
  type SignInTab,
  type SignUpTab,
  type PhoneOtpStep,
} from "./useAuthState";

// Network Status
export {
  useNetworkStatus,
  hasNetworkInformation,
  type NetworkStatus,
  type ConnectionType,
} from "./useNetworkStatus";

// Offline Sync
export { useOfflineSync } from "./useOfflineSync";

// Input Hooks
export { useOTPInput, type UseOTPInputReturn } from "./useOTPInput";
export { usePhoneInput, type UsePhoneInputReturn } from "./usePhoneInput";

// Form State Management
export {
  useFormHandler,
  type MessageType,
  type FormMessage,
  type UseFormHandlerReturn,
} from "./useFormHandler";

// Admin Management
export { useAdminManagement } from "./useAdminManagement";

// Auth Requirement
export { useRequireAuth } from "./useRequireAuth";

// Timer
export { useTimer, type UseTimerOptions } from "./useTimer";

// PIN Management
export { usePINManagement } from "./usePINManagement";

// Teacher Onboarding
export {
  useTeacherOnboarding,
  type TeacherOnboardingState,
} from "./useTeacherOnboarding";

// Dynamic Lesson
export { useDynamicLesson } from "./useDynamicLesson";

// Conversational Voice
export { useConversationalVoice } from "./useConversationalVoice";

// Toast
export { useToast } from "./use-toast";

// Offline Lesson
export { useOfflineLesson } from "./useOfflineLesson";

// PWA Installation
export { usePWAInstall, type UsePWAInstallReturn } from "./usePWAInstall";
