'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getCurrentUser } from '@/lib/supabase-server'

export async function startAssessment(classId?: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('assessment_sessions')
      .insert({
        user_id: user.id,
        class_id: classId || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, sessionId: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

interface AssessmentResponse {
  itemId: string
  module: string
  isCorrect: boolean
  rtMs: number
  focusBlurCount: number
  chosenOption: string
}

export async function submitAssessment(
  sessionId: string,
  responses: AssessmentResponse[]
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('assessment_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (session?.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Batch insert responses
    const responsesToInsert = responses.map((r) => ({
      session_id: sessionId,
      item_id: r.itemId,
      module: r.module,
      is_correct: r.isCorrect,
      rt_ms: r.rtMs,
      focus_blur_count: r.focusBlurCount,
      chosen_option: r.chosenOption,
    }))

    const { error: insertError } = await supabase
      .from('assessment_responses')
      .insert(responsesToInsert)

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    // Update session submitted_at
    const { error: updateError } = await supabase
      .from('assessment_sessions')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Calculate score and module breakdown
    const totalQuestions = responses.length
    const correctAnswers = responses.filter((r) => r.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions) * 100)

    // Group by module
    const moduleBreakdown = responses.reduce((acc, r) => {
      if (!acc[r.module]) {
        acc[r.module] = { total: 0, correct: 0 }
      }
      acc[r.module].total++
      if (r.isCorrect) {
        acc[r.module].correct++
      }
      return acc
    }, {} as Record<string, { total: number; correct: number }>)

    revalidatePath('/app/assessment')
    return {
      success: true,
      score,
      totalQuestions,
      correctAnswers,
      moduleBreakdown,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
