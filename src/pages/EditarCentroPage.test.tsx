import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { EditarCentroPage } from './EditarCentroPage'

function renderEdit(id = fixtureCentro.id) {
  const Probe = () => {
    const loc = useLocation()
    return <div data-testid="loc">{loc.pathname}</div>
  }
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/centro/${id}/editar`]}>
        <Routes>
          <Route
            path="/centro/:id/editar"
            element={<EditarCentroPage user={{ id: fixtureCentro.coordinador_id, email: 'ana@x.com' }} />}
          />
          <Route path="/centro/:id" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await supabase.auth.signOut()
})

describe('EditarCentroPage', () => {
  it('loads the existing centro into the form and lets the coordinador update it', async () => {
    const user = userEvent.setup()
    renderEdit()
    const nombre = await screen.findByLabelText(/nombre/i)
    await waitFor(() => expect(nombre).toHaveValue(fixtureCentro.nombre))
    await user.clear(nombre)
    await user.type(nombre, 'Centro Actualizado')
    await user.click(screen.getByRole('button', { name: /guardar|registrar|publicar|enviar/i }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(`/centro/${fixtureCentro.id}`))
  })

  it('shows a not-found message when the centro does not exist', async () => {
    renderEdit('ffffffff-ffff-ffff-ffff-ffffffffffff')
    await waitFor(() =>
      expect(screen.getByText(/no se encontró|no existe|centro no encontrado/i)).toBeInTheDocument()
    )
  })

  it('warns when the authenticated user is not the coordinador of this centro', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={[`/centro/${fixtureCentro.id}/editar`]}>
          <Routes>
            <Route
              path="/centro/:id/editar"
              element={<EditarCentroPage user={{ id: 'otro', email: 'no@coordinador.com' }} />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    await waitFor(() =>
      expect(screen.getByText(/no sos el coordinador|no tenés permiso|no podés editar/i)).toBeInTheDocument()
    )
  })
})
