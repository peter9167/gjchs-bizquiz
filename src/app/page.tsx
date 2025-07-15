'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Student } from '@/types/database'

export default function Home() {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }
    
    try {
      const currentStudent = await SessionManager.getCurrentStudent()
      setStudent(currentStudent)
    } catch (error) {
      console.error('Session check failed:', error)
      SessionManager.clearSession()
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩중...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="card max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              광주여자상업고등학교<br />
              모의주식 퀴즈
            </h1>
            <p className="text-gray-600">
              퀴즈를 통해 가상 자산을 늘려보세요!
            </p>
          </div>
          
          {!isSupabaseConfigured() ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">⚙️ 설정 필요</h3>
              <p className="text-sm text-yellow-700 mb-3">
                Supabase 환경 변수를 설정해야 합니다:
              </p>
              <ol className="text-xs text-yellow-700 space-y-1 mb-3">
                <li>1. Supabase.com에서 새 프로젝트 생성</li>
                <li>2. database-schema.sql 실행</li>
                <li>3. .env.local 파일의 환경 변수 설정</li>
              </ol>
              <p className="text-xs text-yellow-600">
                현재는 데모 모드로 동작합니다.
              </p>
            </div>
          ) : null}
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className={`w-full text-lg py-3 ${
                isSupabaseConfigured() 
                  ? 'btn-primary' 
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
              disabled={!isSupabaseConfigured()}
            >
              로그인
            </button>

            <button
              onClick={() => router.push('/register')}
              className={`w-full text-lg py-3 ${
                isSupabaseConfigured() 
                  ? 'btn-secondary' 
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
              disabled={!isSupabaseConfigured()}
            >
              학생 등록하기
            </button>
            
            
            {!isSupabaseConfigured() && (
              <div className="text-center">
                <button
                  onClick={() => window.open('https://supabase.com', '_blank')}
                  className="btn-primary w-full"
                >
                  Supabase 설정하러 가기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            안녕하세요, {student.name}님!
          </h1>
          <p className="text-gray-600">
            {student.grade}학년 {student.class}반 {student.number}번
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/quiz/select')}
          >
            <h2 className="text-xl font-bold mb-4 text-blue-600">📝 퀴즈 참여</h2>
            <p className="text-gray-600">
              퀴즈에 참여하여 가상 자산을 늘려보세요.
            </p>
          </div>

          <div 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/portfolio')}
          >
            <h2 className="text-xl font-bold mb-4 text-green-600">💰 내 포트폴리오</h2>
            <p className="text-gray-600">
              현재 보유 자산과 수익률을 확인해보세요.
            </p>
          </div>

          <div 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/rankings')}
          >
            <h2 className="text-xl font-bold mb-4 text-purple-600">🏆 실시간 랭킹</h2>
            <p className="text-gray-600">
              전체 학생들의 자산 순위를 확인해보세요.
            </p>
          </div>

          <div 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/stock-chart')}
          >
            <h2 className="text-xl font-bold mb-4 text-orange-600">📈 주가 차트</h2>
            <p className="text-gray-600">
              학급별 모의 주가 움직임을 확인해보세요.
            </p>
          </div>

          <div 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/results')}
          >
            <h2 className="text-xl font-bold mb-4 text-indigo-600">📊 퀴즈 결과</h2>
            <p className="text-gray-600">
              지난 퀴즈 결과와 성과를 확인해보세요.
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-red-600">⚙️ 설정</h2>
            <button
              onClick={() => {
                SessionManager.clearSession()
                window.location.reload()
              }}
              className="btn-secondary w-full"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}