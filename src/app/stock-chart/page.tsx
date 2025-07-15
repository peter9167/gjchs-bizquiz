'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'
// import { PortfolioManager } from '@/lib/portfolio'  // API 호출로 대체
import { Student, StockPrice } from '@/types/database'
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

export default function StockChartPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [stockPrices, setStockPrices] = useState<StockPrice[]>([])
  const [selectedGrade, setSelectedGrade] = useState<number | undefined>(undefined)
  const [selectedClass, setSelectedClass] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const router = useRouter()

  useEffect(() => {
    initializePage()
  }, [])

  useEffect(() => {
    if (student) {
      loadStockData()
    }
  }, [student, selectedGrade, selectedClass])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadStockData()
      // Update stock prices in background
      updateStockPrices()
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [autoRefresh, selectedGrade, selectedClass])

  const initializePage = async () => {
    try {
      const currentStudent = await SessionManager.getCurrentStudent()
      if (!currentStudent) {
        router.push('/')
        return
      }
      setStudent(currentStudent)
      setSelectedGrade(currentStudent.grade)
      setSelectedClass(currentStudent.class)
    } catch (error) {
      console.error('Error initializing page:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStockPrices = async () => {
    try {
      await fetch('/api/stock-prices', { method: 'POST' })
    } catch (error) {
      console.error('Error updating stock prices:', error)
    }
  }

  const loadStockData = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedGrade) params.append('grade', selectedGrade.toString())
      if (selectedClass) params.append('class', selectedClass.toString())
      params.append('limit', '50')
      
      const response = await fetch(`/api/stock-prices?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setStockPrices(data.stockPrices)
      }
    } catch (error) {
      console.error('Error loading stock data:', error)
    }
  }

  const getChartData = () => {
    if (stockPrices.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    const labels = stockPrices.map((price, index) => {
      const date = new Date(price.created_at)
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    const prices = stockPrices.map(price => price.price)
    const volumes = stockPrices.map(price => price.volume)

    // Calculate price change colors
    const borderColors = prices.map((price, index) => {
      if (index === 0) return 'rgb(59, 130, 246)'
      const prevPrice = prices[index - 1]
      if (price > prevPrice) return 'rgb(34, 197, 94)' // Green for up
      if (price < prevPrice) return 'rgb(239, 68, 68)' // Red for down
      return 'rgb(107, 114, 128)' // Gray for no change
    })

    return {
      labels,
      datasets: [
        {
          label: '주가',
          data: prices,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.2,
          pointBorderColor: borderColors,
          pointBackgroundColor: borderColors,
          pointRadius: 4,
        },
        {
          label: '거래량',
          data: volumes,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.2,
          yAxisID: 'y1',
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedGrade ? `${selectedGrade}학년` : '전체'} ${selectedClass ? `${selectedClass}반` : ''} 모의 주가 차트`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 0) {
              label += new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW'
              }).format(context.parsed.y);
            } else {
              label += context.parsed.y + '개';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '시간'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '주가 (KRW)'
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW'
            }).format(value);
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '거래량'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const getCurrentPrice = () => {
    if (stockPrices.length === 0) return 0
    return stockPrices[stockPrices.length - 1].price
  }

  const getPriceChange = () => {
    if (stockPrices.length < 2) return { amount: 0, percentage: 0 }
    const current = stockPrices[stockPrices.length - 1].price
    const previous = stockPrices[stockPrices.length - 2].price
    const amount = current - previous
    const percentage = (amount / previous) * 100
    return { amount, percentage }
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">차트를 불러오는 중...</div>
      </div>
    )
  }

  const priceChange = getPriceChange()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">모의 주가 차트</h1>
            <p className="text-gray-600">학급별 퀴즈 성과를 기반으로 한 실시간 주가 시뮬레이션</p>
          </div>

          {/* Controls */}
          <div className="card mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    학년 선택
                  </label>
                  <select
                    value={selectedGrade || ''}
                    onChange={(e) => setSelectedGrade(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field"
                  >
                    <option value="">전체 학년</option>
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    반 선택
                  </label>
                  <select
                    value={selectedClass || ''}
                    onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field"
                    disabled={!selectedGrade}
                  >
                    <option value="">전체 반</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(classNum => (
                      <option key={classNum} value={classNum}>{classNum}반</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    자동 새로고침
                  </label>
                </div>
              </div>

              <button
                onClick={loadStockData}
                className="btn-secondary"
              >
                새로고침
              </button>
            </div>
          </div>

          {/* Current Price Display */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">현재 주가</h3>
              <div className="text-3xl font-bold text-blue-600">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW'
                }).format(getCurrentPrice())}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">변동액</h3>
              <div className={`text-3xl font-bold ${getPriceChangeColor(priceChange.amount)}`}>
                {priceChange.amount >= 0 ? '+' : ''}{new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW'
                }).format(priceChange.amount)}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">변동률</h3>
              <div className={`text-3xl font-bold ${getPriceChangeColor(priceChange.percentage)}`}>
                {priceChange.percentage >= 0 ? '+' : ''}{priceChange.percentage.toFixed(2)}%
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">데이터 포인트</h3>
              <div className="text-3xl font-bold text-purple-600">
                {stockPrices.length}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card mb-8">
            {stockPrices.length > 0 ? (
              <div className="h-96">
                <Line data={getChartData()} options={chartOptions} />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  선택한 조건에 해당하는 주가 데이터가 없습니다.
                </p>
                <p className="text-gray-500 text-sm">
                  퀴즈 참여가 늘어나면 주가 데이터가 생성됩니다.
                </p>
              </div>
            )}
          </div>

          {/* Market Info */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">시장 정보</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">📈 모의 주가 시스템 안내</h3>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="font-bold mr-2">📊</span>
                  <div>
                    <strong>주가 계산 방식:</strong> 각 학급의 평균 포트폴리오 수익률을 기반으로 주가가 결정됩니다.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="font-bold mr-2">⏰</span>
                  <div>
                    <strong>업데이트 주기:</strong> 퀴즈 완료 시마다 실시간으로 주가가 업데이트됩니다.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="font-bold mr-2">📈</span>
                  <div>
                    <strong>거래량:</strong> 최근 24시간 동안의 퀴즈 참여 횟수를 나타냅니다.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="font-bold mr-2">🎯</span>
                  <div>
                    <strong>주가 상승 요인:</strong> 학급 구성원들의 높은 퀴즈 점수와 활발한 참여가 주가를 상승시킵니다.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="font-bold mr-2">💡</span>
                  <div>
                    <strong>투자 팁:</strong> 꾸준한 퀴즈 참여와 높은 성과를 통해 개인 포트폴리오와 학급 주가를 모두 성장시켜보세요!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/portfolio')}
              className="btn-primary"
            >
              내 포트폴리오 보기
            </button>
            
            <button
              onClick={() => router.push('/rankings')}
              className="btn-secondary"
            >
              실시간 랭킹
            </button>
            
            <button
              onClick={() => router.push('/quiz')}
              className="btn-secondary"
            >
              퀴즈 참여하기
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