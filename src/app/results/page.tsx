'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'
// import { QuizManager } from '@/lib/quiz'  // API 호출로 대체
import { Student, QuizSession } from '@/types/database'

export default function ResultsPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'recent' | 'best'>('all')
  const router = useRouter()

  useEffect(() => {
    loadResultsData()
  }, [])

  const loadResultsData = async () => {
    try {
      const currentStudent = await SessionManager.getCurrentStudent()
      if (!currentStudent) {
        router.push('/')
        return
      }
      setStudent(currentStudent)

      const response = await fetch(`/api/quiz/sessions?studentId=${currentStudent.id}`)
      const data = await response.json()
      
      if (data.success) {
        setQuizSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredSessions = () => {
    switch (filter) {
      case 'recent':
        return quizSessions.slice(0, 5)
      case 'best':
        return [...quizSessions]
          .sort((a, b) => (b.score / b.total_questions) - (a.score / a.total_questions))
          .slice(0, 10)
      default:
        return quizSessions
    }
  }

  const getOverallStats = () => {
    if (quizSessions.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0,
        improvementTrend: 0
      }
    }

    const totalQuizzes = quizSessions.length
    const totalScore = quizSessions.reduce((sum, session) => 
      sum + (session.score / session.total_questions) * 100, 0
    )
    const averageScore = totalScore / totalQuizzes

    const bestSession = quizSessions.reduce((best, session) => 
      (session.score / session.total_questions) > (best.score / best.total_questions) ? session : best
    )
    const bestScore = (bestSession.score / bestSession.total_questions) * 100

    const totalTimeSpent = quizSessions.reduce((sum, session) => 
      sum + (session.time_taken_seconds || 0), 0
    )

    // Calculate improvement trend (last 5 vs first 5)
    let improvementTrend = 0
    if (totalQuizzes >= 6) {
      const firstFive = quizSessions.slice(-5).reduce((sum, session) => 
        sum + (session.score / session.total_questions) * 100, 0
      ) / 5
      const lastFive = quizSessions.slice(0, 5).reduce((sum, session) => 
        sum + (session.score / session.total_questions) * 100, 0
      ) / 5
      improvementTrend = lastFive - firstFive
    }

    return {
      totalQuizzes,
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore: Math.round(bestScore * 10) / 10,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
      improvementTrend: Math.round(improvementTrend * 10) / 10
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}분 ${secs}초`
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600'
      case 'B': return 'text-blue-600'
      case 'C': return 'text-yellow-600'
      case 'D': return 'text-orange-600'
      default: return 'text-red-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">결과를 불러오는 중...</div>
      </div>
    )
  }

  const stats = getOverallStats()
  const filteredSessions = getFilteredSessions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {student?.name}님의 퀴즈 결과
            </h1>
            <p className="text-gray-600">
              지금까지의 퀴즈 성과와 성장 기록을 확인해보세요
            </p>
          </div>

          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">총 퀴즈</h3>
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalQuizzes}개
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">평균 점수</h3>
              <div className="text-3xl font-bold text-green-600">
                {stats.averageScore}%
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">최고 점수</h3>
              <div className="text-3xl font-bold text-purple-600">
                {stats.bestScore}%
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">총 소요시간</h3>
              <div className="text-3xl font-bold text-orange-600">
                {stats.totalTimeSpent}분
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">성장세</h3>
              <div className={`text-3xl font-bold ${
                stats.improvementTrend > 0 ? 'text-green-600' : 
                stats.improvementTrend < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend}%
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="card mb-8">
            <div className="flex space-x-2 bg-gray-100 rounded-lg p-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                전체 결과 ({quizSessions.length})
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  filter === 'recent'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                최근 5개
              </button>
              <button
                onClick={() => setFilter('best')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  filter === 'best'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                최고 성과 10개
              </button>
            </div>
          </div>

          {/* Quiz Results */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {filter === 'all' ? '전체 퀴즈 결과' :
               filter === 'recent' ? '최근 퀴즈 결과' : '최고 성과 결과'}
            </h2>

            {filteredSessions.length > 0 ? (
              <div className="space-y-4">
                {filteredSessions.map((session, index) => {
                  const percentage = (session.score / session.total_questions) * 100
                  const grade = getGrade(percentage)
                  
                  return (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-6 border">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {(session as any).quiz_schedules?.title || `퀴즈 #${index + 1}`}
                            </h3>
                            <span className={`text-lg font-bold ${getGradeColor(grade)}`}>
                              {grade}등급
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">점수:</span><br />
                              <span className="text-lg font-bold text-gray-900">
                                {session.score}/{session.total_questions}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">정답률:</span><br />
                              <span className="text-lg font-bold text-gray-900">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">소요시간:</span><br />
                              <span className="text-lg font-bold text-gray-900">
                                {session.time_taken_seconds ? formatTime(session.time_taken_seconds) : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">완료일:</span><br />
                              <span className="text-lg font-bold text-gray-900">
                                {new Date(session.completed_at!).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <button
                            onClick={() => router.push(`/quiz/results?sessionId=${session.id}`)}
                            className="btn-secondary text-sm"
                          >
                            상세 보기
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            percentage >= 90 ? 'bg-green-500' :
                            percentage >= 80 ? 'bg-blue-500' :
                            percentage >= 70 ? 'bg-yellow-500' :
                            percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {filter === 'all' ? '아직 완료한 퀴즈가 없습니다.' :
                   filter === 'recent' ? '최근 퀴즈 결과가 없습니다.' : '성과 기록이 없습니다.'}
                </p>
                <button
                  onClick={() => router.push('/quiz')}
                  className="btn-primary"
                >
                  첫 퀴즈 시작하기
                </button>
              </div>
            )}
          </div>

          {/* Performance Analysis */}
          {quizSessions.length > 0 && (
            <div className="card mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">성과 분석</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold mb-4">등급별 분포</h3>
                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D', 'F'].map(grade => {
                      const count = quizSessions.filter(session => 
                        getGrade((session.score / session.total_questions) * 100) === grade
                      ).length
                      const percentage = quizSessions.length > 0 ? (count / quizSessions.length) * 100 : 0
                      
                      return (
                        <div key={grade} className="flex items-center">
                          <span className={`w-8 font-bold ${getGradeColor(grade)}`}>
                            {grade}:
                          </span>
                          <div className="flex-1 mx-3 bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full ${
                                grade === 'A' ? 'bg-green-500' :
                                grade === 'B' ? 'bg-blue-500' :
                                grade === 'C' ? 'bg-yellow-500' :
                                grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12">
                            {count}개
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-4">개선 제안</h3>
                  <div className="space-y-3 text-sm">
                    {stats.averageScore < 70 && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <strong>📚 기초 학습 강화:</strong> 평균 점수가 70% 미만입니다. 기본 개념 복습을 권장합니다.
                      </div>
                    )}
                    {stats.improvementTrend < 0 && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <strong>📈 성장세 회복:</strong> 최근 성과가 하락했습니다. 학습 방법을 점검해보세요.
                      </div>
                    )}
                    {stats.improvementTrend > 5 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <strong>🎉 훌륭한 성장:</strong> 지속적인 향상을 보이고 있습니다. 이 추세를 유지하세요!
                      </div>
                    )}
                    {stats.averageScore >= 85 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <strong>🏆 우수한 성과:</strong> 높은 평균 점수를 유지하고 있습니다. 계속 노력하세요!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/quiz')}
              className="btn-primary"
            >
              새 퀴즈 참여
            </button>
            
            <button
              onClick={() => router.push('/portfolio')}
              className="btn-secondary"
            >
              포트폴리오 보기
            </button>
            
            <button
              onClick={() => router.push('/rankings')}
              className="btn-secondary"
            >
              랭킹 확인
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              홈으로 가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}