'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'

export default function Register() {
  const [formData, setFormData] = useState({
    grade: '',
    class: '',
    number: '',
    name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate form data
    if (!formData.grade || !formData.class || !formData.number || !formData.name || !formData.phone) {
      setError('모든 필수 항목을 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      console.log('Form data being submitted:', formData)
      
      const result = await SessionManager.registerStudent({
        grade: parseInt(formData.grade),
        class: parseInt(formData.class),
        number: parseInt(formData.number),
        name: formData.name.trim(),
        phone: formData.phone.trim()
      })

      console.log('Registration result:', result)

      if (result) {
        console.log('Registration successful, redirecting to home')
        router.push('/')
      } else {
        setError('등록에 실패했습니다. 개발자 도구의 콘솔을 확인해주세요.')
      }
    } catch (err) {
      console.error('Registration error in component:', err)
      setError('등록 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
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
            학생 등록
          </h1>
          <p className="text-gray-600">
            퀴즈쇼 참여를 위해 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학년
            </label>
            <input
              type="number"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="input-field"
              placeholder="1, 2, 3"
              min="1"
              max="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              반
            </label>
            <input
              type="number"
              name="class"
              value={formData.class}
              onChange={handleChange}
              className="input-field"
              placeholder="반 번호"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              번호
            </label>
            <input
              type="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              className="input-field"
              placeholder="출석번호"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="실명 입력"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호 (필수 - 로그인 비밀번호로 사용)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="010-1234-5678"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              전화번호 뒷자리 4자리가 로그인 비밀번호가 됩니다
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
              {loading ? '등록중...' : '등록하기'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                이미 계정이 있으신가요? 로그인
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