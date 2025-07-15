export interface Student {
  id: string
  grade: number
  class: number
  number: number
  name: string
  phone?: string
  session_token?: string
  created_at: string
}

export interface Question {
  id: string
  title: string
  content: string
  image_url?: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  category?: string
  difficulty: number
  created_at: string
  created_by?: string
}

export interface QuizSchedule {
  id: string
  title: string
  question_ids: string[]
  schedule_type: 'daily' | 'weekly' | 'once'
  weekdays?: number[]
  start_time: string
  end_time: string
  start_date: string
  end_date?: string
  time_limit_minutes: number
  is_active: boolean
  created_at: string
}

export interface QuizSession {
  id: string
  student_id: string
  schedule_id: string
  started_at: string
  completed_at?: string
  score: number
  total_questions: number
  answers: Record<string, string>
  time_taken_seconds?: number
}

export interface Portfolio {
  id: string
  student_id: string
  virtual_assets: number
  total_return_rate: number
  last_updated: string
}

export interface StockPrice {
  id: string
  price_date: string
  grade?: number
  class?: number
  price: number
  volume: number
  created_at: string
}

export interface LiveRanking {
  rank: number
  name: string
  grade: number
  class: number
  number: number
  virtual_assets: number
  total_return_rate: number
  quizzes_completed: number
}