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

// 특정 스케줄 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('quiz_schedules')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching schedule:', error)
      return NextResponse.json(
        { error: '스케줄을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule: data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스케줄 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()

    const { data, error } = await supabase
      .from('quiz_schedules')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule:', error)
      return NextResponse.json(
        { error: '스케줄 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule: data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스케줄 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('quiz_schedules')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting schedule:', error)
      return NextResponse.json(
        { error: '스케줄 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '스케줄이 성공적으로 삭제되었습니다.'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}