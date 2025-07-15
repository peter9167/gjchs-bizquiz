'use client'

import { useEffect, useState } from 'react'

interface QuizTimerProps {
  timeLimit: number // in minutes
  onTimeUp: () => void
  onTimeUpdate?: (remainingTime: number) => void
}

export default function QuizTimer({ timeLimit, onTimeUp, onTimeUpdate }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60) // convert to seconds

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
      onTimeUpdate?.(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, onTimeUp, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressColor = () => {
    const percentage = (timeLeft / (timeLimit * 60)) * 100
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTextColor = () => {
    const percentage = (timeLeft / (timeLimit * 60)) * 100
    if (percentage > 25) return 'text-gray-700'
    return 'text-red-600 font-bold'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">남은 시간</span>
        <span className={`text-lg font-mono ${getTextColor()}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{
            width: `${(timeLeft / (timeLimit * 60)) * 100}%`
          }}
        />
      </div>

      {timeLeft <= 60 && (
        <div className="mt-2 text-center">
          <span className="text-red-600 text-sm font-bold animate-pulse">
            ⚠️ 1분 남았습니다!
          </span>
        </div>
      )}
    </div>
  )
}