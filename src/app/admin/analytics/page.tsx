'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminManager } from '@/lib/admin'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface DetailedAnalytics {
  scoreDistribution: { range: string; count: number }[]
  dailyQuizActivity: { date: string; count: number }[]
  classPerformance: { grade: number; class: number; averageScore: number; studentCount: number }[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<DetailedAnalytics>({
    scoreDistribution: [],
    dailyQuizActivity: [],
    classPerformance: []
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAdminAuth()

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics()
    }
  }, [isAuthenticated])

  const loadAnalytics = async () => {
    try {
      const data = await AdminManager.getDetailedAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const scoreDistributionChart = {
    labels: analytics.scoreDistribution.map(item => item.range),
    datasets: [
      {
        label: '학생 수',
        data: analytics.scoreDistribution.map(item => item.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // 90-100%
          'rgba(59, 130, 246, 0.8)',  // 80-89%
          'rgba(251, 191, 36, 0.8)',  // 70-79%
          'rgba(249, 115, 22, 0.8)',  // 60-69%
          'rgba(239, 68, 68, 0.8)',   // 0-59%
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const dailyActivityChart = {
    labels: analytics.dailyQuizActivity.map(item => 
      new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: '퀴즈 완료 수',
        data: analytics.dailyQuizActivity.map(item => item.count),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const classPerformanceChart = {
    labels: analytics.classPerformance.map(item => `${item.grade}학년 ${item.class}반`),
    datasets: [
      {
        label: '평균 점수 (%)',
        data: analytics.classPerformance.map(item => item.averageScore),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  }

  const getTopPerformingClass = () => {
    if (analytics.classPerformance.length === 0) return null
    return analytics.classPerformance.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    )
  }

  const getTotalQuizzes = () => {
    return analytics.dailyQuizActivity.reduce((sum, day) => sum + day.count, 0)
  }

  const getAverageScore = () => {
    const totalScores = analytics.scoreDistribution.reduce((sum, range, index) => {
      const midpoint = index === 0 ? 95 : index === 1 ? 84.5 : index === 2 ? 74.5 : index === 3 ? 64.5 : 30
      return sum + (range.count * midpoint)
    }, 0)
    const totalStudents = analytics.scoreDistribution.reduce((sum, range) => sum + range.count, 0)
    return totalStudents > 0 ? Math.round((totalScores / totalStudents) * 10) / 10 : 0
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">분석 데이터를 불러오는 중...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const topClass = getTopPerformingClass()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">분석 리포트</h1>
                <p className="text-gray-600">상세한 통계와 성과 분석을 확인하세요</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={loadAnalytics}
                  className="btn-secondary"
                >
                  새로고침
                </button>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="btn-secondary"
                >
                  대시보드로 돌아가기
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">총 퀴즈 완료</h3>
              <div className="text-3xl font-bold text-blue-600">
                {getTotalQuizzes()}개
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">전체 평균 점수</h3>
              <div className="text-3xl font-bold text-green-600">
                {getAverageScore()}%
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">활성 학급 수</h3>
              <div className="text-3xl font-bold text-purple-600">
                {analytics.classPerformance.length}개
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">최고 성과 학급</h3>
              <div className="text-lg font-bold text-orange-600">
                {topClass ? `${topClass.grade}학년 ${topClass.class}반` : 'N/A'}
              </div>
              {topClass && (
                <div className="text-sm text-gray-600">
                  평균 {topClass.averageScore}%
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Score Distribution */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">점수 분포</h2>
              {analytics.scoreDistribution.length > 0 ? (
                <div className="h-80">
                  <Bar 
                    data={scoreDistributionChart} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: '학생들의 퀴즈 점수 분포',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: '학생 수'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: '점수 범위'
                          }
                        }
                      },
                    }} 
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  데이터가 없습니다
                </div>
              )}
            </div>

            {/* Daily Activity */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">일별 퀴즈 활동</h2>
              {analytics.dailyQuizActivity.length > 0 ? (
                <div className="h-80">
                  <Line 
                    data={dailyActivityChart} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: '최근 7일간 퀴즈 완료 추이',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: '완료 수'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: '날짜'
                          }
                        }
                      },
                    }} 
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  데이터가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* Class Performance */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">학급별 성과</h2>
            {analytics.classPerformance.length > 0 ? (
              <div className="h-80">
                <Bar 
                  data={classPerformanceChart} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      title: {
                        display: true,
                        text: '학급별 평균 퀴즈 점수',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: '평균 점수 (%)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: '학급'
                        }
                      }
                    },
                  }} 
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                데이터가 없습니다
              </div>
            )}
          </div>

          {/* Detailed Stats Table */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">학급별 상세 통계</h2>
            {analytics.classPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">순위</th>
                      <th className="text-left py-3 px-2">학급</th>
                      <th className="text-right py-3 px-2">평균 점수</th>
                      <th className="text-right py-3 px-2">참여 학생 수</th>
                      <th className="text-right py-3 px-2">등급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...analytics.classPerformance]
                      .sort((a, b) => b.averageScore - a.averageScore)
                      .map((classData, index) => {
                        const grade = classData.averageScore >= 90 ? 'A' :
                                     classData.averageScore >= 80 ? 'B' :
                                     classData.averageScore >= 70 ? 'C' :
                                     classData.averageScore >= 60 ? 'D' : 'F'
                        
                        const gradeColor = grade === 'A' ? 'text-green-600' :
                                          grade === 'B' ? 'text-blue-600' :
                                          grade === 'C' ? 'text-yellow-600' :
                                          grade === 'D' ? 'text-orange-600' : 'text-red-600'

                        return (
                          <tr key={`${classData.grade}-${classData.class}`} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-2 font-bold">
                              {index + 1}위
                            </td>
                            <td className="py-3 px-2 font-medium">
                              {classData.grade}학년 {classData.class}반
                            </td>
                            <td className="py-3 px-2 text-right font-bold">
                              {classData.averageScore.toFixed(1)}%
                            </td>
                            <td className="py-3 px-2 text-right">
                              {classData.studentCount}명
                            </td>
                            <td className={`py-3 px-2 text-right font-bold ${gradeColor}`}>
                              {grade}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                학급 데이터가 없습니다
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="card mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">인사이트 및 권장사항</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">📊 주요 발견사항</h3>
                
                <div className="space-y-3 text-sm">
                  {getAverageScore() >= 80 ? (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <strong>✅ 우수한 전체 성과:</strong> 전체 평균 점수가 80% 이상으로 매우 우수합니다.
                    </div>
                  ) : getAverageScore() >= 70 ? (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <strong>📈 양호한 성과:</strong> 전체 평균 점수가 70% 이상으로 양호한 수준입니다.
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <strong>⚠️ 개선 필요:</strong> 전체 평균 점수가 70% 미만입니다. 추가 지원이 필요할 수 있습니다.
                    </div>
                  )}

                  {analytics.classPerformance.length > 0 && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <strong>🏆 최고 성과 학급:</strong> {topClass?.grade}학년 {topClass?.class}반이 평균 {topClass?.averageScore.toFixed(1)}%로 최고 성과를 기록했습니다.
                    </div>
                  )}

                  {analytics.dailyQuizActivity.length > 0 && (
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <strong>📅 활동 수준:</strong> 최근 7일간 총 {getTotalQuizzes()}개의 퀴즈가 완료되었습니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">💡 개선 제안</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong>📚 맞춤형 지원:</strong> 성과가 낮은 학급에 대해 추가 학습 자료나 튜터링을 제공하세요.
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong>🎯 목표 설정:</strong> 각 학급별로 현실적인 성과 목표를 설정하여 동기를 부여하세요.
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong>📈 진도 모니터링:</strong> 정기적으로 성과를 추적하여 개선 효과를 측정하세요.
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong>🏅 인센티브 제도:</strong> 우수한 성과를 보인 학급이나 개인에게 보상을 제공하세요.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/admin/export')}
              className="btn-primary"
            >
              데이터 내보내기
            </button>
            
            <button
              onClick={() => router.push('/admin/monitoring')}
              className="btn-secondary"
            >
              실시간 모니터링
            </button>
            
            <button
              onClick={() => router.push('/admin/schedules')}
              className="btn-secondary"
            >
              일정 관리
            </button>
            
            <button
              onClick={() => router.push('/rankings')}
              className="btn-secondary"
            >
              실시간 랭킹 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}