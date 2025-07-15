import { v4 as uuidv4 } from 'uuid'
import { supabase, supabaseAdmin } from './supabase'
import { Student } from '@/types/database'

export class SessionManager {
  private static readonly SESSION_KEY = 'student_session_token'

  static getSessionToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.SESSION_KEY)
  }

  static setSessionToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.SESSION_KEY, token)
  }

  static clearSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.SESSION_KEY)
  }

  static async getCurrentStudent(): Promise<Student | null> {
    const token = this.getSessionToken()
    if (!token) return null

    try {
      const response = await fetch('/api/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // 인증 오류 시 세션 클리어
        if (response.status === 401 || response.status === 404) {
          this.clearSession()
        }
        console.error('Failed to get current student:', response.status)
        return null
      }

      const result = await response.json()
      
      if (result.success) {
        return result.student
      }

      return null
    } catch (error) {
      console.error('Error getting current student:', error)
      return null
    }
  }

  static async registerStudent(studentData: {
    grade: number
    class: number
    number: number
    name: string
    phone?: string
  }): Promise<{ student: Student; token: string } | null> {
    try {
      console.log('Attempting to register student:', studentData)
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Registration failed:', result.error)
        return null
      }

      if (result.success) {
        console.log('Student registered successfully:', result.student)
        this.setSessionToken(result.token)
        return { student: result.student, token: result.token }
      }

      return null
    } catch (err) {
      console.error('Unexpected error during registration:', err)
      return null
    }
  }

  static async loginStudent(studentId: string, password: string): Promise<Student | null> {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, password })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Login failed:', result.error)
        return null
      }

      if (result.success) {
        console.log('Login successful:', result.student)
        this.setSessionToken(result.token)
        return result.student
      }

      return null
    } catch (err) {
      console.error('Unexpected error during login:', err)
      return null
    }
  }

  static async updateStudent(updates: Partial<Student>): Promise<Student | null> {
    const token = this.getSessionToken()
    if (!token) return null

    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updates)
      .eq('session_token', token)
      .select()
      .single()

    if (error || !data) return null
    return data as unknown as Student
  }
}