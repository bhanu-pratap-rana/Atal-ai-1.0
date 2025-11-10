'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getCurrentUser } from '@/lib/supabase-server'

interface JoinClassParams {
  classCode: string
  rollNumber: string
  pin: string
}

export async function joinClass({ classCode, rollNumber, pin }: JoinClassParams) {
  try {
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
      return { success: false, error: 'Invalid class code' }
    }

    // Verify PIN
    if (classData.join_pin !== pin) {
      return { success: false, error: 'Incorrect PIN' }
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
