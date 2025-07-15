import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem('admin_authenticated')
      if (authStatus === 'true') {
        setIsAuthenticated(true)
      } else {
        router.push('/admin/login')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  return { isAuthenticated, isLoading }
}