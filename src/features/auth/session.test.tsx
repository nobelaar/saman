import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureUser } from '@/test/mocks'
import { signIn, signUp, useSession } from './session'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

beforeEach(async () => {
  await supabase.auth.signOut()
})

describe('signIn/signUp', () => {
  it('signs in with valid credentials and stores a session', async () => {
    const { error } = await signIn('coordinador@example.com', 'password123')
    expect(error).toBeNull()
    const { data } = await supabase.auth.getSession()
    expect(data.session?.user.email).toBe('coordinador@example.com')
  })

  it('returns an error when credentials are empty', async () => {
    const { error } = await signIn('', '')
    expect(error).not.toBeNull()
    expect(typeof error).toBe('string')
  })

  it('signs up with valid credentials', async () => {
    const { error, needsEmailConfirm } = await signUp('nuevo@example.com', 'password123')
    expect(error).toBeNull()
    expect(needsEmailConfirm).toBe(false)
  })

  it('returns an error on empty signup', async () => {
    const { error } = await signUp('', '')
    expect(error).not.toBeNull()
  })
})

describe('useSession', () => {
  it('starts loading then resolves to no user when logged out', async () => {
    const { result } = renderHook(() => useSession(), { wrapper })
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('exposes the logged-in user after a successful signIn', async () => {
    await signIn('coordinador@example.com', 'password123')
    const { result } = renderHook(() => useSession(), { wrapper })
    await waitFor(() => expect(result.current.user?.email).toBe(fixtureUser.email))
    expect(result.current.loading).toBe(false)
  })
})