'use server'

import { z } from 'zod'
import { createClient, createAdminClient, getCurrentUser } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'
import { checkRateLimit } from '@/lib/rate-limiter-distributed'

const SearchQuerySchema = z
  .string()
  .min(1, 'Search query required')
  .max(100, 'Search query too long')
  .regex(/^[a-zA-Z0-9\s\-.']+$/, 'Search query contains invalid characters')
const SchoolCodeSchema = z.string().min(1, 'School code required').max(20, 'Invalid school code format')
const StaffPinSchema = z.string().regex(/^\d{4,8}$/, 'PIN must be 4-8 digits')
const TeacherNameSchema = z.string().min(1, 'Name required').max(100, 'Name too long').regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
const PhoneSchema = z.string().regex(/^\+?[0-9\-\s()]{10,}$/, 'Invalid phone number format').optional()

const SEARCH_RATE_LIMIT = {
  maxTokens: 30,
  refillRate: 30 / 3600, // 30 requests per hour
  refillInterval: 1000,
}

const VERIFY_TEACHER_RATE_LIMIT = {
  maxTokens: 5,
  refillRate: 5 / 3600, // 5 attempts per hour per IP
  refillInterval: 1000,
}

export interface VerifyTeacherParams {
  schoolCode: string
  staffPin: string
  teacherName: string
  phone?: string
  subject?: string
}

export interface VerifyTeacherResult {
  success: boolean
  error?: string
  schoolId?: string
  schoolName?: string
}

/**
 * Check if current user has admin access
 * Used for authorization on admin pages
 */
export async function checkAdminAuth() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { authorized: false, error: 'Not authenticated' }
    }

    const isAdmin = user.app_metadata?.role === 'admin'
    if (!isAdmin) {
      return { authorized: false, error: 'Admin access required' }
    }

    return { authorized: true }
  } catch (error) {
    authLogger.error('[checkAdminAuth] Unexpected error', error)
    return { authorized: false, error: 'Failed to verify authorization' }
  }
}

/**
 * Verify teacher credentials using School Code + Staff PIN
 * This elevates the authenticated user's role to 'teacher'
 */
export async function verifyTeacher({
  schoolCode,
  staffPin,
  teacherName,
  phone,
  subject,
}: VerifyTeacherParams): Promise<VerifyTeacherResult> {
  try {
    schoolCode = SchoolCodeSchema.parse(schoolCode)
    staffPin = StaffPinSchema.parse(staffPin)
    if (teacherName) {
      teacherName = TeacherNameSchema.parse(teacherName)
    }
    if (phone) phone = PhoneSchema.parse(phone)

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const isAllowed = await checkRateLimit(`verify-teacher:${user.id}`, VERIFY_TEACHER_RATE_LIMIT)
    if (!isAllowed) {
      authLogger.warn('[verifyTeacher] Rate limit exceeded for user', { userId: user.id })
      return {
        success: false,
        error: 'Too many verification attempts. Please wait an hour before trying again.',
      }
    }

    const isAnonymous = user.is_anonymous || false
    if (isAnonymous) {
      return {
        success: false,
        error: 'Anonymous users cannot register as teachers. Please sign in with email or phone.',
      }
    }

    // Use admin client for all database operations to bypass RLS restrictions
    const adminClient = await createAdminClient()

    // Check if user already has a teacher profile using admin client
    const { data: existingTeacher, error: existingTeacherError } = await adminClient
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingTeacherError) {
      authLogger.error('[verifyTeacher] Error checking existing teacher profile', existingTeacherError)
    }

    if (existingTeacher) {
      return { success: false, error: 'You are already registered as a teacher' }
    }

    // Get school by code using admin client
    const { data: school, error: schoolError } = await adminClient
      .from('schools')
      .select('id, school_code, school_name')
      .eq('school_code', schoolCode.toUpperCase().trim())
      .single()

    if (schoolError || !school) {
      authLogger.debug('[verifyTeacher] School code not found', { schoolCode, error: schoolError?.message })
      return {
        success: false,
        error: 'Invalid school code. Please verify and try again.',
      }
    }

    authLogger.debug('[verifyTeacher] School found', { schoolId: school.id, schoolName: school.school_name })

    // Verify staff PIN using the secure RPC function
    authLogger.debug('[verifyTeacher] Calling verify_staff_pin RPC', { schoolId: school.id, pinLength: staffPin.length })

    const { data: verifyResult, error: verifyError } = await adminClient.rpc('verify_staff_pin', {
      p_school_id: school.id,
      p_pin: staffPin,
    })

    authLogger.debug('[verifyTeacher] PIN verification RPC response', {
      hasData: !!verifyResult,
      dataLength: Array.isArray(verifyResult) ? verifyResult.length : 0,
      verifyResult: JSON.stringify(verifyResult),
      verifyError: verifyError ? { message: verifyError.message, code: verifyError.code, details: verifyError.details } : null,
      schoolId: school.id
    })

    // Handle RPC errors
    if (verifyError) {
      authLogger.error('[verifyTeacher] RPC error during PIN verification', {
        message: verifyError.message,
        code: verifyError.code,
        details: verifyError.details,
        hint: verifyError.hint
      })
      return {
        success: false,
        error: 'Unable to verify PIN. Please try again.',
      }
    }

    let pinMatch = false
    if (verifyResult && Array.isArray(verifyResult) && verifyResult.length > 0) {
      pinMatch = verifyResult[0].is_valid === true
      authLogger.debug('[verifyTeacher] PIN match result', { is_valid: verifyResult[0].is_valid, pinMatch })
    } else {
      authLogger.warn('[verifyTeacher] No PIN record found for school', { schoolId: school.id })
    }

    if (!pinMatch) {
      authLogger.warn('[verifyTeacher] Invalid PIN attempt', { schoolCode, schoolId: school.id, hasResult: !!verifyResult })
      return {
        success: false,
        error: 'Invalid PIN. Please verify and try again.',
      }
    }

    authLogger.info('[verifyTeacher] PIN verified successfully', { schoolId: school.id })

    if (teacherName && teacherName.trim()) {
      const { error: insertError } = await adminClient.from('teacher_profiles').insert({
        user_id: user.id,
        school_id: school.id,
        name: teacherName,
        phone,
        subject,
        school_code: school.school_code,
      })

      if (insertError) {
        authLogger.error('[verifyTeacher] Failed to create teacher profile', insertError)
        return {
          success: false,
          error: 'Failed to create teacher profile. Please try again.',
        }
      }

      // Update user app_metadata to include role using the already-initialized admin client
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        user.id,
        {
          app_metadata: {
            role: 'teacher',
            school_id: school.id,
            school_code: school.school_code,
          },
        }
      )

      if (updateError) {
        authLogger.warn('[verifyTeacher] Failed to update app_metadata (non-critical)', updateError)
      }
    }

    return {
      success: true,
      schoolId: school.id,
      schoolName: school.school_name,
    }
  } catch (error) {
    authLogger.error('[verifyTeacher] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Get all schools (for dropdown/search)
 */
export async function searchSchools(query: string) {
  try {
    const validatedQuery = SearchQuerySchema.parse(query)

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', data: [] }
    }

    const isAllowed = await checkRateLimit(`search-schools:${user.id}`, SEARCH_RATE_LIMIT)
    if (!isAllowed) {
      return { success: false, error: 'Too many search requests. Please wait a moment before trying again.', data: [] }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('schools')
      .select('id, school_code, school_name, district')
      .or(`school_code.ilike.%${validatedQuery}%,school_name.ilike.%${validatedQuery}%`)
      .limit(20)

    if (error) {
      authLogger.error('[searchSchools] Failed to search schools', error)
      return { success: false, error: 'Failed to search schools', data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    authLogger.error('[searchSchools] Unexpected error', error)
    return { success: false, error: 'An unexpected error occurred', data: [] }
  }
}

/**
 * Get school by code
 */
export async function getSchoolByCode(schoolCode: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('school_code', schoolCode.toUpperCase().trim())
      .single()

    if (error || !data) {
      authLogger.debug('[getSchoolByCode] School lookup failed', { schoolCode })
      return { success: false, error: 'Unable to find school. Please verify your school code and try again.' }
    }

    return { success: true, data }
  } catch (error) {
    authLogger.error('[getSchoolByCode] Unexpected error', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Rotate Staff PIN for a school (Admin only)
 * Generates new bcrypt hash and updates school_staff_credentials
 *
 * @param schoolCode - The school code (e.g., "14H0182")
 * @param newPin - The new staff PIN (will be hashed)
 * @returns Success status with rotation timestamp
 */
export async function rotateStaffPin(schoolCode: string, newPin: string) {
  try {
    schoolCode = SchoolCodeSchema.parse(schoolCode)
    newPin = StaffPinSchema.parse(newPin)

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      authLogger.warn('[rotateStaffPin] Unauthenticated access attempt')
      return { success: false, error: 'Not authenticated' }
    }

    const userRole = user.app_metadata?.role

    let isAuthorized = userRole === 'admin' || userRole === 'teacher'

    if (!isAuthorized && !userRole) {
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('user_id, school_id')
        .eq('user_id', user.id)
        .single()

      isAuthorized = !!teacherProfile
    }

    if (!isAuthorized) {
      authLogger.warn('[rotateStaffPin] Unauthorized role access attempt', { userId: user.id, role: userRole })
      return { success: false, error: 'Unauthorized: Teacher or Admin access required' }
    }

    if (!newPin || newPin.length < 4) {
      return {
        success: false,
        error: 'PIN must be at least 4 characters long',
      }
    }

    let school = null
    let isAuthorizedForSchool = false

    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_code, school_name')
      .eq('school_code', schoolCode.toUpperCase().trim())
      .single()

    if (!schoolError && schoolData) {
      school = schoolData

      if (userRole !== 'admin') {
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('school_id')
          .eq('user_id', user.id)
          .single()

        isAuthorizedForSchool = !!(teacherProfile && school.id === teacherProfile.school_id)
      } else {
        isAuthorizedForSchool = true
      }
    }

    if (!school || !isAuthorizedForSchool) {
      if (!school) {
        authLogger.warn('[rotateStaffPin] School code not found or not provided', { schoolCode })
      } else {
        authLogger.warn('[rotateStaffPin] User not authorized for school', { userId: user.id, schoolId: school.id })
      }
      return {
        success: false,
        error: 'Unable to rotate PIN. Please verify your school code and try again.',
      }
    }

    // Use admin client to call the secure rotate_staff_pin RPC function
    // The RLS policy only allows service_role to write to school_staff_credentials
    const adminClient = await createAdminClient()

    const { data: rotateResult, error: rotateError } = await adminClient.rpc('rotate_staff_pin', {
      p_school_id: school.id,
      p_new_pin: newPin,
    })

    if (rotateError) {
      authLogger.error('[rotateStaffPin] Failed to rotate PIN via RPC', rotateError)
      return {
        success: false,
        error: 'Failed to rotate PIN. Please try again.',
      }
    }

    // Check RPC result
    if (!rotateResult || !rotateResult[0]?.success) {
      const errorMsg = rotateResult?.[0]?.error_message || 'Failed to rotate PIN'
      authLogger.error('[rotateStaffPin] RPC rotation failed', { error: errorMsg })
      return {
        success: false,
        error: errorMsg,
      }
    }

    authLogger.success('[rotateStaffPin] PIN rotated successfully', { schoolId: school.id })
    return {
      success: true,
      schoolCode: school.school_code,
      schoolName: school.school_name,
      rotatedAt: new Date().toISOString(),
    }
  } catch (error) {
    authLogger.error('[rotateStaffPin] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Get PIN rotation history for a school (Admin only)
 * Returns when the PIN was last rotated
 *
 * @param schoolCode - The school code
 * @returns Rotation metadata (without exposing the hash)
 */
export async function getStaffPinRotationInfo(schoolCode: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_code, school_name')
      .eq('school_code', schoolCode.toUpperCase().trim())
      .single()

    if (schoolError || !school) {
      return { success: false, error: 'School not found' }
    }

    const { data: credentials, error: credError } = await supabase
      .from('school_staff_credentials')
      .select('rotated_at, created_at')
      .eq('school_id', school.id)
      .single()

    if (credError || !credentials) {
      return {
        success: true,
        schoolCode: school.school_code,
        schoolName: school.school_name,
        hasCredentials: false,
      }
    }

    return {
      success: true,
      schoolCode: school.school_code,
      schoolName: school.school_name,
      hasCredentials: true,
      createdAt: credentials.created_at,
      lastRotatedAt: credentials.rotated_at,
    }
  } catch (error) {
    authLogger.error('[getStaffPinRotationInfo] Unexpected error', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create admin user account (Admin only)
 * Creates a new Supabase auth user and sets app_metadata.role to 'admin'
 *
 * @param email - Admin email address
 * @param password - Admin password (will be hashed by Supabase)
 * @returns Success status with created user ID
 */
export async function createAdminUser(email: string, password: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase()

    const EmailSchema = z.string().email().max(255, 'Email too long')
    const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long')

    const validatedEmail = EmailSchema.parse(trimmedEmail)
    const validatedPassword = PasswordSchema.parse(password)

    const user = await getCurrentUser()
    if (!user) {
      authLogger.warn('[createAdminUser] Unauthenticated access attempt')
      return { success: false, error: 'Not authenticated' }
    }

    const isAdmin = user.app_metadata?.role === 'admin'
    if (!isAdmin) {
      authLogger.warn('[createAdminUser] Non-admin user attempted to create admin', { userId: user.id })
      return { success: false, error: 'Admin access required to create admin users' }
    }

    const adminClient = await createAdminClient()

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: validatedEmail,
      password: validatedPassword,
      email_confirm: true, // Auto-confirm email to skip OTP
      app_metadata: {
        role: 'admin',
      },
    })

    if (createError || !newUser) {
      authLogger.error('[createAdminUser] Failed to create admin user', createError)
      return {
        success: false,
        error: 'Failed to create admin user. Email may already be registered.',
      }
    }

    authLogger.success('[createAdminUser] Admin user created successfully', {
      userId: newUser.user.id,
      email: validatedEmail,
    })

    return {
      success: true,
      userId: newUser.user.id,
      email: validatedEmail,
      message: 'Admin user created successfully',
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      authLogger.warn('[createAdminUser] Validation error', { path: firstIssue?.path, message: firstIssue?.message })
      return {
        success: false,
        error: firstIssue?.message || 'Invalid input',
      }
    }
    authLogger.error('[createAdminUser] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
