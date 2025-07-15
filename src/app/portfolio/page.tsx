'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'
// import { PortfolioManager } from '@/lib/portfolio'  // API 호출로 대체
import { Student, Portfolio } from '@/types/database'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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

export default function PortfolioPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [portfolioHistory, setPortfolioHistory] = useState<{
    portfolioValue: number[]
    dates: string[]
    quizScores: { date: string; score: number; totalQuestions: number }[]
  }>({ portfolioValue: [], dates: [], quizScores: [] })
  const [currentRank, setCurrentRank] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadPortfolioData()
  }, [])

  const loadPortfolioData = async () => {
    try {
      const currentStudent = await SessionManager.getCurrentStudent()
      if (!currentStudent) {
        router.push('/')
        return
      }
      setStudent(currentStudent)

      // API 호출로 포트폴리오 데이터 로드
      const response = await fetch(`/api/portfolio?studentId=${currentStudent.id}`)
      const data = await response.json()
      
      if (data.success) {
        setPortfolio(data.portfolio)
        setPortfolioHistory(data.portfolioHistory)
        setCurrentRank(data.currentRank)
      } else {
        console.error('Portfolio API error:', data.error)
      }

    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">포트폴리오를 불러오는 중...</div>
      </div>
    )
  }

  if (!student || !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">오류</h2>
          <p className="text-gray-600 mb-4">포트폴리오를 불러올 수 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const chartData = {
    labels: portfolioHistory.dates,
    datasets: [
      {
        label: '포트폴리오 가치',
        data: portfolioHistory.portfolioValue,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '포트폴리오 가치 변화',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW'
            }).format(value)
          }
        }
      }
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {student.name}님의 포트폴리오
            </h1>
            <p className="text-gray-600">
              {student.grade}학년 {student.class}반 {student.number}번
            </p>
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">현재 자산</h3>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(portfolio.virtual_assets)}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">수익률</h3>
              <div className={`text-3xl font-bold ${getReturnRateColor(portfolio.total_return_rate)}`}>
                {formatReturnRate(portfolio.total_return_rate)}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">현재 순위</h3>
              <div className="text-3xl font-bold text-purple-600">
                {currentRank}위
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">완료한 퀴즈</h3>
              <div className="text-3xl font-bold text-green-600">
                {portfolioHistory.quizScores.length}개
              </div>
            </div>
          </div>

          {/* Portfolio Chart */}
          {portfolioHistory.portfolioValue.length > 1 && (
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">자산 변화 추이</h2>
              <div className="h-96">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Quiz Performance */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">퀴즈 성과</h2>
            {portfolioHistory.quizScores.length > 0 ? (
              <div className="space-y-4">
                {portfolioHistory.quizScores.map((quiz, index) => {
                  const percentage = (quiz.score / quiz.totalQuestions) * 100
                  const grade = percentage >= 90 ? 'A' : 
                               percentage >= 80 ? 'B' : 
                               percentage >= 70 ? 'C' : 
                               percentage >= 60 ? 'D' : 'F'
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">퀴즈 {index + 1}</div>
                          <div className="text-sm text-gray-600">{quiz.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {quiz.score}/{quiz.totalQuestions} ({percentage.toFixed(1)}%)
                          </div>
                          <div className={`text-lg font-bold ${
                            grade === 'A' ? 'text-green-600' :
                            grade === 'B' ? 'text-blue-600' :
                            grade === 'C' ? 'text-yellow-600' :
                            grade === 'D' ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {grade}등급
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">아직 완료한 퀴즈가 없습니다.</p>
                <button
                  onClick={() => router.push('/quiz')}
                  className="btn-primary"
                >
                  첫 퀴즈 시작하기
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/quiz')}
              className="btn-primary"
            >
              새 퀴즈 참여
            </button>
            
            <button
              onClick={() => router.push('/rankings')}
              className="btn-secondary"
            >
              전체 랭킹 보기
            </button>
            
            <button
              onClick={() => router.push('/stock-chart')}
              className="btn-secondary"
            >
              주가 차트 보기
            </button>
            
            <button
              onClick={() => router.push('/results')}
              className="btn-secondary"
            >
              퀴즈 결과 히스토리
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