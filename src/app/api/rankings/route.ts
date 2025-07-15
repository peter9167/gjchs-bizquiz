import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 이 경로는 동적으로 렌더링되어야 함
export const dynamic = 'force-dynamic'

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

// 통합된 랭킹 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'top-performers':
        return await handleTopPerformers(searchParams)
      default:
        return await handleRankings(searchParams)
    }
  } catch (error) {
    console.error('Rankings API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 기본 랭킹 조회 (기존 /api/rankings)
async function handleRankings(searchParams: URLSearchParams) {
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
}

// 상위 성과자 조회 (기존 /api/rankings/top-performers)
async function handleTopPerformers(searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get('limit') || '10')

  // 상위 랭킹 조회
  const { data: rankings, error: rankingsError } = await supabase
    .from('live_rankings')
    .select('*')
    .order('rank', { ascending: true })
    .limit(limit)

  if (rankingsError) {
    console.error('Error fetching top performers:', rankingsError)
    return NextResponse.json(
      { error: '상위 성과자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  if (!rankings || rankings.length === 0) {
    return NextResponse.json({
      success: true,
      topPerformers: []
    })
  }

  // 각 상위 성과자의 최근 퀴즈 성과 조회
  const topPerformers = await Promise.all(
    rankings.map(async (student) => {
      try {
        // 학생 ID 조회
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('name', student.name)
          .eq('grade', student.grade)
          .eq('class', student.class)
          .eq('number', student.number)
          .single()

        if (!studentData) {
          return {
            student,
            recentQuizzes: 0,
            averageScore: 0
          }
        }

        // 최근 퀴즈 성과 조회
        const { data: recentSessions } = await supabase
          .from('quiz_sessions')
          .select('score, total_questions')
          .eq('student_id', studentData.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(5)

        if (!recentSessions || recentSessions.length === 0) {
          return {
            student,
            recentQuizzes: 0,
            averageScore: 0
          }
        }

        const totalScore = recentSessions.reduce((sum, session) => 
          sum + (session.score / session.total_questions) * 100, 0
        )
        const averageScore = totalScore / recentSessions.length

        return {
          student,
          recentQuizzes: recentSessions.length,
          averageScore: Math.round(averageScore * 10) / 10
        }
      } catch (error) {
        console.error('Error fetching student performance:', error)
        return {
          student,
          recentQuizzes: 0,
          averageScore: 0
        }
      }
    })
  )

  return NextResponse.json({
    success: true,
    topPerformers
  })
}