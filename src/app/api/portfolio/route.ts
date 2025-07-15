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
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 포트폴리오 조회
    let { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('student_id', studentId)
      .single()

    // 포트폴리오가 없으면 생성
    if (portfolioError || !portfolio) {
      const { data: newPortfolio, error: createError } = await supabase
        .from('portfolios')
        .insert({
          student_id: studentId,
          virtual_assets: 1000000,
          total_return_rate: 0.00
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating portfolio:', createError)
        return NextResponse.json(
          { error: '포트폴리오 생성 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      portfolio = newPortfolio
    }

    // 퀴즈 세션 히스토리 조회
    const { data: sessions, error: sessionsError } = await supabase
      .from('quiz_sessions')
      .select(`
        completed_at,
        score,
        total_questions
      `)
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching quiz sessions:', sessionsError)
      return NextResponse.json(
        { error: '퀴즈 세션 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 포트폴리오 히스토리 계산
    let currentValue = 1000000
    const portfolioValue: number[] = [currentValue]
    const dates: string[] = ['시작']
    const quizScores: { date: string; score: number; totalQuestions: number }[] = []

    if (sessions) {
      sessions.forEach((session, index) => {
        const scorePercentage = (session.score / session.total_questions) * 100
        let assetChange = 0

        // 점수에 따른 자산 변화 계산
        if (scorePercentage >= 90) assetChange = 50000
        else if (scorePercentage >= 80) assetChange = 30000
        else if (scorePercentage >= 70) assetChange = 15000
        else if (scorePercentage >= 60) assetChange = 5000
        else if (scorePercentage >= 50) assetChange = 0
        else assetChange = -20000

        currentValue += assetChange
        portfolioValue.push(currentValue)
        dates.push(`퀴즈 ${index + 1}`)
        
        quizScores.push({
          date: new Date(session.completed_at!).toLocaleDateString('ko-KR'),
          score: session.score,
          totalQuestions: session.total_questions
        })
      })
    }

    // 현재 순위 조회
    const { data: rankings, error: rankingsError } = await supabase
      .from('live_rankings')
      .select('*')
      .order('rank', { ascending: true })

    let currentRank = 0
    if (!rankingsError && rankings) {
      // 학생 정보 조회
      const { data: student } = await supabase
        .from('students')
        .select('name, grade, class, number')
        .eq('id', studentId)
        .single()

      if (student) {
        const studentRanking = rankings.find(r => 
          r.name === student.name && 
          r.grade === student.grade &&
          r.class === student.class &&
          r.number === student.number
        )
        currentRank = studentRanking?.rank || 0
      }
    }

    return NextResponse.json({
      success: true,
      portfolio,
      portfolioHistory: {
        portfolioValue,
        dates,
        quizScores
      },
      currentRank
    })

  } catch (error) {
    console.error('Portfolio API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}