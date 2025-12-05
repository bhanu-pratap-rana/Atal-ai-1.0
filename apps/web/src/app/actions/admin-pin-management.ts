'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

export interface SchoolPINInfo {
  schoolId: string
  schoolName: string
  schoolCode: string
  districtName: string
  currentPin: string
  lastRotatedAt: string | null
  createdAt: string
  pinHistory?: PinHistoryEntry[]
}

export interface PinHistoryEntry {
  rotatedAt: string
  rotatedBy?: string
}

export interface AdminPINActionResult {
  success: boolean
  message?: string
  error?: string
  data?: unknown
}

/** School list item returned by getAllSchoolsWithPINs */
export interface SchoolListItem {
  schoolId: string
  schoolName: string
  schoolCode: string
  districtName: string
  hasPIN: boolean
  lastRotatedAt: string | null
  createdAt: string
}

/** PIN statistics returned by getPINStatistics */
export interface PINStatistics {
  totalSchools: number
  schoolsWithPINs: number
  schoolsWithoutPINs: number
}

/** Database row types for type safety */
interface SchoolRow {
  id: string
  school_name: string
  school_code: string | null
  district: string | null
}

interface PINCredentialRow {
  school_id: string
  created_at: string
  rotated_at: string | null
}

/**
 * Search schools by name
 */
export async function searchSchools(searchQuery: string): Promise<AdminPINActionResult> {
  try {
    if (!searchQuery.trim()) {
      return {
        success: false,
        error: 'Please enter a school name to search',
      }
    }

    const supabase = await createClient()
    const normalizedQuery = `%${searchQuery.toLowerCase()}%`

    const { data, error } = await supabase
      .from('schools')
      .select(`
        id,
        school_name,
        school_code,
        district
      `)
      .ilike('school_name', normalizedQuery)
      .limit(20)

    if (error) {
      authLogger.error('[searchSchools] Failed to search schools', error)
      return {
        success: false,
        error: 'Failed to search schools',
      }
    }

    const results = (data || []).map((row: SchoolRow) => ({
      schoolId: row.id,
      schoolName: row.school_name,
      schoolCode: row.school_code || 'N/A',
      districtName: row.district || 'Unknown District',
    }))

    authLogger.info('[searchSchools] Search completed', { query: searchQuery, resultCount: results.length })
    return {
      success: true,
      data: results,
    }
  } catch (error) {
    authLogger.error('[searchSchools] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get school PIN information (if exists)
 */
export async function getSchoolPINInfo(schoolId: string): Promise<AdminPINActionResult> {
  try {
    if (!schoolId) {
      return {
        success: false,
        error: 'School ID is required',
      }
    }

    const supabase = await createClient()
    // Use admin client for school_staff_credentials (RLS restricts to service_role only)
    const adminClient = await createAdminClient()

    // Get school info
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select(`
        id,
        school_name,
        school_code,
        district
      `)
      .eq('id', schoolId)
      .single()

    if (schoolError) {
      authLogger.error('[getSchoolPINInfo] School not found', schoolError)
      return {
        success: false,
        error: 'School not found',
      }
    }

    // Get PIN info from school_staff_credentials (requires service_role to access)
    const { data: pinData } = await adminClient
      .from('school_staff_credentials')
      .select('created_at, rotated_at, updated_at')
      .eq('school_id', schoolId)
      .single()

    // Build PIN history from rotated_at timestamps
    const pinHistory: PinHistoryEntry[] = []
    if (pinData?.rotated_at) {
      pinHistory.push({ rotatedAt: pinData.rotated_at })
    }
    if (pinData?.created_at && pinData.created_at !== pinData.rotated_at) {
      pinHistory.push({ rotatedAt: pinData.created_at })
    }

    // PIN may not exist yet, that's ok
    const pinInfo: SchoolPINInfo = {
      schoolId: schoolData.id,
      schoolName: schoolData.school_name,
      schoolCode: schoolData.school_code || 'N/A',
      districtName: schoolData.district || 'Unknown District',
      currentPin: 'Hidden (only shown after rotation)',
      lastRotatedAt: pinData?.rotated_at || null,
      createdAt: pinData?.created_at || new Date().toISOString(),
      pinHistory: pinHistory.length > 0 ? pinHistory : undefined,
    }

    return {
      success: true,
      data: pinInfo,
    }
  } catch (error) {
    authLogger.error('[getSchoolPINInfo] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Rotate school PIN - generates new PIN or uses provided PIN
 */
export async function rotateSchoolPIN(schoolId: string, customPIN?: string): Promise<AdminPINActionResult> {
  try {
    if (!schoolId) {
      return {
        success: false,
        error: 'School ID is required',
      }
    }

    // Validate custom PIN if provided
    if (customPIN) {
      if (!/^\d{4,6}$/.test(customPIN)) {
        return {
          success: false,
          error: 'PIN must be 4-6 digits',
        }
      }
    }

    // Use admin client with service_role to call the RPC function
    // The rotate_staff_pin function requires service_role to execute
    const supabase = await createAdminClient()

    // Use custom PIN or generate new PIN (4-digit random)
    const newPIN = customPIN || Math.floor(1000 + Math.random() * 9000).toString()

    // Call the rotate_staff_pin function via RPC
    const { data, error } = await supabase.rpc('rotate_staff_pin', {
      p_school_id: schoolId,
      p_new_pin: newPIN,
    })

    if (error) {
      authLogger.error('[rotateSchoolPIN] Failed to rotate PIN', error)
      return {
        success: false,
        error: error.message || 'Failed to rotate PIN',
      }
    }

    // Check if function returned success
    if (!data || !data[0]?.success) {
      const errorMsg = data?.[0]?.error_message || 'Failed to rotate PIN'
      authLogger.error('[rotateSchoolPIN] PIN rotation failed', { error: errorMsg })
      return {
        success: false,
        error: errorMsg,
      }
    }

    authLogger.success('[rotateSchoolPIN] PIN rotated successfully', { schoolId, newPIN: '****' })
    return {
      success: true,
      message: `PIN rotated successfully! New PIN: ${newPIN}`,
      data: { newPIN },
    }
  } catch (error) {
    authLogger.error('[rotateSchoolPIN] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred while rotating PIN',
    }
  }
}

/**
 * Get all schools with PIN information
 */
export async function getAllSchoolsWithPINs(): Promise<AdminPINActionResult> {
  try {
    const supabase = await createClient()
    // Use admin client for school_staff_credentials (RLS restricts to service_role only)
    const adminClient = await createAdminClient()

    // Get all schools
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select(`
        id,
        school_name,
        school_code,
        district
      `)
      .order('school_name')

    if (schoolError) {
      authLogger.error('[getAllSchoolsWithPINs] Failed to fetch schools', schoolError)
      return {
        success: false,
        error: 'Failed to fetch schools',
      }
    }

    // Get all PIN records (requires service_role to access)
    const { data: pins } = await adminClient
      .from('school_staff_credentials')
      .select('school_id, created_at, rotated_at')

    // Map PIN data by school ID
    const pinMap = new Map((pins || []).map((p: PINCredentialRow) => [p.school_id, p]))

    // Build result
    const schoolsWithPINs = (schools || []).map((school: SchoolRow) => {
      const pinInfo = pinMap.get(school.id)
      return {
        schoolId: school.id,
        schoolName: school.school_name,
        schoolCode: school.school_code || 'N/A',
        districtName: school.district || 'Unknown District',
        hasPIN: !!pinInfo,
        lastRotatedAt: pinInfo?.rotated_at || null,
        createdAt: pinInfo?.created_at || new Date().toISOString(),
      }
    })

    authLogger.info('[getAllSchoolsWithPINs] Fetched schools with PINs', { count: schoolsWithPINs.length })
    return {
      success: true,
      data: schoolsWithPINs,
    }
  } catch (error) {
    authLogger.error('[getAllSchoolsWithPINs] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get PIN statistics
 */
export async function getPINStatistics(): Promise<AdminPINActionResult> {
  try {
    const supabase = await createClient()
    // Use admin client for school_staff_credentials (RLS restricts to service_role only)
    const adminClient = await createAdminClient()

    // Get total schools
    const { count: totalSchools } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })

    // Get schools with PINs configured (requires service_role to access)
    const { count: schoolsWithPINs } = await adminClient
      .from('school_staff_credentials')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    const stats = {
      totalSchools: totalSchools || 0,
      schoolsWithPINs: schoolsWithPINs || 0,
      schoolsWithoutPINs: (totalSchools || 0) - (schoolsWithPINs || 0),
    }

    authLogger.info('[getPINStatistics] Statistics calculated', stats)
    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    authLogger.error('[getPINStatistics] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
