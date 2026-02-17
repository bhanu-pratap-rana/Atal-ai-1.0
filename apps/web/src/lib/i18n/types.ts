/**
 * Unified Language System - Type Definitions
 *
 * This module defines the types for the internationalization system.
 * Supports English, Hindi, and Assamese languages.
 */

/** Supported languages in the application */
export type SupportedLanguage = "en" | "hi" | "as";

/** Language metadata for display */
export interface LanguageInfo {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

/** All supported languages with their display info */
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी", flag: "🇮🇳" },
  { code: "as", label: "Assamese", nativeLabel: "অসমীয়া", flag: "🏔️" },
];

/** Default language for the application */
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/** LocalStorage key for persisting language preference */
export const LANGUAGE_STORAGE_KEY = "atal-app-language";

/**
 * Values that can be interpolated into translation strings
 * Example: t("welcome", { name: "John" }) → "Welcome, John!"
 */
export interface InterpolationValues {
  [key: string]: string | number;
}

/**
 * Translation function type
 * @param key - Dot-notation key like "common.loading" or "dashboard.welcome"
 * @param values - Optional interpolation values
 * @returns Translated string
 */
export type TranslationFunction = (
  key: string,
  values?: InterpolationValues
) => string;

/**
 * Language context value provided to components
 */
export interface LanguageContextValue {
  /** Current active language */
  language: SupportedLanguage;
  /** Function to change the language */
  setLanguage: (lang: SupportedLanguage) => void;
  /** Translation function */
  t: TranslationFunction;
  /** Whether translations are still loading */
  isLoading: boolean;
}

/**
 * Structure of a translation file (e.g., en.json)
 * Organized by feature/namespace for maintainability
 */
export interface TranslationFile {
  common: CommonTranslations;
  nav: NavTranslations;
  dashboard: DashboardTranslations;
  learn: LearnTranslations;
  gamification: GamificationTranslations;
  auth: AuthTranslations;
  offline: OfflineTranslations;
  errors: ErrorTranslations;
}

// ============================================
// Namespace-specific translation interfaces
// ============================================

export interface CommonTranslations {
  loading: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  close: string;
  back: string;
  next: string;
  submit: string;
  confirm: string;
  retry: string;
  signOut: string;
  settings: string;
  profile: string;
  help: string;
  search: string;
  noResults: string;
  seeAll: string;
  viewMore: string;
  done: string;
  continue: string;
  start: string;
  complete: string;
  pending: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface NavTranslations {
  dashboard: string;
  learn: string;
  classes: string;
  assessments: string;
  profile: string;
  backToDashboard: string;
  backToLearningPath: string;
}

export interface DashboardTranslations {
  welcome: string;
  welcomeTeacher: string;
  welcomeStudent: string;
  welcomeAdmin: string;
  createClass: string;
  joinClass: string;
  classesCreated: string;
  classesJoined: string;
  assessments: string;
  avgScore: string;
  dayStreak: string;
  quickActions: string;
  recentActivity: string;
  noClasses: string;
  getStartedTeacher: string;
  getStartedStudent: string;
  createFirstClass: string;
  startAssessment: string;
  yourBadges: string;
  points: string;
  leaderboard: string;
}

export interface LearnTranslations {
  yourPath: string;
  masterDigitalLiteracy: string;
  overallProgress: string;
  totalPoints: string;
  dayStreak: string;
  topicsCompleted: string;
  remaining: string;
  aiRecommendations: string;
  basedOnProgress: string;
  startModule: string;
  continueModule: string;
  reviewModule: string;
  completeToUnlock: string;
  topics: string;
  units: string;
  complete: string;
  avg: string;
  downloadAll: string;
  download: string;
  downloaded: string;
  downloading: string;
  downloadComplete: string;
  downloadFailed: string;
  offline: string;
  offlineAvailable: string;
  needHelp: string;
  askAiTutor: string;
  chatWithTutor: string;
  inProgress: string;
  notStarted: string;
  mastered: string;
  minutes: string;
  selectLanguage: string;
  downloadForOffline: string;
  lessonWillBeGenerated: string;
  storageFull: string;
  deleteOldLessons: string;
}

export interface GamificationTranslations {
  earned: string;
  locked: string;
  points: string;
  totalPoints: string;
  badgeEarned: string;
  viewAllBadges: string;
  noBadgesYet: string;
  keepLearning: string;
  streak: string;
  dayStreak: string;
  streakLost: string;
  newRecord: string;
  levelUp: string;
  achievement: string;
  progress: string;
}

export interface AuthTranslations {
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  verificationCode: string;
  sendCode: string;
  verifyAndContinue: string;
  signingIn: string;
  creatingAccount: string;
  invalidCredentials: string;
  emailInUse: string;
  phoneInUse: string;
  weakPassword: string;
  passwordMismatch: string;
  teacherLogin: string;
  studentLogin: string;
  quickStart: string;
  chooseMethod: string;
}

export interface OfflineTranslations {
  offline: string;
  online: string;
  slowConnection: string;
  changesWillSync: string;
  syncing: string;
  syncComplete: string;
  syncFailed: string;
  tapToRetry: string;
  pendingChanges: string;
  backOnline: string;
  offlineMode: string;
  downloadedContent: string;
  storageUsed: string;
  clearStorage: string;
  manageDownloads: string;
}

export interface ErrorTranslations {
  somethingWentWrong: string;
  tryAgain: string;
  pageNotFound: string;
  unauthorized: string;
  sessionExpired: string;
  networkError: string;
  serverError: string;
  validationError: string;
  requiredField: string;
  invalidEmail: string;
  invalidPhone: string;
  tooShort: string;
  tooLong: string;
  moduleNotFound: string;
  lessonNotFound: string;
  loadingFailed: string;
}
