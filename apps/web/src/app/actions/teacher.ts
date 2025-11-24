'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import {
  ANALYTICS_WINDOW_DAYS,
  RAPID_RESPONSE_THRESHOLD_MS,
  AT_RISK_RAPID_PERCENTAGE,
} from '@/lib/constants/auth'

// Validation schemas
const CreateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100, 'Class name must be 100 characters or less'),
  subject: z.string().max(100, 'Subject must be 100 characters or less').optional(),
})

export async function createClass(name: string, subject?: string) {
  // Validate input
  const validatedInput = CreateClassSchema.parse({ name, subject })
  name = validatedInput.name
  subject = validatedInput.subject
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify user is a teacher
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!teacherProfile) {
      return { success: false, error: 'Only teachers can create classes' }
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name,
        subject: subject || null,
        teacher_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/app/teacher/classes')
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function updateClass(classId: string, name: string, subject?: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify user is a teacher
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!teacherProfile) {
      return { success: false, error: 'Only teachers can update classes' }
    }

    // Verify the teacher owns this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    if (classData?.teacher_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('classes')
      .update({
        name,
        subject: subject || null,
      })
      .eq('id', classId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/app/teacher/classes')
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function deleteClass(classId: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify user is a teacher
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!teacherProfile) {
      return { success: false, error: 'Only teachers can delete classes' }
    }

    // Verify the teacher owns this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    if (classData?.teacher_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/app/teacher/classes')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function enrollStudent(classId: string, studentId: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify the teacher owns this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    if (classData?.teacher_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        class_id: classId,
        student_id: studentId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return { success: false, error: 'Student is already enrolled' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath(`/app/teacher/classes/${classId}`)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function removeStudent(classId: string, studentId: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify the teacher owns this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    if (classData?.teacher_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/app/teacher/classes/${classId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function getClassAnalytics(classId: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify the teacher owns this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    if (classData?.teacher_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Use UTC for consistent timezone handling across all regions
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - ANALYTICS_WINDOW_DAYS)

    // 1. Active this week: distinct users with a session in last 7 days
    const { data: activeSessions } = await supabase
      .from('assessment_sessions')
      .select('user_id')
      .eq('class_id', classId)
      .gte('started_at', sevenDaysAgo.toISOString())

    const activeThisWeek = new Set(activeSessions?.map(s => s.user_id) || []).size

    // 2. Avg minutes/day: avg(sum(rt_ms)/60000 per user) last 7 days
    const { data: userSessions } = await supabase
      .from('assessment_sessions')
      .select('id, user_id, started_at')
      .eq('class_id', classId)
      .gte('started_at', sevenDaysAgo.toISOString())
      .not('submitted_at', 'is', null)

    let avgMinutesPerDay = 0

    if (userSessions && userSessions.length > 0) {
      const sessionIds = userSessions.map(s => s.id)

      const { data: responses } = await supabase
        .from('assessment_responses')
        .select('session_id, rt_ms')
        .in('session_id', sessionIds)

      // Calculate total time per user
      const userTimes = new Map<string, number>()

      for (const session of userSessions) {
        // Filter responses that belong to this specific session's user
        const sessionResponses = responses?.filter(r =>
          r.session_id === session.id
        ) || []

        const totalMs = sessionResponses.reduce((sum, r) => sum + (r.rt_ms || 0), 0)
        const currentTime = userTimes.get(session.user_id) || 0
        userTimes.set(session.user_id, currentTime + totalMs)
      }

      const totalMinutes = Array.from(userTimes.values())
        .reduce((sum, ms) => sum + ms / 60000, 0)

      avgMinutesPerDay = userTimes.size > 0 ? totalMinutes / userTimes.size / ANALYTICS_WINDOW_DAYS : 0
    }

    // 3. At-risk: users with >30% rapid (rt_ms < 5000) items in last session
    const { data: recentSessions } = await supabase
      .from('assessment_sessions')
      .select('id, user_id')
      .eq('class_id', classId)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })

    let atRiskCount = 0

    if (recentSessions && recentSessions.length > 0) {
      // Get the most recent session per user
      const latestSessionPerUser = new Map<string, string>()
      for (const session of recentSessions) {
        if (!latestSessionPerUser.has(session.user_id)) {
          latestSessionPerUser.set(session.user_id, session.id)
        }
      }

      // Batch query: Get all responses for all latest sessions at once
      const sessionIds = Array.from(latestSessionPerUser.values())
      if (sessionIds.length > 0) {
        const { data: allSessionResponses } = await supabase
          .from('assessment_responses')
          .select('session_id, rt_ms')
          .in('session_id', sessionIds)

        // Group responses by session_id
        const responsesBySession = new Map<string, Array<{ rt_ms: number | null }>>()
        for (const response of allSessionResponses || []) {
          if (!responsesBySession.has(response.session_id)) {
            responsesBySession.set(response.session_id, [])
          }
          responsesBySession.get(response.session_id)!.push(response)
        }

        // Check rapid responses for each user's latest session
        for (const sessionId of sessionIds) {
          const sessionResponses = responsesBySession.get(sessionId) || []

          if (sessionResponses.length > 0) {
            const rapidCount = sessionResponses.filter(
              r => r.rt_ms && r.rt_ms < RAPID_RESPONSE_THRESHOLD_MS
            ).length
            const rapidPercentage = (rapidCount / sessionResponses.length) * 100

            if (rapidPercentage > AT_RISK_RAPID_PERCENTAGE * 100) {
              atRiskCount++
            }
          }
        }
      }
    }

    return {
      success: true,
      data: {
        activeThisWeek,
        avgMinutesPerDay: Math.round(avgMinutesPerDay * 10) / 10,
        atRiskCount,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
