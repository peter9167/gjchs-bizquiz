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

// 모든 학생 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('grade', { ascending: true })
      .order('class', { ascending: true })
      .order('number', { ascending: true })

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json(
        { error: '학생 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      students: data || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}