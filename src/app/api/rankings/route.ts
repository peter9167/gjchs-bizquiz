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
    const grade = searchParams.get('grade')
    const classNum = searchParams.get('class')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('live_rankings')
      .select('*')
      .order('rank', { ascending: true })
      .limit(limit)

    if (grade) {
      query = query.eq('grade', parseInt(grade))
    }

    if (classNum) {
      query = query.eq('class', parseInt(classNum))
    }

    const { data: rankings, error } = await query

    if (error) {
      console.error('Error fetching rankings:', error)
      return NextResponse.json(
        { error: '랭킹 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rankings: rankings || []
    })

  } catch (error) {
    console.error('Rankings API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}