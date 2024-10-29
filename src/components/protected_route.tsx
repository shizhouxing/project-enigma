'use client';
import { useCookieCheck } from '@/hooks/useCookieCheck'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  useCookieCheck('auth-token')
  return <>{children}</>
}