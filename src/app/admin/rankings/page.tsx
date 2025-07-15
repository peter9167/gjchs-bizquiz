'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface RankingData {
  rank: number
  name: string
  grade: number
  class: number
  number: number
  virtual_assets: number
  total_return_rate: number
  quizzes_completed: number
  last_quiz_date?: string
  average_score?: number
}

export default function AdminRankings() {
  const [rankings, setRankings] = useState<RankingData[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [filterGrade, setFilterGrade] = useState<number | null>(null)
  const [filterClass, setFilterClass] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'assets' | 'return_rate' | 'quizzes'>('assets')
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAdminAuth()

  useEffect(() => {
    if (isAuthenticated) {
      loadRankings()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return

    const interval = setInterval(() => {
      loadRankings()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, isAuthenticated])

  const loadRankings = async () => {
    try {
      const response = await fetch('/api/rankings')
      const data = await response.json()
      
      if (data.success) {
        setRankings(data.rankings)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error loading rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    const sign = rate >= 0 ? '+' : ''
    const color = rate >= 0 ? 'text-green-600' : 'text-red-600'
    return <span className={color}>{sign}{rate.toFixed(2)}%</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `${rank}위`
  }

  const getGradeColor = (grade: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-purple-100 text-purple-800'
    }
    return colors[grade as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getFilteredRankings = () => {
    let filtered = rankings

    if (filterGrade) {
      filtered = filtered.filter(r => r.grade === filterGrade)
    }

    if (filterClass) {
      filtered = filtered.filter(r => r.class === filterClass)
    }

    // Re-sort and re-rank filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'return_rate':
          return b.total_return_rate - a.total_return_rate
        case 'quizzes':
          return b.quizzes_completed - a.quizzes_completed
        default:
          return b.virtual_assets - a.virtual_assets
      }
    })

    return filtered.map((item, index) => ({ ...item, rank: index + 1 }))
  }

  const getUniqueValues = (key: 'grade' | 'class') => {
    const values = Array.from(new Set(rankings.map(r => r[key])))
    return values.sort((a, b) => a - b)
  }

  const getTopPerformers = () => {
    const filtered = getFilteredRankings()
    return {
      topAssets: filtered[0],
      topReturn: filtered.sort((a, b) => b.total_return_rate - a.total_return_rate)[0],
      topQuizzes: filtered.sort((a, b) => b.quizzes_completed - a.quizzes_completed)[0]
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">랭킹 데이터를 불러오는 중...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const filteredRankings = getFilteredRankings()
  const topPerformers = getTopPerformers()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">실시간 랭킹 관리</h1>
                <p className="text-gray-600">학생들의 실시간 자산 순위와 성과를 모니터링하세요</p>
                <div className="text-sm text-gray-500 mt-1">
                  마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    autoRefresh 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {autoRefresh ? '⏸️ 자동 새로고침' : '▶️ 자동 새로고침'}
                </button>
                <button
                  onClick={loadRankings}
                  className="btn-secondary"
                >
                  🔄 새로고침
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

          {/* Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <h3 className="text-lg font-bold mb-2">💰 최고 자산</h3>
              {topPerformers.topAssets ? (
                <div>
                  <div className="text-2xl font-bold">
                    {topPerformers.topAssets.name}
                  </div>
                  <div className="text-sm opacity-90">
                    {topPerformers.topAssets.grade}학년 {topPerformers.topAssets.class}반
                  </div>
                  <div className="text-xl font-bold mt-2">
                    {formatCurrency(topPerformers.topAssets.virtual_assets)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-300">데이터 없음</div>
              )}
            </div>

            <div className="card text-center bg-gradient-to-r from-green-400 to-blue-500 text-white">
              <h3 className="text-lg font-bold mb-2">📈 최고 수익률</h3>
              {topPerformers.topReturn ? (
                <div>
                  <div className="text-2xl font-bold">
                    {topPerformers.topReturn.name}
                  </div>
                  <div className="text-sm opacity-90">
                    {topPerformers.topReturn.grade}학년 {topPerformers.topReturn.class}반
                  </div>
                  <div className="text-xl font-bold mt-2">
                    +{topPerformers.topReturn.total_return_rate.toFixed(2)}%
                  </div>
                </div>
              ) : (
                <div className="text-gray-300">데이터 없음</div>
              )}
            </div>

            <div className="card text-center bg-gradient-to-r from-purple-400 to-pink-500 text-white">
              <h3 className="text-lg font-bold mb-2">🎯 퀴즈 왕</h3>
              {topPerformers.topQuizzes ? (
                <div>
                  <div className="text-2xl font-bold">
                    {topPerformers.topQuizzes.name}
                  </div>
                  <div className="text-sm opacity-90">
                    {topPerformers.topQuizzes.grade}학년 {topPerformers.topQuizzes.class}반
                  </div>
                  <div className="text-xl font-bold mt-2">
                    {topPerformers.topQuizzes.quizzes_completed}회 완료
                  </div>
                </div>
              ) : (
                <div className="text-gray-300">데이터 없음</div>
              )}
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="card mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학년 필터</label>
                <select 
                  value={filterGrade || ''} 
                  onChange={(e) => setFilterGrade(e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field"
                >
                  <option value="">전체 학년</option>
                  {getUniqueValues('grade').map(grade => (
                    <option key={grade} value={grade}>{grade}학년</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">반 필터</label>
                <select 
                  value={filterClass || ''} 
                  onChange={(e) => setFilterClass(e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field"
                >
                  <option value="">전체 반</option>
                  {getUniqueValues('class').map(classNum => (
                    <option key={classNum} value={classNum}>{classNum}반</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정렬 기준</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'assets' | 'return_rate' | 'quizzes')}
                  className="input-field"
                >
                  <option value="assets">자산순</option>
                  <option value="return_rate">수익률순</option>
                  <option value="quizzes">퀴즈 완료순</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">결과</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-sm">
                  {filteredRankings.length}명 표시
                </div>
              </div>
            </div>
          </div>

          {/* Rankings Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-bold text-gray-700">순위</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">학생 정보</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">가상 자산</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">수익률</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">퀴즈 완료</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRankings.map((student, index) => (
                    <tr key={`${student.grade}-${student.class}-${student.number}`} 
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          index < 3 ? 'bg-yellow-50' : ''
                        }`}>
                      <td className="py-3 px-4">
                        <div className="text-lg font-bold">
                          {getRankBadge(student.rank)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="font-bold text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-600">
                              {student.grade}학년 {student.class}반 {student.number}번
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(student.grade)}`}>
                            {student.grade}학년
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-lg">
                          {formatCurrency(student.virtual_assets)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold">
                          {formatPercentage(student.total_return_rate)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{student.quizzes_completed}회</span>
                          {student.quizzes_completed > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              활성
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {student.total_return_rate > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              수익
                            </span>
                          )}
                          {student.total_return_rate < 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              손실
                            </span>
                          )}
                          {student.quizzes_completed === 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              미참여
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRankings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">표시할 랭킹 데이터가 없습니다.</div>
                <div className="text-gray-400 text-sm mt-2">필터 조건을 변경하거나 학생들이 퀴즈에 참여할 때까지 기다려주세요.</div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">총 참여 학생</h3>
              <div className="text-3xl font-bold text-blue-600">
                {filteredRankings.length}명
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">평균 자산</h3>
              <div className="text-3xl font-bold text-green-600">
                {filteredRankings.length > 0 
                  ? formatCurrency(filteredRankings.reduce((sum, r) => sum + r.virtual_assets, 0) / filteredRankings.length)
                  : formatCurrency(0)
                }
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">평균 수익률</h3>
              <div className="text-3xl font-bold text-purple-600">
                {filteredRankings.length > 0 
                  ? `${(filteredRankings.reduce((sum, r) => sum + r.total_return_rate, 0) / filteredRankings.length).toFixed(2)}%`
                  : '0.00%'
                }
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">활성 사용자</h3>
              <div className="text-3xl font-bold text-orange-600">
                {filteredRankings.filter(r => r.quizzes_completed > 0).length}명
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}