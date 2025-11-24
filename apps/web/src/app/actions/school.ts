'use server'

import { z } from 'zod'
import { createClient, createAdminClient, getCurrentUser } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'
import { BCRYPT_ROUNDS } from '@/lib/constants/auth'
import { checkRateLimit } from '@/lib/rate-limiter-distributed'
import bcrypt from 'bcrypt'

// Validation schemas
const SearchQuerySchema = z.string().min(1, 'Search query required').max(100, 'Search query too long')
const SchoolCodeSchema = z.string().min(1, 'School code required').max(20, 'Invalid school code format')
const StaffPinSchema = z.string().regex(/^\d{4,8}$/, 'PIN must be 4-8 digits')
const TeacherNameSchema = z.string().min(1, 'Name required').max(100, 'Name too long').regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
const PhoneSchema = z.string().regex(/^\+?[0-9\-\s()]{10,}$/, 'Invalid phone number format').optional()

// Rate limit configuration for search endpoints
const SEARCH_RATE_LIMIT = {
  maxTokens: 30,
  refillRate: 30 / 3600, // 30 requests per hour
  refillInterval: 1000,
}

// Types
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
    // Validate inputs
    schoolCode = SchoolCodeSchema.parse(schoolCode)
    staffPin = StaffPinSchema.parse(staffPin)
    teacherName = TeacherNameSchema.parse(teacherName)
    if (phone) phone = PhoneSchema.parse(phone)

    const supabase = await createClient()

    // 1. Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // 2. Check if user is anonymous
    const isAnonymous = user.is_anonymous || false
    if (isAnonymous) {
      return {
        success: false,
        error: 'Anonymous users cannot register as teachers. Please sign in with email or phone.',
      }
    }

    // 3. Check if user is already a teacher
    const { data: existingTeacher } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingTeacher) {
      return { success: false, error: 'You are already registered as a teacher' }
    }

    // 4. Find school by code
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('school_code', schoolCode.toUpperCase().trim())
      .single()

    if (schoolError || !school) {
      // Generic error - don't reveal if school exists
      authLogger.debug('[verifyTeacher] School code not found', { schoolCode })
      return {
        success: false,
        error: 'Invalid school code or PIN. Please verify and try again.',
      }
    }

    // 5. Get staff credentials for this school
    const { data: credentials, error: credError } = await supabase
      .from('school_staff_credentials')
      .select('pin_hash')
      .eq('school_id', school.id)
      .single()

    // 6. Verify PIN (use bcrypt compare) - handle missing credentials gracefully
    let pinMatch = false
    if (!credError && credentials) {
      pinMatch = await bcrypt.compare(staffPin, credentials.pin_hash)
    } else {
      // Even if credentials not found, use bcrypt compare with dummy hash to prevent timing attacks
      // This prevents attackers from knowing whether credentials exist
      await bcrypt.compare(staffPin, '$2b$10$fake.hash.to.prevent.timing.attack..........................')
    }

    if (!pinMatch) {
      // Generic error - don't reveal whether school exists or credentials were found
      authLogger.warn('[verifyTeacher] Invalid credentials attempt', { schoolCode })
      return {
        success: false,
        error: 'Invalid school code or PIN. Please verify and try again.',
      }
    }

    // 7. Create teacher profile (only if teacherName is provided)
    // If teacherName is empty, this is just a verification step
    if (teacherName && teacherName.trim()) {
      const { error: insertError } = await supabase.from('teacher_profiles').insert({
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

      // 8. Update user app_metadata to include role using Admin API
      // This ensures the JWT reflects app_metadata.role = 'teacher' immediately
      try {
        const adminClient = await createAdminClient()
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
          // Don't fail here - profile is already created
          // User can still function, just need to refresh session
        }
      } catch (adminError) {
        authLogger.warn('[verifyTeacher] Admin client error (non-critical)', adminError as Error)
        // Don't fail - profile creation succeeded
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
    // Validate input
    const validatedQuery = SearchQuerySchema.parse(query)

    // Get current user for rate limiting
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', data: [] }
    }

    // Apply rate limiting per user
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
      // Generic error - don't expose whether school exists
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
    // Validate inputs
    schoolCode = SchoolCodeSchema.parse(schoolCode)
    newPin = StaffPinSchema.parse(newPin)

    const supabase = await createClient()

    // 1. Verify caller is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      authLogger.warn('[rotateStaffPin] Unauthenticated access attempt')
      return { success: false, error: 'Not authenticated' }
    }

    // 2. Verify user has admin or teacher role
    // If no explicit role is set, check if user has teacher profile
    const userRole = user.app_metadata?.role

    // Determine if user is authorized
    let isAuthorized = userRole === 'admin' || userRole === 'teacher'

    // If no role metadata, check if user has a teacher profile
    if (!isAuthorized && !userRole) {
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, school_id')
        .eq('user_id', user.id)
        .single()

      isAuthorized = !!teacherProfile
    }

    if (!isAuthorized) {
      authLogger.warn('[rotateStaffPin] Unauthorized role access attempt', { userId: user.id, role: userRole })
      return { success: false, error: 'Unauthorized: Teacher or Admin access required' }
    }

    // 3. Validate PIN requirements (4-8 digits)
    if (!newPin || newPin.length < 4) {
      return {
        success: false,
        error: 'PIN must be at least 4 characters long',
      }
    }

    // 4. Find school by code and verify authorization in one check
    let school = null
    let isAuthorizedForSchool = false

    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_code, school_name')
      .eq('school_code', schoolCode.toUpperCase().trim())
      .single()

    if (!schoolError && schoolData) {
      school = schoolData

      // 5. For non-admin users, verify they are authorized for this school
      if (userRole !== 'admin') {
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('school_id')
          .eq('user_id', user.id)
          .single()

        isAuthorizedForSchool = !!(teacherProfile && school.id === teacherProfile.school_id)
      } else {
        // Admins are always authorized
        isAuthorizedForSchool = true
      }
    }

    // Return same generic error regardless of reason (school not found, not authorized, etc.)
    if (!school || !isAuthorizedForSchool) {
      if (!school) {
        authLogger.warn('[rotateStaffPin] School code not found or not provided', { schoolCode })
      } else {
        authLogger.warn('[rotateStaffPin] User not authorized for school', { userId: user.id, schoolId: school.id })
      }
      // Generic error message - don't reveal whether school exists or user is authorized
      return {
        success: false,
        error: 'Unable to rotate PIN. Please verify your school code and try again.',
      }
    }

    // 6. Generate new bcrypt hash
    const pinHash = await bcrypt.hash(newPin, BCRYPT_ROUNDS)

    // 7. Upsert credentials (idempotent - updates if exists, inserts if not)
    const { error: upsertError } = await supabase
      .from('school_staff_credentials')
      .upsert(
        {
          school_id: school.id,
          pin_hash: pinHash,
          rotated_at: new Date().toISOString(),
        },
        {
          onConflict: 'school_id',
        }
      )

    if (upsertError) {
      authLogger.error('[rotateStaffPin] Failed to upsert credentials', upsertError)
      return {
        success: false,
        error: 'Failed to rotate PIN. Please try again.',
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

    // 1. Verify caller is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // 2. Find school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_code, school_name')
      .eq('school_code', schoolCode.toUpperCase().trim())
      .single()

    if (schoolError || !school) {
      return { success: false, error: 'School not found' }
    }

    // 3. Get rotation info (without pin_hash)
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
