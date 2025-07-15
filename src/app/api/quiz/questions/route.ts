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

  } catch (error) {
    console.error('Quiz questions API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}