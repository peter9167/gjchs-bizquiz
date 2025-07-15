'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminManager } from '@/lib/admin'
import { Student } from '@/types/database'

export default function StudentsManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const studentData = await AdminManager.getAllStudents()
      setStudents(studentData)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      const success = await AdminManager.deleteStudent(id)
      if (success) {
        setStudents(students.filter(s => s.id !== id))
        setDeleteConfirm(null)
      }
    } else {
      setDeleteConfirm(id)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = !filterGrade || student.grade.toString() === filterGrade
    const matchesClass = !filterClass || student.class.toString() === filterClass
    
    return matchesSearch && matchesGrade && matchesClass
  })

  const grades = [...new Set(students.map(s => s.grade))].sort()
  const classes = filterGrade 
    ? [...new Set(students.filter(s => s.grade.toString() === filterGrade).map(s => s.class))].sort()
    : [...new Set(students.map(s => s.class))].sort()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">학생 데이터를 불러오는 중...</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">학생 관리</h1>
                <p className="text-gray-600">등록된 학생들의 정보를 확인하고 관리할 수 있습니다</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={loadStudents}
                  className="btn-secondary"
                >
                  새로고침
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
                  placeholder="이름 또는 전화번호 검색"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학년
                </label>
                <select
                  value={filterGrade}
                  onChange={(e) => {
                    setFilterGrade(e.target.value)
                    setFilterClass('') // Reset class filter when grade changes
                  }}
                  className="input-field"
                >
                  <option value="">모든 학년</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}학년</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반
                </label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="input-field"
                  disabled={!filterGrade}
                >
                  <option value="">모든 반</option>
                  {classes.map(classNum => (
                    <option key={classNum} value={classNum}>{classNum}반</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterGrade('')
                    setFilterClass('')
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
              <h3 className="text-lg font-bold text-gray-700 mb-2">전체 학생</h3>
              <div className="text-3xl font-bold text-blue-600">
                {students.length}명
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">검색 결과</h3>
              <div className="text-3xl font-bold text-green-600">
                {filteredStudents.length}명
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">활성 학급</h3>
              <div className="text-3xl font-bold text-purple-600">
                {new Set(students.map(s => `${s.grade}-${s.class}`)).size}개
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">최근 등록</h3>
              <div className="text-lg font-bold text-orange-600">
                {students.length > 0 
                  ? new Date(students[0].created_at).toLocaleDateString('ko-KR')
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">학생 목록</h2>
            
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">학급</th>
                      <th className="text-left py-3 px-2">번호</th>
                      <th className="text-left py-3 px-2">이름</th>
                      <th className="text-left py-3 px-2">전화번호</th>
                      <th className="text-left py-3 px-2">등록일</th>
                      <th className="text-right py-3 px-2">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-2 font-medium">
                          {student.grade}학년 {student.class}반
                        </td>
                        <td className="py-3 px-2">
                          {student.number}번
                        </td>
                        <td className="py-3 px-2 font-bold">
                          {student.name}
                        </td>
                        <td className="py-3 px-2 text-gray-600">
                          {student.phone || '-'}
                        </td>
                        <td className="py-3 px-2 text-gray-600">
                          {new Date(student.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => handleDelete(student.id)}
                            className={`text-sm px-3 py-1 rounded font-bold transition-colors ${
                              deleteConfirm === student.id
                                ? 'bg-red-600 text-white'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            {deleteConfirm === student.id ? '확인' : '삭제'}
                          </button>
                          {deleteConfirm === student.id && (
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="btn-secondary text-sm px-3 py-1 ml-2"
                            >
                              취소
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterGrade || filterClass 
                    ? '검색 조건에 맞는 학생이 없습니다.' 
                    : '아직 등록된 학생이 없습니다.'
                  }
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="btn-primary"
                >
                  학생 등록 페이지로 이동
                </button>
              </div>
            )}
          </div>

          {/* Grade/Class Statistics */}
          {students.length > 0 && (
            <div className="card mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">학급별 통계</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...new Set(students.map(s => `${s.grade}-${s.class}`))]
                  .sort()
                  .map(gradeClass => {
                    const [grade, classNum] = gradeClass.split('-')
                    const classStudents = students.filter(s => 
                      s.grade.toString() === grade && s.class.toString() === classNum
                    )
                    
                    return (
                      <div key={gradeClass} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-lg mb-2">
                          {grade}학년 {classNum}반
                        </h3>
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {classStudents.length}명
                        </div>
                        <div className="text-sm text-gray-600">
                          최근 등록: {classStudents.length > 0 
                            ? new Date(Math.max(...classStudents.map(s => new Date(s.created_at).getTime())))
                                .toLocaleDateString('ko-KR')
                            : 'N/A'
                          }
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/admin/export')}
              className="btn-primary"
            >
              학생 데이터 내보내기
            </button>
            
            <button
              onClick={() => router.push('/admin/analytics')}
              className="btn-secondary"
            >
              분석 리포트
            </button>
            
            <button
              onClick={() => router.push('/rankings')}
              className="btn-secondary"
            >
              실시간 랭킹 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}