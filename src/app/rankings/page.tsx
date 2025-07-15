'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'
// import { PortfolioManager } from '@/lib/portfolio'  // API 호출로 대체
import { Student, LiveRanking } from '@/types/database'

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount)
}

const formatReturnRate = (rate: number): string => {
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`
}

const getReturnRateColor = (rate: number): string => {
  if (rate > 0) return 'text-green-600'
  if (rate < 0) return 'text-red-600'
  return 'text-gray-600'
}

export default function RankingsPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [rankings, setRankings] = useState<LiveRanking[]>([])
  const [classRankings, setClassRankings] = useState<LiveRanking[]>([])
  const [gradeRankings, setGradeRankings] = useState<LiveRanking[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'grade' | 'class'>('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadRankingData()
    
    // Auto-refresh rankings every 30 seconds
    const interval = setInterval(loadRankingData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadRankingData = async () => {
    try {
      const currentStudent = await SessionManager.getCurrentStudent()
      if (!currentStudent) {
        router.push('/')
        return
      }
      setStudent(currentStudent)

      // API 호출로 랜킹 데이터 로드
      const [allResponse, gradeResponse, classResponse] = await Promise.all([
        fetch('/api/rankings'),
        fetch(`/api/rankings?grade=${currentStudent.grade}`),
        fetch(`/api/rankings?grade=${currentStudent.grade}&class=${currentStudent.class}`)
      ])

      const [allData, gradeData, classData] = await Promise.all([
        allResponse.json(),
        gradeResponse.json(),
        classResponse.json()
      ])

      if (allData.success) setRankings(allData.rankings)
      if (gradeData.success) setGradeRankings(gradeData.rankings)
      if (classData.success) setClassRankings(classData.rankings)

    } catch (error) {
      console.error('Error loading rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentRankings = () => {
    switch (activeTab) {
      case 'grade':
        return gradeRankings
      case 'class':
        return classRankings
      default:
        return rankings
    }
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'grade':
        return `${student?.grade}학년 랭킹`
      case 'class':
        return `${student?.grade}학년 ${student?.class}반 랭킹`
      default:
        return '전체 랭킹'
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `${rank}위`
  }

  const isCurrentStudent = (ranking: LiveRanking) => {
    return student && 
           ranking.name === student.name &&
           ranking.grade === student.grade &&
           ranking.class === student.class &&
           ranking.number === student.number
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">랭킹을 불러오는 중...</div>
      </div>
    )
  }

  const currentRankings = getCurrentRankings()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">실시간 랭킹</h1>
            <p className="text-gray-600">가상 자산 기준 순위입니다</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-2 bg-white rounded-lg p-2 shadow-md">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                전체 랭킹
              </button>
              <button
                onClick={() => setActiveTab('grade')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'grade'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                학년별
              </button>
              <button
                onClick={() => setActiveTab('class')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'class'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                반별
              </button>
            </div>
          </div>

          {/* Rankings Table */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{getTabTitle()}</h2>
              <button
                onClick={loadRankingData}
                className="btn-secondary text-sm"
              >
                새로고침
              </button>
            </div>

            {currentRankings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">순위</th>
                      <th className="text-left py-3 px-2">이름</th>
                      <th className="text-left py-3 px-2">학급</th>
                      <th className="text-right py-3 px-2">가상 자산</th>
                      <th className="text-right py-3 px-2">수익률</th>
                      <th className="text-right py-3 px-2">퀴즈 완료</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRankings.map((ranking, index) => (
                      <tr
                        key={`${ranking.grade}-${ranking.class}-${ranking.number}`}
                        className={`border-b hover:bg-gray-50 ${
                          isCurrentStudent(ranking) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            <span className="text-lg">
                              {getRankBadge(ranking.rank)}
                            </span>
                            {isCurrentStudent(ranking) && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                나
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-medium">{ranking.name}</td>
                        <td className="py-3 px-2 text-gray-600">
                          {ranking.grade}학년 {ranking.class}반
                        </td>
                        <td className="py-3 px-2 text-right font-bold">
                          {formatCurrency(ranking.virtual_assets)}
                        </td>
                        <td className={`py-3 px-2 text-right font-bold ${
                          getReturnRateColor(ranking.total_return_rate)
                        }`}>
                          {formatReturnRate(ranking.total_return_rate)}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600">
                          {ranking.quizzes_completed}개
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">아직 랭킹 데이터가 없습니다.</p>
              </div>
            )}
          </div>

          {/* Top Performers */}
          {activeTab === 'all' && (
            <div className="mt-8">
              <TopPerformers />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/portfolio')}
              className="btn-primary"
            >
              내 포트폴리오
            </button>
            
            <button
              onClick={() => router.push('/quiz')}
              className="btn-secondary"
            >
              퀴즈 참여하기
            </button>
            
            <button
              onClick={() => router.push('/stock-chart')}
              className="btn-secondary"
            >
              주가 차트
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

function TopPerformers() {
  const [topPerformers, setTopPerformers] = useState<{
    student: LiveRanking
    recentQuizzes: number
    averageScore: number
  }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopPerformers()
  }, [])

  const loadTopPerformers = async () => {
    try {
      const response = await fetch('/api/rankings/top-performers?limit=5')
      const data = await response.json()
      if (data.success) {
        setTopPerformers(data.topPerformers)
      }
    } catch (error) {
      console.error('Error loading top performers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">상위 성과자</h3>
        <div className="text-center py-4">로딩중...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-900 mb-4">상위 성과자</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topPerformers.map((performer, index) => (
          <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold">{performer.student.name}</h4>
              <span className="text-lg">{getRankBadge(performer.student.rank)}</span>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {performer.student.grade}학년 {performer.student.class}반
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>자산:</span>
                <span className="font-bold">
                  {formatCurrency(performer.student.virtual_assets)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>수익률:</span>
                <span className={`font-bold ${
                  getReturnRateColor(performer.student.total_return_rate)
                }`}>
                  {formatReturnRate(performer.student.total_return_rate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>평균 점수:</span>
                <span className="font-bold">{performer.averageScore}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getRankBadge(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}위`
}