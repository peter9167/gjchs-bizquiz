import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json(
        { error: 'ids 파라미터가 필요합니다.' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',').map(id => id.trim())

    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        question,
        options,
        correct_answer,
        explanation,
        difficulty,
        category,
        created_at
      `)
      .in('id', ids)

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json(
        { error: '문제를 불러오는데 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        success: true,
        questions: []
      })
    }

    const orderedQuestions = ids.map(id => 
      questions?.find(q => q.id === id)
    ).filter(Boolean)

    return NextResponse.json({
      success: true,
      questions: orderedQuestions
    })
  } catch (error) {
    console.error('Quiz questions API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}