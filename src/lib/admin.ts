import { supabase, createServerClient } from './supabase'
import { Question, QuizSchedule, Student, QuizSession } from '@/types/database'

export class AdminManager {
  private static serverClient = createServerClient()

  // Question Management
  static async getAllQuestions(): Promise<Question[]> {
    const { data, error } = await this.serverClient
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getQuestion(id: string): Promise<Question | null> {
    const { data, error } = await this.serverClient
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  static async createQuestion(questionData: Omit<Question, 'id' | 'created_at'>): Promise<Question | null> {
    const { data, error } = await this.serverClient
      .from('questions')
      .insert(questionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return null
    }
    return data
  }

  static async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
    const { data, error } = await this.serverClient
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return null
    }
    return data
  }

  static async deleteQuestion(id: string): Promise<boolean> {
    const { error } = await this.serverClient
      .from('questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting question:', error)
      return false
    }
    return true
  }

  // Quiz Schedule Management
  static async getAllSchedules(): Promise<QuizSchedule[]> {
    try {
      const response = await fetch('/api/schedules')
      const result = await response.json()
      
      if (result.success) {
        return result.schedules
      }
      
      throw new Error(result.error || 'Failed to fetch schedules')
    } catch (error) {
      console.error('Error fetching schedules:', error)
      return []
    }
  }

  static async createSchedule(scheduleData: Omit<QuizSchedule, 'id' | 'created_at'>): Promise<QuizSchedule | null> {
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      })

      const result = await response.json()
      
      if (result.success) {
        return result.schedule
      }
      
      console.error('Error creating schedule:', result.error)
      return null
    } catch (error) {
      console.error('Error creating schedule:', error)
      return null
    }
  }

  static async updateSchedule(id: string, updates: Partial<QuizSchedule>): Promise<QuizSchedule | null> {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()
      
      if (result.success) {
        return result.schedule
      }
      
      console.error('Error updating schedule:', result.error)
      return null
    } catch (error) {
      console.error('Error updating schedule:', error)
      return null
    }
  }

  static async deleteSchedule(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        return true
      }
      
      console.error('Error deleting schedule:', result.error)
      return false
    } catch (error) {
      console.error('Error deleting schedule:', error)
      return false
    }
  }

  // Student Management
  static async getAllStudents(): Promise<Student[]> {
    try {
      const response = await fetch('/api/students')
      const result = await response.json()
      
      if (result.success) {
        return result.students
      }
      
      console.error('Error fetching students:', result.error)
      return []
    } catch (error) {
      console.error('Error fetching students:', error)
      return []
    }
  }

  static async deleteStudent(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        return true
      }
      
      console.error('Error deleting student:', result.error)
      return false
    } catch (error) {
      console.error('Error deleting student:', error)
      return false
    }
  }

  // Analytics
  static async getQuizAnalytics(): Promise<{
    totalQuizzes: number
    totalStudents: number
    averageScore: number
    completionRate: number
    recentSessions: QuizSession[]
  }> {
    try {
      const response = await fetch('/api/analytics/basic')
      const result = await response.json()
      
      if (result.success) {
        return result.analytics
      }
      
      console.error('Error getting quiz analytics:', result.error)
      return {
        totalQuizzes: 0,
        totalStudents: 0,
        averageScore: 0,
        completionRate: 0,
        recentSessions: []
      }
    } catch (error) {
      console.error('Error getting analytics:', error)
      return {
        totalQuizzes: 0,
        totalStudents: 0,
        averageScore: 0,
        completionRate: 0,
        recentSessions: []
      }
    }
  }

  static async getDetailedAnalytics(): Promise<{
    scoreDistribution: { range: string; count: number }[]
    dailyQuizActivity: { date: string; count: number }[]
    classPerformance: { grade: number; class: number; averageScore: number; studentCount: number }[]
  }> {
    try {
      const response = await fetch('/api/analytics')
      const result = await response.json()
      
      if (result.success) {
        return result.analytics
      }
      
      console.error('Error getting detailed analytics:', result.error)
      return {
        scoreDistribution: [],
        dailyQuizActivity: [],
        classPerformance: []
      }
    } catch (error) {
      console.error('Error getting detailed analytics:', error)
      return {
        scoreDistribution: [],
        dailyQuizActivity: [],
        classPerformance: []
      }
    }
  }

  // Export functions
  static async exportQuizResults(): Promise<string> {
    try {
      const { data: sessions } = await this.serverClient
        .from('quiz_sessions')
        .select(`
          *,
          students (name, grade, class, number, phone),
          quiz_schedules (title)
        `)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })

      if (!sessions) return ''

      const headers = [
        '퀴즈 제목',
        '학생 이름',
        '학년',
        '반',
        '번호',
        '전화번호',
        '점수',
        '총 문제수',
        '정답률(%)',
        '소요시간(초)',
        '완료 일시'
      ]

      const csvData = sessions.map(session => [
        session.quiz_schedules?.title || '',
        session.students?.name || '',
        session.students?.grade || '',
        session.students?.class || '',
        session.students?.number || '',
        session.students?.phone || '',
        session.score,
        session.total_questions,
        Math.round((session.score / session.total_questions) * 100 * 10) / 10,
        session.time_taken_seconds || '',
        session.completed_at ? new Date(session.completed_at).toLocaleString('ko-KR') : ''
      ])

      return [headers, ...csvData]
        .map(row => row.map(field => {
          // CSV 필드에서 따옴표 이스케이프 처리
          const stringField = String(field).replace(/"/g, '""')
          return `"${stringField}"`
        }).join(','))
        .join('\r\n') // Windows Excel 호환성을 위해 \r\n 사용
    } catch (error) {
      console.error('Error exporting quiz results:', error)
      return ''
    }
  }

  static async exportStudentData(): Promise<string> {
    try {
      const students = await this.getAllStudents()

      const headers = [
        '이름',
        '학년',
        '반',
        '번호',
        '전화번호',
        '등록 일시'
      ]

      const csvData = students.map(student => [
        student.name,
        student.grade,
        student.class,
        student.number,
        student.phone || '',
        new Date(student.created_at).toLocaleString('ko-KR')
      ])

      return [headers, ...csvData]
        .map(row => row.map(field => {
          // CSV 필드에서 따옴표 이스케이프 처리
          const stringField = String(field).replace(/"/g, '""')
          return `"${stringField}"`
        }).join(','))
        .join('\r\n') // Windows Excel 호환성을 위해 \r\n 사용
    } catch (error) {
      console.error('Error exporting student data:', error)
      return ''
    }
  }

}