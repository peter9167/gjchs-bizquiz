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
    console.log('Quiz questions API called:', request.url)
    
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    console.log('IDs parameter:', idsParam)

    if (!idsParam) {
      return NextResponse.json(
        { error: 'ids 파라미터가 필요합니다.' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',').map(id => id.trim())
    console.log('Parsed IDs:', ids)

    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      )
    }

    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        title,
        content,
        image_url,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        difficulty,
        category,
        created_at
      `)
      .in('id', ids)

    console.log('Supabase query result:', { questions, error })

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: '문제를 불러오는데 실패했습니다.', 
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      console.log('No questions found for IDs:', ids)
      return NextResponse.json({
        success: true,
        questions: []
      })
    }

    // 프론트엔드에서 기대하는 형식으로 변환
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      question: q.content, // content를 question으로 매핑
      title: q.title,
      options: [q.option_a, q.option_b, q.option_c, q.option_d], // 배열로 변환
      correct_answer: q.correct_answer,
      image_url: q.image_url,
      difficulty: q.difficulty,
      category: q.category,
      created_at: q.created_at
    }))

    const orderedQuestions = ids.map(id => 
      formattedQuestions?.find(q => q.id === id)
    ).filter(Boolean)

    console.log('Returning questions:', orderedQuestions.length)

    return NextResponse.json({
      success: true,
      questions: orderedQuestions
    })
  } catch (error) {
    console.error('Quiz questions API error:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}