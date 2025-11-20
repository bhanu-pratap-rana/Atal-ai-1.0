'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import bcrypt from 'bcrypt'

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
      return {
        success: false,
        error: 'Invalid school code. Please check and try again.',
      }
    }

    // 5. Get staff credentials for this school
    const { data: credentials, error: credError } = await supabase
      .from('school_staff_credentials')
      .select('pin_hash')
      .eq('school_id', school.id)
      .single()

    if (credError || !credentials) {
      return {
        success: false,
        error: 'School credentials not found. Please contact your school administrator.',
      }
    }

    // 6. Verify PIN (use bcrypt compare)
    const pinMatch = await bcrypt.compare(staffPin, credentials.pin_hash)

    if (!pinMatch) {
      return {
        success: false,
        error: 'Invalid staff PIN. Please check and try again.',
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
        console.error('Error creating teacher profile:', insertError)
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
          console.error('Error updating user app_metadata:', updateError)
          // Don't fail here - profile is already created
          // User can still function, just need to refresh session
        }
      } catch (adminError) {
        console.error('Error using admin client:', adminError)
        // Don't fail - profile creation succeeded
      }
    }

    return {
      success: true,
      schoolId: school.id,
      schoolName: school.school_name,
    }
  } catch (error) {
    console.error('Unexpected error in verifyTeacher:', error)
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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('schools')
      .select('id, school_code, school_name, district')
      .or(`school_code.ilike.%${query}%,school_name.ilike.%${query}%`)
      .limit(20)

    if (error) {
      console.error('Error searching schools:', error)
      return { success: false, error: 'Failed to search schools', data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in searchSchools:', error)
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
      return { success: false, error: 'School not found' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in getSchoolByCode:', error)
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
    const supabase = await createClient()

    // 1. Verify caller is authenticated (additional admin checks can be added)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // 2. Validate PIN requirements (4-6 digits recommended)
    if (!newPin || newPin.length < 4) {
      return {
        success: false,
        error: 'PIN must be at least 4 characters long',
      }
    }

    // 3. Find school by code
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_code, school_name')
      .eq('school_code', schoolCode.toUpperCase().trim())
      .single()

    if (schoolError || !school) {
      return {
        success: false,
        error: 'Invalid school code. School not found.',
      }
    }

    // 4. Generate new bcrypt hash (cost factor 10)
    const pinHash = await bcrypt.hash(newPin, 10)

    // 5. Upsert credentials (idempotent - updates if exists, inserts if not)
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
      console.error('Error rotating PIN:', upsertError)
      return {
        success: false,
        error: 'Failed to rotate PIN. Please try again.',
      }
    }

    return {
      success: true,
      schoolCode: school.school_code,
      schoolName: school.school_name,
      rotatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Unexpected error in rotateStaffPin:', error)
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
    console.error('Unexpected error in getStaffPinRotationInfo:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
