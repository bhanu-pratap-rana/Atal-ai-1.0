'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

export interface DashboardMetrics {
  totalSchools: number
  totalTeachers: number
  totalStudents: number
  activePins: number
  inactivePins: number
  totalAdmins: number
}

export interface SchoolStats {
  schoolId: string
  schoolName: string
  districtName: string
  teacherCount: number
  studentCount: number
  pinCount: number
  activePinCount: number
}

/**
 * Note: Supabase query results have complex inferred types based on the select clause.
 * Using explicit type assertions in map callbacks for type safety.
 */

/**
 * Get dashboard metrics for super admin dashboard
 */
export async function getDashboardMetrics(): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  try {
    const supabase = await createAdminClient()

    // Get school count
    const { count: schoolCount, error: schoolError } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })

    if (schoolError) {
      authLogger.error('[getDashboardMetrics] Failed to get school count', schoolError)
      return {
        success: false,
        error: 'Failed to fetch school metrics',
      }
    }

    // Get teacher count from teacher_profiles table
    let teacherCount = 0
    const { count: profileCount, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('*', { count: 'exact', head: true })

    if (teacherError) {
      authLogger.error('[getDashboardMetrics] Failed to get teacher count from profiles', teacherError)
    } else {
      teacherCount = profileCount || 0
    }

    // Get PIN metrics from school_staff_credentials table
    const { count: activePinCount, error: pinError } = await supabase
      .from('school_staff_credentials')
      .select('*', { count: 'exact', head: true })

    if (pinError) {
      authLogger.error('[getDashboardMetrics] Failed to get PIN count', pinError)
    }

    const activePins = activePinCount || 0
    const inactivePins = (schoolCount || 0) - activePins

    // Get counts from auth users by role
    let studentCount = 0
    let adminCount = 0
    let authTeacherCount = 0
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      if (authUsers?.users) {
        studentCount = authUsers.users.filter(
          (u) => u.app_metadata?.role === 'student'
        ).length
        adminCount = authUsers.users.filter(
          (u) => u.app_metadata?.role === 'admin' || u.app_metadata?.role === 'super_admin'
        ).length
        // Also count teachers from auth users as fallback
        authTeacherCount = authUsers.users.filter(
          (u) => u.app_metadata?.role === 'teacher'
        ).length
      }
    } catch (err) {
      authLogger.error('[getDashboardMetrics] Failed to list auth users', err)
    }

    // Use the higher count between profiles and auth users
    const finalTeacherCount = Math.max(teacherCount, authTeacherCount)

    const metrics: DashboardMetrics = {
      totalSchools: schoolCount || 0,
      totalTeachers: finalTeacherCount,
      totalStudents: studentCount,
      activePins: activePins,
      inactivePins: inactivePins,
      totalAdmins: adminCount,
    }

    authLogger.info('[getDashboardMetrics] Metrics fetched successfully', metrics as unknown as Record<string, unknown>)
    return {
      success: true,
      data: metrics,
    }
  } catch (error) {
    authLogger.error('[getDashboardMetrics] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get school statistics by district
 */
export async function getSchoolStatsByDistrict(): Promise<{
  success: boolean
  data?: SchoolStats[]
  error?: string
}> {
  try {
    const supabase = await createAdminClient()

    // Get schools with teacher and student counts
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select(`
        id,
        name,
        districts!inner(name)
      `)

    if (schoolError) {
      authLogger.error('[getSchoolStatsByDistrict] Failed to get schools', schoolError)
      return {
        success: false,
        error: 'Failed to fetch school statistics',
      }
    }

    if (!schools || schools.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Get teacher and student counts for each school
    const schoolStats: SchoolStats[] = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (schools || []).map(async (school: any) => {
        // Get teacher count for this school
        const { count: teacherCount } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id)

        // Get student count for this school
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id)

        // Get PIN counts for this school
        const { data: pinData } = await supabase
          .from('pins')
          .select('status')
          .eq('school_id', school.id)

        const activePinCount = (pinData || []).filter((pin) => pin.status === 'active').length

        return {
          schoolId: school.id,
          schoolName: school.name,
          districtName: school.districts?.name || 'Unknown',
          teacherCount: teacherCount || 0,
          studentCount: studentCount || 0,
          pinCount: pinData?.length || 0,
          activePinCount,
        }
      })
    )

    return {
      success: true,
      data: schoolStats,
    }
  } catch (error) {
    authLogger.error('[getSchoolStatsByDistrict] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get schools with active PINs
 */
export async function getSchoolsWithActivePINs(): Promise<{
  success: boolean
  data?: Array<{
    schoolId: string
    schoolName: string
    schoolCode: string
    districtName: string
    lastRotatedAt: string | null
  }>
  error?: string
}> {
  try {
    const supabase = await createAdminClient()

    // Get all schools with PINs
    const { data: pins, error: pinError } = await supabase
      .from('school_staff_credentials')
      .select('school_id, rotated_at, created_at')

    if (pinError) {
      authLogger.error('[getSchoolsWithActivePINs] Failed to get PINs', pinError)
      return {
        success: false,
        error: 'Failed to fetch PIN data',
      }
    }

    if (!pins || pins.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Get school details for schools with PINs
    const schoolIds = pins.map((p) => p.school_id)
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_name, school_code, district')
      .in('id', schoolIds)

    if (schoolError) {
      authLogger.error('[getSchoolsWithActivePINs] Failed to get schools', schoolError)
      return {
        success: false,
        error: 'Failed to fetch school data',
      }
    }

    // Map PIN data to schools
    const pinMap = new Map(pins.map((p) => [p.school_id, p]))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (schools || []).map((school: any) => {
      const pin = pinMap.get(school.id)
      return {
        schoolId: school.id,
        schoolName: school.school_name,
        schoolCode: school.school_code || 'N/A',
        districtName: school.district || 'Unknown',
        lastRotatedAt: pin?.rotated_at || pin?.created_at || null,
      }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    authLogger.error('[getSchoolsWithActivePINs] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get recent activity count for last N days
 */
export async function getRecentActivityCount(days: number = 7): Promise<{
  success: boolean
  data?: { date: string; count: number }[]
  error?: string
}> {
  try {
    const supabase = await createAdminClient()
    const activityData: { date: string; count: number }[] = []

    // Get activity for last N days
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Count teacher profiles created
      const { count } = await supabase
        .from('teacher_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${dateStr}T00:00:00`)
        .lte('created_at', `${dateStr}T23:59:59`)

      activityData.push({
        date: dateStr,
        count: count || 0,
      })
    }

    return {
      success: true,
      data: activityData.reverse(),
    }
  } catch (error) {
    authLogger.error('[getRecentActivityCount] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all schools list
 */
export async function getAllSchools(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    schoolName: string
    schoolCode: string
    district: string
    block: string | null
    hasPIN: boolean
  }>
  error?: string
}> {
  try {
    const supabase = await createAdminClient()

    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, school_name, school_code, district, block')
      .order('school_name')

    if (error) {
      authLogger.error('[getAllSchools] Failed to get schools', error)
      return { success: false, error: 'Failed to fetch schools' }
    }

    // Get schools with PINs
    const { data: pins } = await supabase
      .from('school_staff_credentials')
      .select('school_id')

    const schoolsWithPINs = new Set((pins || []).map((p: { school_id: string }) => p.school_id))

    const result = (schools || []).map((school: {
      id: string
      school_name: string
      school_code: string
      district: string
      block: string | null
    }) => ({
      id: school.id,
      schoolName: school.school_name,
      schoolCode: school.school_code || 'N/A',
      district: school.district || 'Unknown',
      block: school.block,
      hasPIN: schoolsWithPINs.has(school.id),
    }))

    return { success: true, data: result }
  } catch (error) {
    authLogger.error('[getAllSchools] Unexpected error', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all teachers list
 * Uses teacher_profiles table as the source of truth (not app_metadata.role)
 */
export async function getAllTeachers(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    email: string
    name: string
    phone: string | null
    schoolName: string
    schoolCode: string
    createdAt: string
  }>
  error?: string
}> {
  try {
    const supabase = await createAdminClient()

    // Get teacher profiles with school info - teacher_profiles is the source of truth
    const { data: profiles, error: profileError } = await supabase
      .from('teacher_profiles')
      .select(`
        user_id,
        name,
        phone,
        school_code,
        created_at,
        schools!inner(school_name)
      `)

    if (profileError) {
      authLogger.error('[getAllTeachers] Failed to fetch teacher profiles', profileError)
      return { success: false, error: 'Failed to fetch teacher profiles' }
    }

    // Get auth users to get email addresses
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const userMap = new Map((authUsers?.users || []).map((u) => [u.id, u]))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (profiles || []).map((profile: any) => {
      const authUser = userMap.get(profile.user_id)
      return {
        id: profile.user_id,
        email: authUser?.email || '',
        name: profile.name || 'Unknown',
        phone: profile.phone || null,
        schoolName: profile.schools?.school_name || 'Unknown',
        schoolCode: profile.school_code || 'N/A',
        createdAt: profile.created_at,
      }
    })

    return { success: true, data: result }
  } catch (error) {
    authLogger.error('[getAllTeachers] Unexpected error', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all students list
 */
export async function getAllStudents(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    email: string
    phone: string | null
    createdAt: string
    lastSignIn: string | null
  }>
  error?: string
}> {
  try {
    const supabase = await createAdminClient()

    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const studentUsers = (authUsers?.users || []).filter(
      (u) => u.app_metadata?.role === 'student'
    )

    const result = studentUsers.map((user) => ({
      id: user.id,
      email: user.email || '',
      phone: user.phone || null,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at || null,
    }))

    return { success: true, data: result }
  } catch (error) {
    authLogger.error('[getAllStudents] Unexpected error', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get schools without PINs (inactive)
 */
export async function getSchoolsWithoutPINs(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    schoolName: string
    schoolCode: string
    district: string
  }>
  error?: string
}> {
  try {
    const supabase = await createAdminClient()

    // Get all schools
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_name, school_code, district')
      .order('school_name')

    if (schoolError) {
      authLogger.error('[getSchoolsWithoutPINs] Failed to get schools', schoolError)
      return { success: false, error: 'Failed to fetch schools' }
    }

    // Get schools with PINs
    const { data: pins } = await supabase
      .from('school_staff_credentials')
      .select('school_id')

    const schoolsWithPINs = new Set((pins || []).map((p: { school_id: string }) => p.school_id))

    // Filter schools without PINs
    const result = (schools || [])
      .filter((school: { id: string }) => !schoolsWithPINs.has(school.id))
      .map((school: {
        id: string
        school_name: string
        school_code: string
        district: string
      }) => ({
        id: school.id,
        schoolName: school.school_name,
        schoolCode: school.school_code || 'N/A',
        district: school.district || 'Unknown',
      }))

    return { success: true, data: result }
  } catch (error) {
    authLogger.error('[getSchoolsWithoutPINs] Unexpected error', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
