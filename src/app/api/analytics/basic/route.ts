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

export async function GET() {
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