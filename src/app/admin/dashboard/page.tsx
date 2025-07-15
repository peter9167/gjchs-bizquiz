'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminManager } from '@/lib/admin'

interface Analytics {
  totalQuizzes: number
  totalStudents: number
  averageScore: number
  completionRate: number
  recentSessions: any[]
}


export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalQuizzes: 0,
    totalStudents: 0,
    averageScore: 0,
    completionRate: 0,
    recentSessions: []
  })
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated')
    if (!isAuthenticated) {
      router.push('/admin/login')
      return
    }
    setAuthChecked(true)
    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }

  const loadDashboardData = async () => {
    try {
      const analyticsData = await AdminManager.getQuizAnalytics()
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated')
    sessionStorage.removeItem('admin_login_time')
    router.push('/admin/login')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">인증 확인 중...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">관리자 대시보드를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                관리자 대시보드
              </h1>
              <p className="text-gray-600">
                GJCHS BizQuiz 관리 시스템
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              로그아웃
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">총 퀴즈</h3>
              <div className="text-3xl font-bold text-blue-600">
                {analytics.totalQuizzes}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">등록 학생</h3>
              <div className="text-3xl font-bold text-green-600">
                {analytics.totalStudents}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">평균 점수</h3>
              <div className="text-3xl font-bold text-purple-600">
                {analytics.averageScore}%
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">완료율</h3>
              <div className="text-3xl font-bold text-orange-600">
                {analytics.completionRate}%
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div 
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/questions')}
            >
              <h2 className="text-xl font-bold mb-4 text-blue-600">📝 문제 관리</h2>
              <p className="text-gray-600">
                퀴즈 문제를 생성, 수정, 삭제하고 이미지를 업로드할 수 있습니다.
              </p>
            </div>

            <div 
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/schedules')}
            >
              <h2 className="text-xl font-bold mb-4 text-green-600">📅 일정 관리</h2>
              <p className="text-gray-600">
                퀴즈 일정을 생성하고 자동 활성화 시간을 설정할 수 있습니다.
              </p>
            </div>

            <div 
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/students')}
            >
              <h2 className="text-xl font-bold mb-4 text-purple-600">👥 학생 관리</h2>
              <p className="text-gray-600">
                등록된 학생들의 정보를 확인하고 관리할 수 있습니다.
              </p>
            </div>

            <div 
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/analytics')}
            >
              <h2 className="text-xl font-bold mb-4 text-indigo-600">📊 분석 리포트</h2>
              <p className="text-gray-600">
                상세한 통계와 성과 분석을 확인할 수 있습니다.
              </p>
            </div>


            <div 
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/rankings')}
            >
              <h2 className="text-xl font-bold mb-4 text-yellow-600">🏆 실시간 랭킹</h2>
              <p className="text-gray-600">
                학생들의 실시간 자산 순위와 성과를 상세히 모니터링할 수 있습니다.
              </p>
            </div>

            <div 
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/export')}
            >
              <h2 className="text-xl font-bold mb-4 text-orange-600">📤 데이터 내보내기</h2>
              <p className="text-gray-600">
                퀴즈 결과와 학생 데이터를 CSV 형태로 내보낼 수 있습니다.
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">최근 퀴즈 세션</h2>
            {analytics.recentSessions.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentSessions.slice(0, 10).map((session, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">
                          {session.students?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {session.students?.grade}학년 {session.students?.class}반
                        </div>
                        <div className="text-sm text-gray-600">
                          {session.quiz_schedules?.title || 'Unknown Quiz'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {session.score}/{session.total_questions}
                        </div>
                        <div className="text-sm text-gray-600">
                          {Math.round((session.score / session.total_questions) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(session.completed_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                아직 완료된 퀴즈 세션이 없습니다.
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/admin/questions/new')}
              className="btn-primary"
            >
              새 문제 추가
            </button>
            
            <button
              onClick={() => router.push('/admin/schedules/new')}
              className="btn-secondary"
            >
              새 일정 생성
            </button>
            
            <button
              onClick={() => router.push('/rankings')}
              className="btn-secondary"
            >
              실시간 랭킹 보기
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              학생 페이지로 이동
            </button>

            <button
              onClick={loadDashboardData}
              className="btn-secondary"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}