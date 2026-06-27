import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { AuthUser } from '@/types/db'

interface Props {
  user: AuthUser | null
  loading: boolean
  children: ReactNode
}

export function ProtectedRoute({ user, loading, children }: Props) {
  if (loading) {
    return null
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}