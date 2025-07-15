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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Question fetch error:', error)
      return NextResponse.json(
        { error: '문제 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Question API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Question update error:', error)
      return NextResponse.json(
        { error: '문제 수정 중 오류가 발생했습니다: ' + error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      question: data
    })

  } catch (error) {
    console.error('Question API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .delete()
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Question delete error:', error)
      return NextResponse.json(
        { error: '문제 삭제 중 오류가 발생했습니다: ' + error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: '문제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '문제가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Question API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}