import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { RegistroPage } from './RegistroPage'

function renderRegistroPage() {
  const Probe = () => {
    const loc = useLocation()
    return <div data-testid="loc">{loc.pathname}</div>
  }
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/registro']}>
        <Routes>
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/login" element={<div data-testid="login">login</div>} />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await supabase.auth.signOut()
})

describe('RegistroPage', () => {
  it('registers a new account and navigates to home on success', async () => {
    const user = userEvent.setup()
    renderRegistroPage()
    await user.type(screen.getByLabelText(/email|correo/i), 'nuevo@example.com')
    await user.type(screen.getByLabelText(/contraseña|password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /registr|crear cuenta/i }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/'))
  })

  it('shows an error when the signup fails', async () => {
    const user = userEvent.setup()
    renderRegistroPage()
    await user.click(screen.getByRole('button', { name: /registr|crear cuenta/i }))
    await waitFor(() =>
      expect(screen.getByText(/inválid|credenciales|error|no se pudo/i)).toBeInTheDocument()
    )
  })

  it('has a link back to the login page', () => {
    renderRegistroPage()
    expect(screen.getByRole('link', { name: /iniciar sesión|entrar/i })).toHaveAttribute('href', '/login')
  })
})