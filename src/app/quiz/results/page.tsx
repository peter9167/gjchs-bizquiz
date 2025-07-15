'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// import { supabaseAdmin } from '@/lib/supabase'  // API 호출로 대체
import { Question } from '@/types/database'

interface QuizResult {
  sessionId: string
  score: number
  totalQuestions: number
  timeTaken: number
  answers: Record<string, string>
  questions: Question[]
}

export default function QuizResults() {
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAnswers, setShowAnswers] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  useEffect(() => {
    if (sessionId) {
      loadResults()
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const loadResults = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/quiz/results?sessionId=${sessionId}`)
      const data = await response.json()
      
      if (data.success) {
        setResult(data.result)
      } else {
        console.error('Results error:', data.error)
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}분 ${secs}초`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">결과를 불러오는 중...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">오류</h2>
          <p className="text-gray-600 mb-4">퀴즈 결과를 찾을 수 없습니다.</p>
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

  const percentage = (result.score / result.totalQuestions) * 100
  const grade = getGrade(percentage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="card text-center mb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                퀴즈 완료!
              </h1>
              <p className="text-gray-600">수고하셨습니다!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {result.score}
                </div>
                <div className="text-sm text-gray-600">맞힌 문제</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {result.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">전체 문제</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                  {percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">정답률</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                  {grade}
                </div>
                <div className="text-sm text-gray-600">등급</div>
              </div>
            </div>

            <div className="text-gray-600 mb-6">
              소요시간: {formatTime(result.timeTaken)}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="btn-secondary"
              >
                {showAnswers ? '정답 숨기기' : '정답 보기'}
              </button>

              <div className="space-x-4">
                <button
                  onClick={() => router.push('/portfolio')}
                  className="btn-primary"
                >
                  포트폴리오 확인
                </button>
                
                <button
                  onClick={() => router.push('/rankings')}
                  className="btn-secondary"
                >
                  랭킹 보기
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

          {showAnswers && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">정답 및 해설</h2>
              
              {result.questions.map((question, index) => {
                const userAnswer = result.answers[question.id] || ''
                const isCorrect = userAnswer === question.correct_answer
                
                return (
                  <div key={question.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold">
                        문제 {index + 1}. {question.title}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isCorrect ? '정답' : '오답'}
                      </div>
                    </div>

                    <div className="text-gray-700 mb-4">
                      {question.content}
                    </div>

                    {question.image_url && (
                      <img
                        src={question.image_url}
                        alt="Question"
                        className="max-w-full h-auto mb-4 rounded-lg"
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {[
                        { key: 'A', text: question.option_a },
                        { key: 'B', text: question.option_b },
                        { key: 'C', text: question.option_c },
                        { key: 'D', text: question.option_d }
                      ].map((option) => {
                        let bgColor = 'bg-gray-50'
                        if (option.key === question.correct_answer) {
                          bgColor = 'bg-green-100 border-green-500'
                        } else if (option.key === userAnswer && !isCorrect) {
                          bgColor = 'bg-red-100 border-red-500'
                        }

                        return (
                          <div
                            key={option.key}
                            className={`p-3 rounded-lg border ${bgColor}`}
                          >
                            <span className="font-bold mr-2">{option.key}.</span>
                            {option.text}
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-sm text-gray-600">
                      <div>정답: <span className="font-bold text-green-600">{question.correct_answer}</span></div>
                      <div>선택한 답: <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {userAnswer || '선택하지 않음'}
                      </span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}