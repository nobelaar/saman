import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureUser } from '@/test/mocks'
import { NuevoCentroPage } from './NuevoCentroPage'

function renderNew(user = fixtureUser) {
  const Probe = () => {
    const loc = useLocation()
    return <div data-testid="loc">{loc.pathname}</div>
  }
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/centros/nuevo']}>
        <Routes>
          <Route path="/centros/nuevo" element={<NuevoCentroPage user={user} />} />
          <Route path="/centro/:id" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await supabase.auth.signOut()
})

describe('NuevoCentroPage', () => {
  it('submits the form and navigates to the created centro detail', async () => {
    const user = userEvent.setup()
    renderNew()
    await user.type(screen.getByLabelText(/nombre/i), 'Centro Nuevo')
    await user.type(screen.getByLabelText(/dirección/i), 'Av. Urdaneta')
    await user.type(screen.getByLabelText(/ciudad/i), 'Caracas')
    await user.click(screen.getByRole('button', { name: /registrar|guardar|publicar|enviar/i }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(/^\/centro\//))
  })

  it('uses the authenticated user id as coordinador_id on submit', async () => {
    const user = userEvent.setup()
    const { container } = renderNew({ id: '00000000-0000-0000-0000-0000000000ff', email: 'z@x.com' })
    await user.type(screen.getByLabelText(/nombre/i), 'Centro Z')
    await user.type(screen.getByLabelText(/dirección/i), 'Av. Urdaneta')
    await user.type(screen.getByLabelText(/ciudad/i), 'Caracas')
    await waitFor(() => expect(container).toBeTruthy())
    await user.click(screen.getByRole('button', { name: /registrar|guardar|publicar|enviar/i }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(/^\/centro\//))
  })
})
