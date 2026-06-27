import { useEffect, useState } from 'react'
import type { AuthUser } from '@/types/db'
import { supabase } from '@/lib/supabase'

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? error.message : null }
}

export async function signUp(
  email: string,
  password: string
): Promise<{ error: string | null; needsEmailConfirm: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message, needsEmailConfirm: false }
  return { error: null, needsEmailConfirm: data.session == null }
}

export function useSession(): { user: AuthUser | null; loading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const sessionUser = data.session?.user
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? '' } : null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? '' } : null)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}