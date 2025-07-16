import { supabaseAdmin } from './supabase'
import { Question, QuizSchedule, QuizSession } from '@/types/database'

export class QuizManager {
  static async getActiveQuiz(): Promise<QuizSchedule | null> {
    try {
      const response = await fetch('/api/quiz')
      const result = await response.json()
      
      if (result.success) {
        return result.quiz
      }
      
      return null
    } catch (error) {
      console.error('Error fetching active quiz:', error)
      return null
    }
  }

  static async getActiveQuizzes(): Promise<QuizSchedule[]> {
    try {
      const response = await fetch('/api/quiz')
      const result = await response.json()
      
      if (result.success && result.quizzes) {
        return result.quizzes
      }
      
      return []
    } catch (error) {
      console.error('Error fetching active quizzes:', error)
      return []
    }
  }

  static async getQuizQuestions(questionIds: string[]): Promise<Question[]> {
    try {
      console.log('Fetching quiz questions with IDs:', questionIds)
      
      const response = await fetch(`/api/quiz/questions?ids=${questionIds.join(',')}`)
      const data = await response.json()
      console.log('Quiz questions response:', data)
      
      if (data.success) {
        return data.questions
      } else {
        console.error('Failed to fetch quiz questions:', data.error)
        return []
      }
    } catch (error) {
      console.error('Error fetching quiz questions:', error)
      return []
    }
  }

  static async startQuizSession(
    studentId: string,
    scheduleId: string,
    totalQuestions: number
  ): Promise<string | null> {
    try {
      console.log('Starting quiz session with:', { studentId, scheduleId, totalQuestions })
      
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          scheduleId,
          totalQuestions
        })
      })
      
      const result = await response.json()
      console.log('Quiz session response:', result)
      
      if (result.success) {
        return result.sessionId
      } else {
        console.error('Failed to create quiz session:', result.error)
        return null
      }
    } catch (error) {
      console.error('Error starting quiz session:', error)
      return null
    }
  }

  static async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/quiz/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          questionId,
          answer
        })
      })
      
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error submitting answer:', error)
      return false
    }
  }

  static async completeQuizSession(
    sessionId: string,
    questions: Question[],
    timeTakenSeconds: number
  ): Promise<{ score: number; results: Array<{ question: Question; userAnswer: string; correct: boolean }> } | null> {
    try {
      const response = await fetch('/api/quiz/session', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          timeTakenSeconds
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        return {
          score: result.score,
          results: result.results
        }
      }
      
      return null
    } catch (error) {
      console.error('Error completing quiz session:', error)
      return null
    }
  }

  static async getStudentQuizSessions(studentId: string): Promise<QuizSession[]> {
    const { data, error } = await supabaseAdmin
      .from('quiz_sessions')
      .select(`
        *,
        quiz_schedules (
          title
        )
      `)
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (error || !data) return []
    return data as unknown as QuizSession[]
  }

  static async hasStudentTakenQuiz(
    studentId: string,
    scheduleId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/quiz/check?studentId=${studentId}&scheduleId=${scheduleId}`)
      const result = await response.json()
      return result.hasTaken || false
    } catch (error) {
      console.error('Error checking quiz status:', error)
      return false
    }
  }
}