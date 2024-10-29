'use client';
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from '@/service/auth';

export const useCookieCheck = (cookieName: string, interval = 1000) => {
  const router = useRouter()
  
  useEffect(() => {
    const checkCookie = async () => {
      const token = await getAuthToken()
      if (!token) {
        console.log('Auth token not found, redirecting to login')
        router.push('/login')
      }
    }

    // Check immediately on mount
    checkCookie()
    
    // Set up periodic checking
    const intervalId = setInterval(checkCookie, interval)

    // Cleanup on unmount
    return () => clearInterval(intervalId)
  }, [cookieName, interval, router])
}
