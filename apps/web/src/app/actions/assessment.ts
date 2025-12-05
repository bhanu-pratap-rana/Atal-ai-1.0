'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient, getCurrentUser } from '@/lib/supabase-server'

// Validation schemas
const AssessmentResponseSchema = z.object({
  itemId: z.string().min(1, 'Item ID required').max(100, 'Item ID too long'),
  module: z.string().min(1, 'Module required').max(100, 'Module name too long'),
  isCorrect: z.boolean(),
  rtMs: z.number().min(0, 'Response time cannot be negative').max(999999, 'Response time too long'),
  focusBlurCount: z.number().min(0, 'Focus blur count cannot be negative').max(10000, 'Focus blur count too high'),
  chosenOption: z.string().min(1, 'Chosen option required').max(100, 'Option ID too long'),
})

const AssessmentSubmitSchema = z.object({
  sessionId: z.string().min(1, 'Session ID required').uuid(),
  responses: z.array(AssessmentResponseSchema).min(1, 'At least one response required').max(1000, 'Too many responses'),
})

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
    // Validate inputs according to assessment constraints
    const validatedData = AssessmentSubmitSchema.parse({
      sessionId,
      responses,
    })

    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('assessment_sessions')
      .select('user_id')
      .eq('id', validatedData.sessionId)
      .single()

    if (sessionError || !session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Batch insert responses using validated data
    const responsesToInsert = validatedData.responses.map((r) => ({
      session_id: validatedData.sessionId,
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
      .eq('id', validatedData.sessionId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Calculate score and module breakdown from validated responses
    const totalQuestions = validatedData.responses.length
    const correctAnswers = validatedData.responses.filter((r) => r.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions) * 100)

    // Group by module
    const moduleBreakdown = validatedData.responses.reduce((acc, r) => {
      if (!acc[r.module]) {
        acc[r.module] = { total: 0, correct: 0 }
      }
      const moduleStats = acc[r.module]!
      moduleStats.total++
      if (r.isCorrect) {
        moduleStats.correct++
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
