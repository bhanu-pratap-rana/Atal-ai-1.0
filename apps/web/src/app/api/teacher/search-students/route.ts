import { NextRequest, NextResponse } from 'next/server'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query parameter' },
        { status: 400 }
      )
    }

    const sanitizedQuery = query.trim().slice(0, 50) // Max 50 characters

    if (sanitizedQuery.length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must not be empty' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Search for students by email or user ID
    // Search in both email and id columns
    const { data: students, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'student')
      .or(`email.ilike.%${sanitizedQuery}%,id.ilike.%${sanitizedQuery}%`)
      .limit(10)

    if (error) {
      authLogger.error('[searchStudents] Database query failed', error)
      return NextResponse.json(
        { error: 'Failed to search students' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      students: students || [],
    })
  } catch (error) {
    authLogger.error('[searchStudents] Unexpected error', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
