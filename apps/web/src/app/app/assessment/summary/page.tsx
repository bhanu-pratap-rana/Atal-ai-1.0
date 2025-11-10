import { redirect } from 'next/navigation'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { AssessmentSummary } from '@/components/assessment/AssessmentSummary'

export default async function AssessmentSummaryPage({
  searchParams,
}: {
  searchParams: { session?: string }
}) {
  const sessionId = searchParams.session

  if (!sessionId) {
    redirect('/app/assessment/start')
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch session data
  const { data: session, error: sessionError } = await supabase
    .from('assessment_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session || session.user_id !== user.id) {
    redirect('/app/assessment/start')
  }

  // Fetch responses
  const { data: responses, error: responsesError } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (responsesError || !responses) {
    redirect('/app/assessment/start')
  }

  // Calculate statistics
  const totalQuestions = responses.length
  const correctAnswers = responses.filter((r) => r.is_correct).length
  const score = Math.round((correctAnswers / totalQuestions) * 100)

  // Group by module
  const moduleBreakdown = responses.reduce((acc, r) => {
    if (!acc[r.module]) {
      acc[r.module] = { total: 0, correct: 0 }
    }
    acc[r.module].total++
    if (r.is_correct) {
      acc[r.module].correct++
    }
    return acc
  }, {} as Record<string, { total: number; correct: number }>)

  // Calculate average response time
  const avgResponseTime = Math.round(
    responses.reduce((sum, r) => sum + (r.rt_ms || 0), 0) / totalQuestions
  )

  return (
    <AssessmentSummary
      score={score}
      totalQuestions={totalQuestions}
      correctAnswers={correctAnswers}
      moduleBreakdown={moduleBreakdown}
      avgResponseTime={avgResponseTime}
    />
  )
}
