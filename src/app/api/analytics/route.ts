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

// 통합된 분석 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'basic':
        return await handleBasicAnalytics()
      default:
        return await handleDetailedAnalytics()
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 기본 분석 (기존 /api/analytics/basic)
async function handleBasicAnalytics() {
  try {
    const [
      { count: totalQuizzes },
      { count: totalStudents },
      { data: sessions }
    ] = await Promise.all([
      supabase.from('quiz_schedules').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase
        .from('quiz_sessions')
        .select(`
          *,
          students (name, grade, class, number),
          quiz_schedules (title)
        `)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10)
    ])

    const completedSessions = sessions || []
    const averageScore = completedSessions.length > 0
      ? completedSessions.reduce((sum, session) => sum + (session.score / session.total_questions) * 100, 0) / completedSessions.length
      : 0

    return NextResponse.json({
      success: true,
      analytics: {
        totalQuizzes: totalQuizzes || 0,
        totalStudents: totalStudents || 0,
        averageScore: Math.round(averageScore * 10) / 10,
        completionRate: completedSessions.length > 0 ? Math.round((completedSessions.length / (totalStudents || 1)) * 100) : 0,
        recentSessions: completedSessions
      }
    })
  } catch (error) {
    console.error('Basic analytics API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 상세 분석 (기존 /api/analytics)
async function handleDetailedAnalytics() {
  try {
    // 퀴즈 세션 데이터 가져오기
    const { data: sessions, error } = await supabase
      .from('quiz_sessions')
      .select(`
        score,
        total_questions,
        completed_at,
        students (grade, class)
      `)
      .not('completed_at', 'is', null)

    if (error) {
      console.error('Error fetching quiz sessions:', error)
      return NextResponse.json(
        { error: '퀴즈 세션 데이터를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          scoreDistribution: [],
          dailyQuizActivity: [],
          classPerformance: []
        }
      })
    }

    // Score distribution
    const scoreRanges = [
      { range: '90-100%', min: 90, max: 100, count: 0 },
      { range: '80-89%', min: 80, max: 89, count: 0 },
      { range: '70-79%', min: 70, max: 79, count: 0 },
      { range: '60-69%', min: 60, max: 69, count: 0 },
      { range: '0-59%', min: 0, max: 59, count: 0 }
    ]

    sessions.forEach(session => {
      const percentage = (session.score / session.total_questions) * 100
      scoreRanges.forEach(range => {
        if (percentage >= range.min && percentage <= range.max) {
          range.count++
        }
      })
    })

    // Daily activity (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().slice(0, 10)
    }).reverse()

    const dailyQuizActivity = last7Days.map(date => ({
      date,
      count: sessions.filter(session => 
        session.completed_at?.slice(0, 10) === date
      ).length
    }))

    // Class performance
    const classMap = new Map()
    sessions.forEach(session => {
      if (session.students && !Array.isArray(session.students)) {
        const student = session.students as any
        const key = `${student.grade}-${student.class}`
        if (!classMap.has(key)) {
          classMap.set(key, {
            grade: student.grade,
            class: student.class,
            scores: [],
            studentCount: 0
          })
        }
        classMap.get(key).scores.push((session.score / session.total_questions) * 100)
      }
    })

    const classPerformance = Array.from(classMap.values()).map(classData => ({
      grade: classData.grade,
      class: classData.class,
      averageScore: Math.round(
        classData.scores.reduce((sum: number, score: number) => sum + score, 0) / classData.scores.length * 10
      ) / 10,
      studentCount: new Set(classData.scores).size
    }))

    return NextResponse.json({
      success: true,
      analytics: {
        scoreDistribution: scoreRanges.map(range => ({ range: range.range, count: range.count })),
        dailyQuizActivity,
        classPerformance,
        totalSessions: sessions.length
      }
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}