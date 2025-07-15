'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminManager } from '@/lib/admin'

export default function NewQuestion() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    category: '',
    difficulty: 1
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const question = await AdminManager.createQuestion(formData)
      if (question) {
        router.push('/admin/questions')
      } else {
        setError('문제 생성에 실패했습니다.')
      }
    } catch (err) {
      setError('문제 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'difficulty' ? parseInt(value) : value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">새 문제 추가</h1>
            <p className="text-gray-600">퀴즈에 사용할 새로운 문제를 생성합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">기본 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문제 제목 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="예: 경제학 기초 개념"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문제 내용 *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={4}
                    className="input-field"
                    placeholder="문제 내용을 자세히 입력해주세요..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문제 이미지 URL (선택사항)
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="예: 경제, 수학, 과학"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      난이도 *
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                      className="input-field"
                      required
                    >
                      <option value={1}>레벨 1 (쉬움)</option>
                      <option value={2}>레벨 2 (보통)</option>
                      <option value={3}>레벨 3 (어려움)</option>
                      <option value={4}>레벨 4 (매우 어려움)</option>
                      <option value={5}>레벨 5 (극난이도)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Options */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">선택지</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    선택지 A *
                  </label>
                  <input
                    type="text"
                    name="option_a"
                    value={formData.option_a}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="첫 번째 선택지"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    선택지 B *
                  </label>
                  <input
                    type="text"
                    name="option_b"
                    value={formData.option_b}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="두 번째 선택지"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    선택지 C *
                  </label>
                  <input
                    type="text"
                    name="option_c"
                    value={formData.option_c}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="세 번째 선택지"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    선택지 D *
                  </label>
                  <input
                    type="text"
                    name="option_d"
                    value={formData.option_d}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="네 번째 선택지"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    정답 *
                  </label>
                  <select
                    name="correct_answer"
                    value={formData.correct_answer}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">미리보기</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">{formData.title || '문제 제목'}</h3>
                <p className="text-gray-700 mb-4">{formData.content || '문제 내용이 여기에 표시됩니다.'}</p>
                
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="max-w-full h-auto mb-4 rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'A', text: formData.option_a },
                    { key: 'B', text: formData.option_b },
                    { key: 'C', text: formData.option_c },
                    { key: 'D', text: formData.option_d }
                  ].map((option) => (
                    <div
                      key={option.key}
                      className={`p-3 rounded-lg border ${
                        option.key === formData.correct_answer
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <span className="font-bold mr-2">{option.key}.</span>
                      {option.text || `선택지 ${option.key}`}
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <span>카테고리: {formData.category || '미분류'}</span>
                  <span className="ml-4">난이도: 레벨 {formData.difficulty}</span>
                  <span className="ml-4">정답: {formData.correct_answer}</span>
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
                onClick={() => router.push('/admin/questions')}
                className="btn-secondary"
              >
                취소
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? '생성 중...' : '문제 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}