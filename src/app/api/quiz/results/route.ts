import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서버 사이드에서 service role key 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 퀴즈 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select(`
        *,
        quiz_schedules (
          title,
          question_ids
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: '퀴즈 세션을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 문제 조회
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', session.quiz_schedules.question_ids)

    if (questionsError || !questions) {
      console.error('Questions error:', questionsError)
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      result: {
        sessionId: session.id,
        score: session.score,
        totalQuestions: session.total_questions,
        timeTaken: session.time_taken_seconds || 0,
        answers: session.answers || {},
        questions
      }
    })

  } catch (error) {
    console.error('Quiz results API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}