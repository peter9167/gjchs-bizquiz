import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

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

// 퀴즈 세션 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, schedule_id, question_ids } = body

    console.log('Creating quiz session:', { student_id, schedule_id, question_ids })

    if (!student_id || !schedule_id || !question_ids) {
      return NextResponse.json(
        { error: 'student_id, schedule_id, question_ids가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기존 세션이 있는지 확인
    const { data: existingSession, error: checkError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('student_id', student_id)
      .eq('schedule_id', schedule_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing session:', checkError)
      return NextResponse.json(
        { error: '기존 세션 확인에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (existingSession) {
      return NextResponse.json({
        success: true,
        session: existingSession
      })
    }

    // 새 세션 생성
    const sessionId = uuidv4()
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .insert({
        id: sessionId,
        student_id,
        schedule_id,
        question_ids,
        current_question_index: 0,
        score: 0,
        total_questions: question_ids.length,
        started_at: new Date().toISOString(),
        answers: []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating quiz session:', error)
      return NextResponse.json(
        { error: '퀴즈 세션 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session
    })
  } catch (error) {
    console.error('Quiz session POST error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀴즈 세션 업데이트 (답안 제출)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, question_index, answer, is_correct, completed } = body

    console.log('Updating quiz session:', { session_id, question_index, answer, is_correct, completed })

    if (!session_id || question_index === undefined) {
      return NextResponse.json(
        { error: 'session_id와 question_index가 필요합니다.' },
        { status: 400 }
      )
    }

    // 현재 세션 조회
    const { data: currentSession, error: fetchError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (fetchError) {
      console.error('Error fetching session:', fetchError)
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 답안 추가
    const updatedAnswers = [...(currentSession.answers || [])]
    updatedAnswers[question_index] = {
      question_index,
      answer,
      is_correct,
      answered_at: new Date().toISOString()
    }

    // 점수 계산
    const newScore = updatedAnswers.filter(a => a && a.is_correct).length

    // 세션 업데이트 데이터 준비
    const updateData: any = {
      answers: updatedAnswers,
      score: newScore,
      current_question_index: question_index + 1
    }

    // 퀴즈 완료 시 완료 시간 설정
    if (completed) {
      updateData.completed_at = new Date().toISOString()
    }

    // 세션 업데이트
    const { data: updatedSession, error } = await supabase
      .from('quiz_sessions')
      .update(updateData)
      .eq('id', session_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating quiz session:', error)
      return NextResponse.json(
        { error: '세션 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: updatedSession
    })
  } catch (error) {
    console.error('Quiz session PUT error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀴즈 세션 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const studentId = searchParams.get('student_id')
    const scheduleId = searchParams.get('schedule_id')

    if (sessionId) {
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('Error fetching session:', error)
        return NextResponse.json(
          { error: '세션을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        session
      })
    }

    if (studentId && scheduleId) {
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('student_id', studentId)
        .eq('schedule_id', scheduleId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching session:', error)
        return NextResponse.json(
          { error: '세션 조회에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        session: session || null
      })
    }

    return NextResponse.json(
      { error: 'session_id 또는 student_id와 schedule_id가 필요합니다.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Quiz session GET error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}