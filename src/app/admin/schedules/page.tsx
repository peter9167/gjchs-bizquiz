'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminManager } from '@/lib/admin'
import { QuizSchedule } from '@/types/database'

export default function SchedulesManagement() {
  const [schedules, setSchedules] = useState<QuizSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      const scheduleData = await AdminManager.getAllSchedules()
      setSchedules(scheduleData)
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      const success = await AdminManager.deleteSchedule(id)
      if (success) {
        setSchedules(schedules.filter(s => s.id !== id))
        setDeleteConfirm(null)
      }
    } else {
      setDeleteConfirm(id)
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    const success = await AdminManager.updateSchedule(id, { is_active: !currentActive })
    if (success) {
      setSchedules(schedules.map(s => 
        s.id === id ? { ...s, is_active: !currentActive } : s
      ))
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatWeekdays = (weekdays?: number[]) => {
    if (!weekdays || weekdays.length === 0) return '없음'
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return weekdays.map(day => days[day]).join(', ')
  }

  const getScheduleTypeText = (type: string) => {
    switch (type) {
      case 'daily': return '매일'
      case 'weekly': return '주간'
      case 'once': return '일회성'
      default: return type
    }
  }

  const isActiveNow = (schedule: QuizSchedule) => {
    if (!schedule.is_active) return false
    
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8)
    const currentDay = now.getDay()
    const currentDate = now.toISOString().slice(0, 10)
    
    // Check date range
    if (currentDate < schedule.start_date) return false
    if (schedule.end_date && currentDate > schedule.end_date) return false
    
    // Check time range
    if (currentTime < schedule.start_time || currentTime > schedule.end_time) return false
    
    // Check schedule type
    if (schedule.schedule_type === 'weekly') {
      return schedule.weekdays?.includes(currentDay) || false
    }
    if (schedule.schedule_type === 'once') {
      return currentDate === schedule.start_date
    }
    
    return true // daily
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">일정을 불러오는 중...</div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">일정 관리</h1>
                <p className="text-gray-600">퀴즈 일정을 생성하고 관리할 수 있습니다</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/admin/schedules/new')}
                  className="btn-primary"
                >
                  새 일정 추가
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">전체 일정</h3>
              <div className="text-3xl font-bold text-blue-600">
                {schedules.length}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">활성 일정</h3>
              <div className="text-3xl font-bold text-green-600">
                {schedules.filter(s => s.is_active).length}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">현재 진행중</h3>
              <div className="text-3xl font-bold text-purple-600">
                {schedules.filter(isActiveNow).length}
              </div>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-bold text-gray-700 mb-2">주간 일정</h3>
              <div className="text-3xl font-bold text-orange-600">
                {schedules.filter(s => s.schedule_type === 'weekly').length}
              </div>
            </div>
          </div>

          {/* Current Active Schedule */}
          {schedules.filter(isActiveNow).length > 0 && (
            <div className="card mb-8 bg-green-50 border-green-200">
              <h2 className="text-2xl font-bold text-green-800 mb-4">🔴 현재 진행중인 퀴즈</h2>
              {schedules.filter(isActiveNow).map(schedule => (
                <div key={schedule.id} className="bg-white rounded-lg p-4">
                  <h3 className="text-xl font-bold text-gray-900">{schedule.title}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>시간: {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</div>
                    <div>문제 수: {schedule.question_ids.length}개</div>
                    <div>제한 시간: {schedule.time_limit_minutes}분</div>
                    <div>유형: {getScheduleTypeText(schedule.schedule_type)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Schedules List */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">전체 일정</h2>
            
            {schedules.length > 0 ? (
              <div className="space-y-6">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className={`rounded-lg p-6 border ${
                    isActiveNow(schedule) 
                      ? 'bg-green-50 border-green-300' 
                      : schedule.is_active 
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {schedule.title}
                          </h3>
                          <div className="flex space-x-2">
                            {isActiveNow(schedule) && (
                              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                진행중
                              </span>
                            )}
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              schedule.is_active 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {schedule.is_active ? '활성' : '비활성'}
                            </span>
                            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">
                              {getScheduleTypeText(schedule.schedule_type)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">시간:</span><br />
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </div>
                          <div>
                            <span className="font-medium">기간:</span><br />
                            {schedule.start_date} {schedule.end_date ? `~ ${schedule.end_date}` : ''}
                          </div>
                          <div>
                            <span className="font-medium">문제 수:</span><br />
                            {schedule.question_ids.length}개
                          </div>
                          <div>
                            <span className="font-medium">제한 시간:</span><br />
                            {schedule.time_limit_minutes}분
                          </div>
                        </div>

                        {schedule.schedule_type === 'weekly' && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">요일:</span> {formatWeekdays(schedule.weekdays)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => toggleActive(schedule.id, schedule.is_active)}
                          className={`text-sm px-3 py-1 rounded font-bold transition-colors ${
                            schedule.is_active
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {schedule.is_active ? '비활성화' : '활성화'}
                        </button>
                        
                        <button
                          onClick={() => router.push(`/admin/schedules/edit/${schedule.id}`)}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          수정
                        </button>
                        
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className={`text-sm px-3 py-1 rounded font-bold transition-colors ${
                            deleteConfirm === schedule.id
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {deleteConfirm === schedule.id ? '확인' : '삭제'}
                        </button>
                        
                        {deleteConfirm === schedule.id && (
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
                      생성일: {new Date(schedule.created_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">아직 생성된 일정이 없습니다.</p>
                <button
                  onClick={() => router.push('/admin/schedules/new')}
                  className="btn-primary"
                >
                  첫 번째 일정 만들기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}