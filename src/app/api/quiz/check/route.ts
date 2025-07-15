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

  } catch (error) {
    console.error('Quiz check API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}