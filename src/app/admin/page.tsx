'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRoot() {
  const router = useRouter()

  useEffect(() => {
    // 인증 확인 후 적절한 페이지로 리디렉션
    const isAuthenticated = sessionStorage.getItem('admin_authenticated')
    
    if (isAuthenticated) {
      // 이미 인증된 경우 대시보드로 이동
      router.push('/admin/dashboard')
    } else {
      // 인증되지 않은 경우 로그인 페이지로 이동
      router.push('/admin/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">관리자 페이지로 이동 중...</div>
    </div>
  )
}