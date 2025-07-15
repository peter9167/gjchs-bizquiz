'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminManager } from '@/lib/admin'

export default function DataExport() {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [downloadUrls, setDownloadUrls] = useState<{ [key: string]: string }>({})
  const router = useRouter()

  const downloadFile = (content: string, filename: string, type: string) => {
    // CSV 파일의 경우 UTF-8 BOM 추가 (Excel 한글 깨짐 방지)
    let finalContent = content
    if (type === 'text/csv') {
      // UTF-8 BOM 추가
      const BOM = '\uFEFF'
      finalContent = BOM + content
    }
    
    const blob = new Blob([finalContent], { type: type + ';charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleExportQuizResults = async () => {
    setLoading(prev => ({ ...prev, quiz: true }))
    try {
      const csvContent = await AdminManager.exportQuizResults()
      if (csvContent) {
        const filename = `quiz_results_${new Date().toISOString().slice(0, 10)}.csv`
        downloadFile(csvContent, filename, 'text/csv')
      }
    } catch (error) {
      console.error('Error exporting quiz results:', error)
      alert('퀴즈 결과 내보내기에 실패했습니다.')
    } finally {
      setLoading(prev => ({ ...prev, quiz: false }))
    }
  }

  const handleExportStudents = async () => {
    setLoading(prev => ({ ...prev, students: true }))
    try {
      const csvContent = await AdminManager.exportStudentData()
      if (csvContent) {
        const filename = `students_${new Date().toISOString().slice(0, 10)}.csv`
        downloadFile(csvContent, filename, 'text/csv')
      }
    } catch (error) {
      console.error('Error exporting student data:', error)
      alert('학생 데이터 내보내기에 실패했습니다.')
    } finally {
      setLoading(prev => ({ ...prev, students: false }))
    }
  }

  const handleExportAnalytics = async () => {
    setLoading(prev => ({ ...prev, analytics: true }))
    try {
      // Generate analytics report as JSON
      const analytics = await AdminManager.getDetailedAnalytics()
      const analyticsReport = {
        exportDate: new Date().toISOString(),
        scoreDistribution: analytics.scoreDistribution,
        dailyActivity: analytics.dailyQuizActivity,
        classPerformance: analytics.classPerformance,
        summary: {
          totalClasses: analytics.classPerformance.length,
          averageClassScore: analytics.classPerformance.reduce((sum, c) => sum + c.averageScore, 0) / analytics.classPerformance.length || 0,
          totalActivity: analytics.dailyQuizActivity.reduce((sum, d) => sum + d.count, 0)
        }
      }
      
      const jsonContent = JSON.stringify(analyticsReport, null, 2)
      const filename = `analytics_report_${new Date().toISOString().slice(0, 10)}.json`
      downloadFile(jsonContent, filename, 'application/json')
    } catch (error) {
      console.error('Error exporting analytics:', error)
      alert('분석 리포트 내보내기에 실패했습니다.')
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">데이터 내보내기</h1>
                <p className="text-gray-600">퀴즈 결과와 학생 데이터를 다양한 형태로 내보낼 수 있습니다</p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="btn-secondary"
              >
                대시보드로 돌아가기
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quiz Results Export */}
            <div className="card">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">퀴즈 결과</h2>
                <p className="text-gray-600">
                  모든 퀴즈 세션의 상세 결과를 CSV 형태로 내보냅니다
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold mb-2">포함 데이터:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 퀴즈 제목 및 날짜</li>
                    <li>• 학생 정보 (이름, 학급, 번호)</li>
                    <li>• 점수 및 정답률</li>
                    <li>• 소요 시간</li>
                    <li>• 완료 일시</li>
                  </ul>
                </div>

                <button
                  onClick={handleExportQuizResults}
                  disabled={loading.quiz}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading.quiz ? '내보내는 중...' : 'CSV로 내보내기'}
                </button>
              </div>
            </div>

            {/* Student Data Export */}
            <div className="card">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">👥</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">학생 데이터</h2>
                <p className="text-gray-600">
                  등록된 모든 학생의 기본 정보를 CSV 형태로 내보냅니다
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold mb-2">포함 데이터:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 학생 이름</li>
                    <li>• 학년, 반, 번호</li>
                    <li>• 전화번호</li>
                    <li>• 등록 일시</li>
                  </ul>
                </div>

                <button
                  onClick={handleExportStudents}
                  disabled={loading.students}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading.students ? '내보내는 중...' : 'CSV로 내보내기'}
                </button>
              </div>
            </div>

            {/* Analytics Report Export */}
            <div className="card">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📈</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">분석 리포트</h2>
                <p className="text-gray-600">
                  상세한 통계 분석 결과를 JSON 형태로 내보냅니다
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold mb-2">포함 데이터:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 점수 분포 통계</li>
                    <li>• 일별 활동 데이터</li>
                    <li>• 학급별 성과 분석</li>
                    <li>• 전체 요약 통계</li>
                  </ul>
                </div>

                <button
                  onClick={handleExportAnalytics}
                  disabled={loading.analytics}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading.analytics ? '내보내는 중...' : 'JSON으로 내보내기'}
                </button>
              </div>
            </div>

            {/* Portfolio Data Export */}
            <div className="card">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">💰</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">포트폴리오 데이터</h2>
                <p className="text-gray-600">
                  학생들의 가상 자산 및 수익률 데이터를 내보냅니다
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold mb-2">포함 데이터:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 학생별 가상 자산</li>
                    <li>• 수익률 정보</li>
                    <li>• 랭킹 데이터</li>
                    <li>• 마지막 업데이트 시간</li>
                  </ul>
                </div>

                <button
                  onClick={() => alert('포트폴리오 내보내기는 준비 중입니다.')}
                  className="btn-secondary w-full"
                >
                  준비 중
                </button>
              </div>
            </div>
          </div>

          {/* Export Instructions */}
          <div className="card mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">사용 안내</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold mb-3">CSV 파일 활용</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Excel이나 Google Sheets에서 바로 열어볼 수 있습니다</li>
                  <li>• UTF-8 BOM 인코딩으로 한글 깨짐을 방지합니다</li>
                  <li>• Excel에서 한글이 정상적으로 표시됩니다</li>
                  <li>• 필터링과 정렬 기능을 활용하여 데이터를 분석할 수 있습니다</li>
                  <li>• 쉼표가 포함된 데이터는 자동으로 따옴표로 감싸집니다</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">데이터 보안</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 개인정보가 포함된 데이터는 안전하게 관리해주세요</li>
                  <li>• 불필요한 경우 다운로드된 파일을 삭제해주세요</li>
                  <li>• 데이터 공유 시 개인정보 보호에 주의해주세요</li>
                  <li>• 정기적으로 백업을 권장합니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/admin/analytics')}
              className="btn-secondary"
            >
              분석 리포트 보기
            </button>
            
            <button
              onClick={() => router.push('/admin/students')}
              className="btn-secondary"
            >
              학생 관리
            </button>
            
            <button
              onClick={() => router.push('/admin/monitoring')}
              className="btn-secondary"
            >
              실시간 모니터링
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}