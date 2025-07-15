'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminManager } from '@/lib/admin'
import { Question } from '@/types/database'

export default function NewSchedule() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [formData, setFormData] = useState({
    title: '',
    question_ids: [] as string[],
    schedule_type: 'daily' as 'daily' | 'weekly' | 'once',
    weekdays: [] as number[],
    start_time: '09:00',
    end_time: '17:00',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    time_limit_minutes: 30,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const questionData = await AdminManager.getAllQuestions()
      setQuestions(questionData)
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.question_ids.length === 0) {
      setError('최소 1개 이상의 문제를 선택해야 합니다.')
      setLoading(false)
      return
    }

    if (formData.schedule_type === 'weekly' && formData.weekdays.length === 0) {
      setError('주간 일정의 경우 요일을 선택해야 합니다.')
      setLoading(false)
      return
    }

    try {
      const schedule = await AdminManager.createSchedule(formData)
      if (schedule) {
        router.push('/admin/schedules')
      } else {
        setError('일정 생성에 실패했습니다.')
      }
    } catch (err) {
      setError('일정 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? parseInt(value) 
        : type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked
          : value
    }))
  }

  const handleQuestionToggle = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      question_ids: prev.question_ids.includes(questionId)
        ? prev.question_ids.filter(id => id !== questionId)
        : [...prev.question_ids, questionId]
    }))
  }

  const handleWeekdayToggle = (weekday: number) => {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter(d => d !== weekday)
        : [...prev.weekdays, weekday].sort()
    }))
  }

  const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">새 일정 추가</h1>
            <p className="text-gray-600">퀴즈 일정을 생성하고 자동 활성화 시간을 설정합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">기본 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    일정 제목 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="예: 주간 경제 퀴즈"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    일정 유형 *
                  </label>
                  <select
                    name="schedule_type"
                    value={formData.schedule_type}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="daily">매일</option>
                    <option value="weekly">주간 (특정 요일)</option>
                    <option value="once">일회성</option>
                  </select>
                </div>

                {formData.schedule_type === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      요일 선택 *
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {weekdayNames.map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleWeekdayToggle(index)}
                          className={`p-2 text-sm rounded font-medium transition-colors ${
                            formData.weekdays.includes(index)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 시간 *
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 시간 *
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 날짜 *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 날짜 (선택사항)
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      className="input-field"
                      min={formData.start_date}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제한 시간 (분) *
                  </label>
                  <input
                    type="number"
                    name="time_limit_minutes"
                    value={formData.time_limit_minutes}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    max="180"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    생성 후 즉시 활성화
                  </label>
                </div>
              </div>
            </div>

            {/* Question Selection */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">문제 선택</h2>
              
              {questionsLoading ? (
                <div className="text-center py-8">문제를 불러오는 중...</div>
              ) : questions.length > 0 ? (
                <div className="space-y-4">
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">선택된 문제: {formData.question_ids.length}개</span>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            question_ids: questions.map(q => q.id) 
                          }))}
                          className="btn-secondary text-sm"
                        >
                          전체 선택
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            question_ids: [] 
                          }))}
                          className="btn-secondary text-sm"
                        >
                          선택 해제
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {questions.map((question) => (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          formData.question_ids.includes(question.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => handleQuestionToggle(question.id)}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={formData.question_ids.includes(question.id)}
                            onChange={() => handleQuestionToggle(question.id)}
                            className="mr-3 mt-1"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">
                              {question.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {question.content.length > 100 
                                ? `${question.content.slice(0, 100)}...`
                                : question.content
                              }
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>카테고리: {question.category || '미분류'}</span>
                              <span>난이도: 레벨 {question.difficulty}</span>
                              <span>정답: {question.correct_answer}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">사용할 수 있는 문제가 없습니다.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/admin/questions/new')}
                    className="btn-primary"
                  >
                    먼저 문제 만들기
                  </button>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">일정 미리보기</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">{formData.title || '일정 제목'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">유형:</span> {
                      formData.schedule_type === 'daily' ? '매일' :
                      formData.schedule_type === 'weekly' ? '주간' : '일회성'
                    }
                  </div>
                  
                  {formData.schedule_type === 'weekly' && (
                    <div>
                      <span className="font-medium">요일:</span> {
                        formData.weekdays.map(d => weekdayNames[d]).join(', ') || '선택된 요일 없음'
                      }
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">시간:</span> {formData.start_time} - {formData.end_time}
                  </div>
                  
                  <div>
                    <span className="font-medium">기간:</span> {formData.start_date} {
                      formData.end_date ? `~ ${formData.end_date}` : '(무기한)'
                    }
                  </div>
                  
                  <div>
                    <span className="font-medium">문제 수:</span> {formData.question_ids.length}개
                  </div>
                  
                  <div>
                    <span className="font-medium">제한 시간:</span> {formData.time_limit_minutes}분
                  </div>
                  
                  <div>
                    <span className="font-medium">상태:</span> {formData.is_active ? '활성' : '비활성'}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/admin/schedules')}
                className="btn-secondary"
              >
                취소
              </button>

              <button
                type="submit"
                disabled={loading || questionsLoading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? '생성 중...' : '일정 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}