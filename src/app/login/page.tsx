'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'

export default function Login() {
  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.studentId || !formData.password) {
      setError('학번과 비밀번호를 모두 입력해주세요.')
      setLoading(false)
      return
    }

    if (formData.studentId.length !== 4) {
      setError('학번은 4자리여야 합니다. (예: 1305)')
      setLoading(false)
      return
    }

    try {
      const result = await SessionManager.loginStudent(formData.studentId, formData.password)

      if (result) {
        router.push('/')
      } else {
        setError('학번 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            로그인
          </h1>
          <p className="text-gray-600">
            학번과 전화번호 뒷자리로 로그인하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학번
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className="input-field"
              placeholder="1305 (1학년3반5번)"
              maxLength={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              학년 + 반 + 번호 (예: 1학년 3반 5번 → 1305)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="전화번호 뒷자리 4자리"
              maxLength={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              전화번호 뒷자리 4자리 (예: 010-1234-5678 → 5678)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                계정이 없으신가요? 회원가입
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn-secondary w-full"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}