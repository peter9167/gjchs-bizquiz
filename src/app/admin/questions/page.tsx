'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminManager } from '@/lib/admin'
import { Question } from '@/types/database'

export default function QuestionsManagement() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
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
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      const success = await AdminManager.deleteQuestion(id)
      if (success) {
        setQuestions(questions.filter(q => q.id !== id))
        setDeleteConfirm(null)
      }
    } else {
      setDeleteConfirm(id)
    }
  }

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || question.category === filterCategory
    const matchesDifficulty = !filterDifficulty || question.difficulty.toString() === filterDifficulty
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))]
  const difficulties = [...new Set(questions.map(q => q.difficulty))]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">문제를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">문제 관리</h1>
                <p className="text-gray-600">퀴즈 문제를 생성, 수정, 삭제할 수 있습니다</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/admin/questions/new')}
                  className="btn-primary"
                >
                  새 문제 추가
                </button>
                <button
                  onClick={() => router.push('/admin')}
                  className="btn-secondary"
                >
                  대시보드로 돌아가기
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  검색
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="제목 또는 내용 검색"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">모든 카테고리</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  난이도
                </label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="input-field"
                >
                  <option value="">모든 난이도</option>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      레벨 {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterCategory('')
                    setFilterDifficulty('')
                  }}
                  className="btn-secondary w-full"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">전체 문제</h3>
              <div className="text-3xl font-bold text-blue-600">
                {questions.length}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">검색 결과</h3>
              <div className="text-3xl font-bold text-green-600">
                {filteredQuestions.length}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">카테고리</h3>
              <div className="text-3xl font-bold text-purple-600">
                {categories.length}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">평균 난이도</h3>
              <div className="text-3xl font-bold text-orange-600">
                {questions.length > 0 
                  ? Math.round(questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length * 10) / 10
                  : 0
                }
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">문제 목록</h2>
            
            {filteredQuestions.length > 0 ? (
              <div className="space-y-6">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="bg-gray-50 rounded-lg p-6 border">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {question.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span>카테고리: {question.category || '미분류'}</span>
                          <span>난이도: 레벨 {question.difficulty}</span>
                          <span>정답: {question.correct_answer}</span>
                        </div>
                        <p className="text-gray-700 mb-4">{question.content}</p>
                        
                        {question.image_url && (
                          <img
                            src={question.image_url}
                            alt="Question"
                            className="max-w-xs h-auto mb-4 rounded-lg"
                          />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className={`p-2 rounded ${question.correct_answer === 'A' ? 'bg-green-100' : 'bg-white'}`}>
                            <span className="font-bold">A.</span> {question.option_a}
                          </div>
                          <div className={`p-2 rounded ${question.correct_answer === 'B' ? 'bg-green-100' : 'bg-white'}`}>
                            <span className="font-bold">B.</span> {question.option_b}
                          </div>
                          <div className={`p-2 rounded ${question.correct_answer === 'C' ? 'bg-green-100' : 'bg-white'}`}>
                            <span className="font-bold">C.</span> {question.option_c}
                          </div>
                          <div className={`p-2 rounded ${question.correct_answer === 'D' ? 'bg-green-100' : 'bg-white'}`}>
                            <span className="font-bold">D.</span> {question.option_d}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => router.push(`/admin/questions/edit/${question.id}`)}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className={`text-sm px-3 py-1 rounded font-bold transition-colors ${
                            deleteConfirm === question.id
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {deleteConfirm === question.id ? '확인' : '삭제'}
                        </button>
                        {deleteConfirm === question.id && (
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="btn-secondary text-sm px-3 py-1"
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      생성일: {new Date(question.created_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterCategory || filterDifficulty 
                    ? '검색 조건에 맞는 문제가 없습니다.' 
                    : '아직 생성된 문제가 없습니다.'
                  }
                </p>
                <button
                  onClick={() => router.push('/admin/questions/new')}
                  className="btn-primary"
                >
                  첫 번째 문제 만들기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}