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

// 답안 제출
export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, answer } = await request.json()

    if (!sessionId || !questionId || !answer) {
      return NextResponse.json(
        { error: '필수 매개변수가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 현재 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('answers')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '퀴즈 세션을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 답안 업데이트
    const updatedAnswers = {
      ...session.answers,
      [questionId]: answer
    }

    const { error: updateError } = await supabase
      .from('quiz_sessions')
      .update({ answers: updatedAnswers })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating answer:', updateError)
      return NextResponse.json(
        { error: '답안 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Submit answer API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀴즈 완료
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, timeTakenSeconds } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '퀴즈 세션을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 문제 조회
    const { data: schedule } = await supabase
      .from('quiz_schedules')
      .select('question_ids')
      .eq('id', session.schedule_id)
      .single()

    if (!schedule) {
      return NextResponse.json(
        { error: '퀴즈 스케줄을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .in('id', schedule.question_ids)

    if (!questions) {
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 점수 계산
    let score = 0
    const results = questions.map(question => {
      const userAnswer = session.answers[question.id] || ''
      const correct = userAnswer === question.correct_answer
      if (correct) score++
      
      return {
        question,
        userAnswer,
        correct
      }
    })

    // 세션 완료 처리
    const { error: updateError } = await supabase
      .from('quiz_sessions')
      .update({
        completed_at: new Date().toISOString(),
        score,
        time_taken_seconds: timeTakenSeconds
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error completing session:', updateError)
      return NextResponse.json(
        { error: '퀴즈 완료 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 포트폴리오 업데이트
    try {
      await supabase.rpc('update_portfolio_from_quiz', {
        p_student_id: session.student_id,
        p_score: score,
        p_total_questions: questions.length
      })
    } catch (error) {
      console.error('Error updating portfolio:', error)
    }

    return NextResponse.json({
      success: true,
      score,
      results
    })

  } catch (error) {
    console.error('Complete quiz API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}