'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/session'
import { QuizManager } from '@/lib/quiz'
import { Question, QuizSchedule, Student } from '@/types/database'
import QuizTimer from '@/components/QuizTimer'

interface QuizState {
  questions: Question[]
  currentQuestionIndex: number
  answers: Record<string, string>
  sessionId: string | null
  timeLeft: number
}

export default function Quiz() {
  const [student, setStudent] = useState<Student | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<QuizSchedule | null>(null)
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    sessionId: null,
    timeLeft: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [alreadyTaken, setAlreadyTaken] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initializeQuiz()
  }, [])

  const initializeQuiz = async () => {
    try {
      const currentStudent = await SessionManager.getCurrentStudent()
      if (!currentStudent) {
        router.push('/')
        return
      }
      setStudent(currentStudent)

      // URL에서 scheduleId 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search)
      const scheduleId = urlParams.get('scheduleId')
      
      let quiz = null
      
      if (scheduleId) {
        // 특정 퀴즈 ID가 있는 경우, 해당 퀴즈 찾기
        const activeQuizzes = await QuizManager.getActiveQuizzes()
        quiz = activeQuizzes.find(q => q.id === scheduleId)
        
        if (!quiz) {
          setError('선택한 퀴즈를 찾을 수 없습니다.')
          setLoading(false)
          return
        }
      } else {
        // 퀴즈 ID가 없는 경우, 퀴즈 선택 페이지로 리디렉션
        const activeQuizzes = await QuizManager.getActiveQuizzes()
        if (activeQuizzes.length > 1) {
          router.push('/quiz/select')
          return
        } else if (activeQuizzes.length === 1) {
          quiz = activeQuizzes[0]
        }
      }

      if (!quiz) {
        setError('현재 진행중인 퀴즈가 없습니다.')
        setLoading(false)
        return
      }
      setActiveQuiz(quiz)

      // Check if student already took this quiz
      const hasTaken = await QuizManager.hasStudentTakenQuiz(
        currentStudent.id,
        quiz.id
      )
      if (hasTaken) {
        setAlreadyTaken(true)
        setLoading(false)
        return
      }

      const questions = await QuizManager.getQuizQuestions(quiz.question_ids)
      if (questions.length === 0) {
        setError('퀴즈 문제를 불러올 수 없습니다.')
        setLoading(false)
        return
      }

      const sessionId = await QuizManager.startQuizSession(
        currentStudent.id,
        quiz.id,
        questions.length
      )
      if (!sessionId) {
        setError('퀴즈 세션을 시작할 수 없습니다.')
        setLoading(false)
        return
      }

      setQuizState({
        questions,
        currentQuestionIndex: 0,
        answers: {},
        sessionId,
        timeLeft: quiz.time_limit_minutes * 60
      })
    } catch (err) {
      setError('퀴즈를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex]
    
    if (quizState.sessionId) {
      await QuizManager.submitAnswer(quizState.sessionId, currentQuestion.id, answer)
    }

    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: answer
      }
    }))
  }

  const nextQuestion = () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }))
    } else {
      completeQuiz()
    }
  }

  const previousQuestion = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }))
    }
  }

  const completeQuiz = async () => {
    if (!quizState.sessionId || !activeQuiz) return

    const timeTaken = activeQuiz.time_limit_minutes * 60 - quizState.timeLeft
    const result = await QuizManager.completeQuizSession(
      quizState.sessionId,
      quizState.questions,
      timeTaken
    )

    if (result) {
      setQuizCompleted(true)
      // Navigate to results page with score
      router.push(`/quiz/results?sessionId=${quizState.sessionId}`)
    } else {
      setError('퀴즈 제출 중 오류가 발생했습니다.')
    }
  }

  const handleTimeUp = () => {
    completeQuiz()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">퀴즈를 불러오는 중...</div>
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

  if (alreadyTaken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-xl font-bold text-blue-600 mb-4">퀴즈 완료</h2>
          <p className="text-gray-600 mb-4">
            이미 오늘의 퀴즈를 완료하셨습니다.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/results')}
              className="btn-primary"
            >
              결과 보기
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex]
  const currentAnswer = quizState.answers[currentQuestion?.id] || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {activeQuiz?.title}
            </h1>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                문제 {quizState.currentQuestionIndex + 1} / {quizState.questions.length}
              </span>
              <span>{student?.name}님</span>
            </div>
          </div>

          {activeQuiz && (
            <QuizTimer
              timeLimit={activeQuiz.time_limit_minutes}
              onTimeUp={handleTimeUp}
              onTimeUpdate={(time) => setQuizState(prev => ({ ...prev, timeLeft: time }))}
            />
          )}

          {currentQuestion && (
            <div className="card mb-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">
                  {currentQuestion.title}
                </h2>
                <div className="text-gray-700 mb-6">
                  {currentQuestion.content}
                </div>
                {currentQuestion.image_url && (
                  <img
                    src={currentQuestion.image_url}
                    alt="Question"
                    className="max-w-full h-auto mb-6 rounded-lg"
                  />
                )}
              </div>

              <div className="space-y-3">
                {[
                  { key: 'A', text: currentQuestion.option_a },
                  { key: 'B', text: currentQuestion.option_b },
                  { key: 'C', text: currentQuestion.option_c },
                  { key: 'D', text: currentQuestion.option_d }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleAnswer(option.key)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                      currentAnswer === option.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold mr-3">{option.key}.</span>
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={previousQuestion}
              disabled={quizState.currentQuestionIndex === 0}
              className="btn-secondary disabled:opacity-50"
            >
              이전 문제
            </button>

            <div className="flex space-x-4">
              <button
                onClick={completeQuiz}
                className="btn-secondary"
              >
                제출하기
              </button>

              {quizState.currentQuestionIndex < quizState.questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  disabled={!currentAnswer}
                  className="btn-primary disabled:opacity-50"
                >
                  다음 문제
                </button>
              ) : (
                <button
                  onClick={completeQuiz}
                  disabled={!currentAnswer}
                  className="btn-primary disabled:opacity-50"
                >
                  완료
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg p-4">
            <h3 className="font-bold mb-2">답안 현황</h3>
            <div className="grid grid-cols-10 gap-2">
              {quizState.questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold cursor-pointer ${
                    quizState.answers[q.id]
                      ? 'bg-green-200 text-green-800'
                      : index === quizState.currentQuestionIndex
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setQuizState(prev => ({ ...prev, currentQuestionIndex: index }))}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}