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

// 활성 퀴즈 조회 (여러 퀴즈 지원)
export async function GET(request: NextRequest) {
  try {
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

  } catch (error) {
    console.error('Quiz API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀴즈 세션 시작
export async function POST(request: NextRequest) {
  try {
    const { studentId, scheduleId, totalQuestions } = await request.json()

    if (!studentId || !scheduleId || !totalQuestions) {
      return NextResponse.json(
        { error: '필수 매개변수가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 이미 완료한 퀴즈인지 확인
    const { data: existingSession } = await supabase
      .from('quiz_sessions')
      .select('id')
      .eq('student_id', studentId)
      .eq('schedule_id', scheduleId)
      .not('completed_at', 'is', null)
      .maybeSingle()

    if (existingSession) {
      return NextResponse.json(
        { error: '이미 완료한 퀴즈입니다.' },
        { status: 400 }
      )
    }

    // 새 퀴즈 세션 생성
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .insert({
        student_id: studentId,
        schedule_id: scheduleId,
        total_questions: totalQuestions,
        answers: {},
        started_at: new Date().toISOString()
      })
      .select('id')
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
      sessionId: session.id
    })

  } catch (error) {
    console.error('Quiz session API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}