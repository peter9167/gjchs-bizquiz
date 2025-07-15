import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const scheduleId = searchParams.get('scheduleId')

    if (!studentId || !scheduleId) {
      return NextResponse.json(
        { error: 'studentId와 scheduleId가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('schedule_id', scheduleId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking quiz session:', error)
      return NextResponse.json(
        { error: '퀴즈 세션을 확인하는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      hasTaken: !!session,
      session: session || null
    })
  } catch (error) {
    console.error('Quiz check API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}