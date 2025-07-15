import { supabaseAdmin } from './supabase'
import { Portfolio, StockPrice, LiveRanking } from '@/types/database'

export class PortfolioManager {
  static async getStudentPortfolio(studentId: string): Promise<Portfolio | null> {
    const { data, error } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (error || !data) return null
    return data as unknown as Portfolio
  }

  static async createPortfolio(studentId: string): Promise<Portfolio | null> {
    const { data, error } = await supabaseAdmin
      .from('portfolios')
      .insert({
        student_id: studentId,
        virtual_assets: 1000000,
        total_return_rate: 0.00
      })
      .select()
      .single()

    if (error || !data) return null
    return data as unknown as Portfolio
  }

  static async getLiveRankings(): Promise<LiveRanking[]> {
    const { data, error } = await supabaseAdmin
      .from('live_rankings')
      .select('*')
      .order('rank', { ascending: true })
      .limit(100)

    if (error || !data) return []
    return data as unknown as LiveRanking[]
  }

  static async getClassRankings(grade: number, classNum: number): Promise<LiveRanking[]> {
    const { data, error } = await supabaseAdmin
      .from('live_rankings')
      .select('*')
      .eq('grade', grade)
      .eq('class', classNum)
      .order('rank', { ascending: true })

    if (error || !data) return []
    return data as unknown as LiveRanking[]
  }

  static async getGradeRankings(grade: number): Promise<LiveRanking[]> {
    const { data, error } = await supabaseAdmin
      .from('live_rankings')
      .select('*')
      .eq('grade', grade)
      .order('rank', { ascending: true })

    if (error || !data) return []
    return data as unknown as LiveRanking[]
  }

  static async getStockPrices(
    grade?: number,
    classNum?: number,
    limit: number = 30
  ): Promise<StockPrice[]> {
    let query = supabaseAdmin
      .from('stock_prices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (grade !== undefined) {
      query = query.eq('grade', grade)
    }
    if (classNum !== undefined) {
      query = query.eq('class', classNum)
    }

    const { data, error } = await query

    if (error || !data) return []
    return (data as unknown as StockPrice[]).reverse() // Show oldest to newest for chart
  }

  static async updateStockPrices(): Promise<void> {
    try {
      await supabaseAdmin.rpc('update_stock_prices')
    } catch (error) {
      console.error('Error updating stock prices:', error)
    }
  }

  static async getPortfolioHistory(studentId: string): Promise<{
    portfolioValue: number[]
    dates: string[]
    quizScores: { date: string; score: number; totalQuestions: number }[]
  }> {
    // Get quiz sessions for portfolio tracking
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('quiz_sessions')
      .select(`
        completed_at,
        score,
        total_questions
      `)
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })

    if (sessionsError || !sessions) {
      return { portfolioValue: [], dates: [], quizScores: [] }
    }

    // Calculate portfolio value over time
    let currentValue = 1000000 // Starting value
    const portfolioValue: number[] = [currentValue]
    const dates: string[] = ['시작']
    const quizScores: { date: string; score: number; totalQuestions: number }[] = []

    sessions.forEach((session, index) => {
      const scorePercentage = ((session as any).score / (session as any).total_questions) * 100
      let assetChange = 0

      // Calculate asset change based on score
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
        date: new Date((session as any).completed_at!).toLocaleDateString('ko-KR'),
        score: (session as any).score,
        totalQuestions: (session as any).total_questions
      })
    })

    return { portfolioValue, dates, quizScores }
  }

  static async getTopPerformers(limit: number = 10): Promise<{
    student: LiveRanking
    recentQuizzes: number
    averageScore: number
  }[]> {
    const rankings = await this.getLiveRankings()
    const topStudents = rankings.slice(0, limit)

    const results = await Promise.all(
      topStudents.map(async (student) => {
        // Get student ID from name and class info
        const { data: studentData } = await supabaseAdmin
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

        // Get recent quiz performance
        const { data: recentSessions } = await supabaseAdmin
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
          sum + ((session as any).score / (session as any).total_questions) * 100, 0
        )
        const averageScore = totalScore / recentSessions.length

        return {
          student,
          recentQuizzes: recentSessions.length,
          averageScore: Math.round(averageScore * 10) / 10
        }
      })
    )

    return results
  }

  static calculateRank(assets: number, allAssets: number[]): number {
    const sortedAssets = [...allAssets].sort((a, b) => b - a)
    return sortedAssets.indexOf(assets) + 1
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  static formatReturnRate(rate: number): string {
    return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`
  }

  static getReturnRateColor(rate: number): string {
    if (rate > 0) return 'text-green-600'
    if (rate < 0) return 'text-red-600'
    return 'text-gray-600'
  }
}