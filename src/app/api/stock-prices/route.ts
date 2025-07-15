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
    const limit = parseInt(searchParams.get('limit') || '30')

    let query = supabase
      .from('stock_prices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (grade) {
      query = query.eq('grade', parseInt(grade))
    }

    if (classNum) {
      query = query.eq('class', parseInt(classNum))
    }

    const { data: stockPrices, error } = await query

    if (error) {
      console.error('Error fetching stock prices:', error)
      return NextResponse.json(
        { error: '주가 데이터 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 날짜순으로 정렬 (차트 표시용)
    const sortedPrices = stockPrices ? stockPrices.reverse() : []

    return NextResponse.json({
      success: true,
      stockPrices: sortedPrices
    })

  } catch (error) {
    console.error('Stock prices API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 주가 업데이트 함수 호출
    const { error } = await supabase.rpc('update_stock_prices')

    if (error) {
      console.error('Error updating stock prices:', error)
      return NextResponse.json(
        { error: '주가 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '주가가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Stock prices update API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}