'use server'

import { revalidatePath } from 'next/cache'
import { timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

// Validation schemas
const JoinClassSchema = z.object({
  classCode: z.string().min(1, 'Class code required').max(20, 'Invalid class code').regex(/^[A-Z0-9\-]+$/, 'Class code format invalid'),
  rollNumber: z.string().min(1, 'Roll number required').max(50, 'Roll number too long'),
  pin: z.string().length(4, 'PIN must be 4 digits').regex(/^\d{4}$/, 'PIN must contain only digits'),
})

interface JoinClassParams {
  classCode: string
  rollNumber: string
  pin: string
}

export async function joinClass({ classCode, rollNumber, pin }: JoinClassParams) {
  try {
    // Validate inputs
    const validatedInput = JoinClassSchema.parse({ classCode, rollNumber, pin })
    classCode = validatedInput.classCode
    rollNumber = validatedInput.rollNumber
    pin = validatedInput.pin

    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Find class by code and verify PIN
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, class_code, join_pin')
      .eq('class_code', classCode)
      .single()

    if (classError || !classData) {
      authLogger.debug('[joinClass] Class not found', { classCode })
      return { success: false, error: 'Invalid class code or PIN' }
    }

    // Verify PIN using constant-time comparison to prevent timing attacks
    let pinMatch = false
    if (classData.join_pin) {
      try {
        pinMatch = timingSafeEqual(Buffer.from(pin), Buffer.from(classData.join_pin))
      } catch {
        // timingSafeEqual throws if buffers are different lengths
        pinMatch = false
      }
    }

    if (!pinMatch) {
      authLogger.warn('[joinClass] Invalid PIN attempt', { classCode, userId: user.id })
      return { success: false, error: 'Invalid class code or PIN' }
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', classData.id)
      .eq('student_id', user.id)
      .single()

    if (existingEnrollment) {
      return { success: false, error: 'Already enrolled in this class' }
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        class_id: classData.id,
        student_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/app/student/classes')
    return {
      success: true,
      data: {
        ...data,
        className: classData.name,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function leaveClass(classId: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/app/student/classes')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
