/**
 * Type definitions for authentication flows
 * Centralized types to replace `any` and provide proper type safety
 */

import { User } from '@supabase/supabase-js'

/**
 * OTP (One-Time Password) response data
 * Returned when OTP is successfully sent
 */
export interface OTPData {
  message: string
  requestId: string
}

/**
 * Result type for OTP request operations
 * Either successful (OTP sent) or failed with error
 */
export type RequestOtpResult =
  | {
      success: true
      data: OTPData
    }
  | {
      success: false
      error: string
      exists?: boolean
    }

/**
 * Result type for sign-in operations
 * Includes user data if successful, error message if failed
 */
export type SignInResult =
  | {
      success: true
      user: User
    }
  | {
      success: false
      error: string
      requiresProfileCheck?: boolean
    }

/**
 * Result type for password reset operations
 */
export type PasswordResetResult =
  | {
      success: true
      message: string
    }
  | {
      success: false
      error: string
    }

/**
 * Result type for teacher onboarding operations
 */
export type TeacherOnboardResult =
  | {
      success: true
      userId?: string
      profileId?: string
      message?: string
    }
  | {
      success: false
      error: string
    }

/**
 * Enhanced User type with app metadata
 * Extends Supabase User with custom application metadata
 */
export interface AuthenticatedUser extends User {
  app_metadata: {
    role?: 'student' | 'teacher' | 'admin'
    onboarded?: boolean
    [key: string]: any
  }
}

/**
 * Email check result from auth system
 */
export interface EmailCheckResult {
  exists: boolean
  role?: 'student' | 'teacher'
  userId?: string
}

/**
 * Teacher profile during onboarding
 */
export interface TeacherProfile {
  userId: string
  schoolId: string
  schoolCode: string
  name: string
  phone?: string
  subject?: string
  email: string
}

/**
 * Student profile during enrollment
 */
export interface StudentProfile {
  userId: string
  classId: string
  name: string
  email: string
}

/**
 * Generic API response wrapper
 * Used consistently across all API operations
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Authentication state for UI components
 */
export interface AuthState {
  user: AuthenticatedUser | null
  isLoading: boolean
  isAuthenticated: boolean
  role?: 'student' | 'teacher' | 'admin'
  error?: string
}

/**
 * Parameters for teacher verification during onboarding
 */
export interface VerifyTeacherParams {
  schoolCode: string
  staffPin: string
  teacherName: string
  phone?: string
  subject?: string
}

/**
 * Result type for teacher verification
 */
export type VerifyTeacherResult =
  | {
      success: true
      schoolId: string
      schoolName: string
    }
  | {
      success: false
      error: string
    }

/**
 * Generic operation result for class operations
 */
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Analytics data for a class
 */
export interface ClassAnalytics {
  activeThisWeek: number
  avgMinutesPerDay: number
  atRiskCount: number
}

/**
 * School details
 */
export interface School {
  id: string
  schoolCode: string
  schoolName: string
  district?: string
}
