import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 이 경로는 동적으로 렌더링되어야 함
export const dynamic = 'force-dynamic'

// 중앙화된 supabase 클라이언트 사용
const supabase = supabaseAdmin

// 통합된 퀴즈 API - GET 요청
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'check':
        return await handleCheck(searchParams)
      case 'questions':
        return await handleQuestions(searchParams)
      case 'results':
        return await handleResults(searchParams)
      case 'sessions':
        return await handleSessions(searchParams)
      case 'session':
        return await handleSession(searchParams)
      default:
        return await handleActiveQuizzes()
    }
  } catch (error) {
    console.error('Quiz API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 통합된 퀴즈 API - POST 요청
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'submit':
        return await handleSubmitQuiz(request)
      default:
        return await handleCreateSession(request)
    }
  } catch (error) {
    console.error('Quiz API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀴즈 체크 (기존 /api/quiz/check)
async function handleCheck(searchParams: URLSearchParams) {
  const studentId = searchParams.get('studentId')
  const scheduleId = searchParams.get('scheduleId')

  if (!studentId || !scheduleId) {
    return NextResponse.json(
      { error: '학생 ID와 스케줄 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('id')
    .eq('student_id', studentId)
    .eq('schedule_id', scheduleId)
    .not('completed_at', 'is', null)
    .maybeSingle()

  if (error) {
    console.error('Error checking quiz status:', error)
    return NextResponse.json(
      { error: '퀴즈 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    hasTaken: !!data
  })
}

// 퀴즈 문제 조회 (기존 /api/quiz/questions)
async function handleQuestions(searchParams: URLSearchParams) {
  const questionIds = searchParams.get('ids')

  if (!questionIds) {
    return NextResponse.json(
      { error: '문제 ID 목록이 필요합니다.' },
      { status: 400 }
    )
  }

  const idsArray = questionIds.split(',')

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', idsArray)

  if (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: '문제 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  // 문제 랜덤 셔플
  const shuffledQuestions = questions ? 
    questions.sort(() => Math.random() - 0.5) : []

  return NextResponse.json({
    success: true,
    questions: shuffledQuestions
  })
}

// 퀴즈 결과 조회 (기존 /api/quiz/results)
async function handleResults(searchParams: URLSearchParams) {
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: '세션 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching quiz results:', error)
    return NextResponse.json(
      { error: '퀴즈 결과 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    session
  })
}

// 퀴즈 세션 목록 조회 (기존 /api/quiz/sessions)
async function handleSessions(searchParams: URLSearchParams) {
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json(
      { error: '학생 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  const { data: sessions, error } = await supabase
    .from('quiz_sessions')
    .select(`
      *,
      quiz_schedules (
        title,
        description
      )
    `)
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching quiz sessions:', error)
    return NextResponse.json(
      { error: '퀴즈 세션 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    sessions
  })
}

// 단일 퀴즈 세션 조회 (기존 /api/quiz/session)
async function handleSession(searchParams: URLSearchParams) {
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: '세션 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching quiz session:', error)
    return NextResponse.json(
      { error: '퀴즈 세션 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    session
  })
}

// 활성 퀴즈 조회 (기존 기본 동작)
async function handleActiveQuizzes() {
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 8)
  const currentDay = now.getDay()
  const currentDate = now.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('quiz_schedules')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', currentDate)
    .or(`end_date.is.null,end_date.gte.${currentDate}`)
    .lte('start_time', currentTime)
    .gte('end_time', currentTime)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching active quizzes:', error)
    return NextResponse.json(
      { error: '활성 퀴즈 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: '현재 진행중인 퀴즈가 없습니다.' },
      { status: 404 }
    )
  }

  // Filter by schedule type and weekdays
  const activeQuizzes = []
  for (const schedule of data) {
    if (schedule.schedule_type === 'daily') {
      activeQuizzes.push(schedule)
    } else if (schedule.schedule_type === 'weekly') {
      if (schedule.weekdays && schedule.weekdays.includes(currentDay)) {
        activeQuizzes.push(schedule)
      }
    } else if (schedule.schedule_type === 'once') {
      if (schedule.start_date === currentDate) {
        activeQuizzes.push(schedule)
      }
    }
  }

  if (activeQuizzes.length === 0) {
    return NextResponse.json(
      { error: '현재 진행중인 퀴즈가 없습니다.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ 
    success: true, 
    quizzes: activeQuizzes,
    // 하위 호환성을 위해 첫 번째 퀴즈를 quiz 필드로도 제공
    quiz: activeQuizzes[0]
  })
}

// 퀴즈 세션 생성 (기존 POST 동작)
async function handleCreateSession(request: NextRequest) {
  const body = await request.json()
  console.log('Create session request body:', body)
  
  const { studentId, scheduleId, totalQuestions, student_id, schedule_id, question_ids } = body

  // 다양한 필드명 지원
  const finalStudentId = studentId || student_id
  const finalScheduleId = scheduleId || schedule_id
  const finalTotalQuestions = totalQuestions || (question_ids ? question_ids.length : null)

  if (!finalStudentId || !finalScheduleId) {
    console.error('Missing required fields:', { finalStudentId, finalScheduleId })
    return NextResponse.json(
      { error: '학생 ID와 스케줄 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  // 이미 완료한 퀴즈인지 확인
  const { data: existingSession } = await supabase
    .from('quiz_sessions')
    .select('id')
    .eq('student_id', finalStudentId)
    .eq('schedule_id', finalScheduleId)
    .not('completed_at', 'is', null)
    .maybeSingle()

  if (existingSession) {
    return NextResponse.json(
      { error: '이미 완료한 퀴즈입니다.' },
      { status: 400 }
    )
  }

  // 새 퀴즈 세션 생성
  const sessionData = {
    student_id: finalStudentId,
    schedule_id: finalScheduleId,
    total_questions: finalTotalQuestions || 10,
    answers: question_ids ? [] : {},
    started_at: new Date().toISOString()
  }

  // question_ids가 있으면 추가
  if (question_ids) {
    sessionData.question_ids = question_ids
    sessionData.current_question_index = 0
    sessionData.score = 0
  }

  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .insert(sessionData)
    .select('*')
    .single()

  if (error) {
    console.error('Error creating quiz session:', error)
    return NextResponse.json(
      { error: '퀴즈 세션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    sessionId: session.id,
    session: session
  })
}

// 퀴즈 제출 처리
async function handleSubmitQuiz(request: NextRequest) {
  const { sessionId, answers, score } = await request.json()

  if (!sessionId || !answers || score === undefined) {
    return NextResponse.json(
      { error: '필수 매개변수가 누락되었습니다.' },
      { status: 400 }
    )
  }

  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .update({
      answers,
      score,
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select('*')
    .single()

  if (error) {
    console.error('Error submitting quiz:', error)
    return NextResponse.json(
      { error: '퀴즈 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    session
  })
}