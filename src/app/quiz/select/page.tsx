'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'
import { QuizManager } from '@/lib/quiz'
import { QuizSchedule, Student } from '@/types/database'

export default function QuizSelect() {
  const [student, setStudent] = useState<Student | null>(null)
  const [activeQuizzes, setActiveQuizzes] = useState<QuizSchedule[]>([])
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    initializeQuizSelection()
  }, [])

  const initializeQuizSelection = async () => {
    try {
      const currentStudent = await SessionManager.getCurrentStudent()
      if (!currentStudent) {
        router.push('/')
        return
      }
      setStudent(currentStudent)

      const quizzes = await QuizManager.getActiveQuizzes()
      if (quizzes.length === 0) {
        setError('현재 진행중인 퀴즈가 없습니다.')
        setLoading(false)
        return
      }
      setActiveQuizzes(quizzes)

      // 완료된 퀴즈 확인
      const completedSet = new Set<string>()
      for (const quiz of quizzes) {
        const hasTaken = await QuizManager.hasStudentTakenQuiz(
          currentStudent.id,
          quiz.id
        )
        if (hasTaken) {
          completedSet.add(quiz.id)
        }
      }
      setCompletedQuizzes(completedSet)
    } catch (err) {
      setError('퀴즈 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizSelect = (quizId: string) => {
    router.push(`/quiz?scheduleId=${quizId}`)
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM 형식으로 변환
  }

  const getScheduleTypeText = (type: string) => {
    switch (type) {
      case 'daily': return '매일'
      case 'weekly': return '주간'
      case 'once': return '일회성'
      default: return type
    }
  }

  const getWeekdayText = (weekdays: number[]) => {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    return weekdays.map(day => dayNames[day]).join(', ')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">퀴즈 목록을 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">오류</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">퀴즈 선택</h1>
            <p className="text-gray-600">참여하고 싶은 퀴즈를 선택하세요</p>
            <div className="mt-2 text-sm text-gray-500">
              {student?.name}님 ({student?.grade}학년 {student?.class}반 {student?.number}번)
            </div>
          </div>

          {activeQuizzes.length === 0 ? (
            <div className="card text-center">
              <h2 className="text-xl font-bold text-gray-600 mb-4">사용 가능한 퀴즈가 없습니다</h2>
              <p className="text-gray-500 mb-4">현재 진행중인 퀴즈가 없습니다.</p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                홈으로 돌아가기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeQuizzes.map((quiz) => {
                const isCompleted = completedQuizzes.has(quiz.id)
                return (
                  <div
                    key={quiz.id}
                    className={`card cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isCompleted ? 'opacity-60 bg-gray-50' : 'hover:scale-105'
                    }`}
                    onClick={() => !isCompleted && handleQuizSelect(quiz.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                      {isCompleted && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          완료
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="font-medium w-16">유형:</span>
                        <span>{getScheduleTypeText(quiz.schedule_type)}</span>
                      </div>
                      
                      {quiz.schedule_type === 'weekly' && quiz.weekdays && (
                        <div className="flex items-center">
                          <span className="font-medium w-16">요일:</span>
                          <span>{getWeekdayText(quiz.weekdays)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <span className="font-medium w-16">시간:</span>
                        <span>{formatTime(quiz.start_time)} - {formatTime(quiz.end_time)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium w-16">문제 수:</span>
                        <span>{quiz.question_ids.length}개</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium w-16">제한시간:</span>
                        <span>{quiz.time_limit_minutes}분</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium w-16">기간:</span>
                        <span>
                          {quiz.start_date} 
                          {quiz.end_date && ` ~ ${quiz.end_date}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      {isCompleted ? (
                        <div className="text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push('/results')
                            }}
                            className="btn-secondary text-sm"
                          >
                            결과 보기
                          </button>
                        </div>
                      ) : (
                        <button className="btn-primary w-full">
                          퀴즈 시작하기
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}