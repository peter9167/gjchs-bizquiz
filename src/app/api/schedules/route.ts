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

// 모든 스케줄 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('quiz_schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching schedules:', error)
      return NextResponse.json(
        { error: '스케줄을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedules: data || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 새 스케줄 생성
export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json()
    
    console.log('Schedule data received:', rawData)

    // 데이터베이스 스키마에 맞게 변환
    const scheduleData = {
      title: rawData.title,
      question_ids: rawData.question_ids, // PostgreSQL의 uuid[] 타입으로 자동 변환됨
      schedule_type: rawData.schedule_type,
      weekdays: rawData.weekdays || null,
      start_time: rawData.start_time,
      end_time: rawData.end_time,
      start_date: rawData.start_date,
      end_date: rawData.end_date || null,
      time_limit_minutes: rawData.time_limit_minutes,
      is_active: rawData.is_active
    }

    console.log('Processed schedule data:', scheduleData)

    const { data, error } = await supabase
      .from('quiz_schedules')
      .insert(scheduleData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating schedule:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: '스케줄 생성에 실패했습니다.',
          details: error.message,
          supabaseError: error
        },
        { status: 500 }
      )
    }

    console.log('Schedule created successfully:', data)
    return NextResponse.json({
      success: true,
      schedule: data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}