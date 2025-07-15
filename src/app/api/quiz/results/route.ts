import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId가 필요합니다.' },
        { status: 400 }
      )
    }

    // 퀴즈 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      console.error('Error fetching session:', sessionError)
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 해당 스케줄의 문제들 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from('quiz_schedules')
      .select('question_ids')
      .eq('id', session.schedule_id)
      .single()

    if (scheduleError) {
      console.error('Error fetching schedule:', scheduleError)
      return NextResponse.json(
        { error: '퀴즈 스케줄을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 문제들 조회
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', schedule.question_ids)

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 답안 정보 처리
    const answers: Record<string, string> = {}
    const sessionAnswers = session.answers || []
    
    if (Array.isArray(sessionAnswers)) {
      sessionAnswers.forEach((answer: any) => {
        if (answer && answer.question_index !== undefined) {
          const questionId = schedule.question_ids[answer.question_index]
          if (questionId) {
            answers[questionId] = answer.answer
          }
        }
      })
    }

    // 시간 계산 (started_at과 completed_at 사이의 차이)
    let timeTaken = 0
    if (session.started_at && session.completed_at) {
      const startTime = new Date(session.started_at).getTime()
      const endTime = new Date(session.completed_at).getTime()
      timeTaken = Math.floor((endTime - startTime) / 1000)
    }

    const result = {
      sessionId: session.id,
      score: session.score || 0,
      totalQuestions: session.total_questions || questions.length,
      timeTaken,
      answers,
      questions: questions || []
    }

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Quiz results GET error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}