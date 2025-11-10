'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getCurrentUser } from '@/lib/supabase-server'

export async function createClass(name: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name,
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
