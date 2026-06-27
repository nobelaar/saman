import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { createTestQueryClient } from '@/test/test-utils'
import { ProtectedRoute } from './ProtectedRoute'

function wrap(initial: string, children: ReactNode) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="*" element={children} />
          <Route path="/login" element={<div data-testid="login">página login</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProtectedRoute', () => {
  it('renders children when loading is true (show nothing / fallback)', () => {
    void render(
      wrap('/centros/nuevo', <ProtectedRoute loading user={null}><div data-testid="secret">ok</div></ProtectedRoute>)
    )
    expect(screen.queryByTestId('secret')).not.toBeInTheDocument()
    expect(screen.queryByTestId('login')).not.toBeInTheDocument()
  })

  it('renders children when an authenticated user is present', () => {
    render(
      wrap('/centros/nuevo', <ProtectedRoute loading={false} user={{ id: 'u1', email: 'a@b.com' }}><div data-testid="secret">ok</div></ProtectedRoute>)
    )
    expect(screen.getByTestId('secret')).toHaveTextContent('ok')
  })

  it('redirects to /login when there is no authenticated user', () => {
    render(
      wrap('/centros/nuevo', <ProtectedRoute loading={false} user={null}><div data-testid="secret">ok</div></ProtectedRoute>)
    )
    expect(screen.getByTestId('login')).toBeInTheDocument()
    expect(screen.queryByTestId('secret')).not.toBeInTheDocument()
  })
})