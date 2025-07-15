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

export async function POST(request: NextRequest) {
  try {
    const questions = await request.json()
    
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: '문제 데이터는 배열 형태여야 합니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('questions')
      .insert(questions)
      .select()

    if (error) {
      console.error('Questions insert error:', error)
      return NextResponse.json(
        { error: '문제 추가 중 오류가 발생했습니다: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      questions: data
    })

  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('questions')
      .select('*')
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    if (difficulty) {
      query = query.eq('difficulty', parseInt(difficulty))
    }

    const { data, error } = await query

    if (error) {
      console.error('Questions fetch error:', error)
      return NextResponse.json(
        { error: '문제 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questions: data
    })

  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}