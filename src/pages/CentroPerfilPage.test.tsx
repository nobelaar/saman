import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { CentroPerfilPage } from './CentroPerfilPage'

beforeEach(async () => {
  await supabase.auth.signOut()
})

function renderPerfil(id: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/centro/${id}`]}>
        <Routes>
          <Route
            path="/centro/:id"
            element={<CentroPerfilPage user={{ id: fixtureCentro.coordinador_id, email: 'ana@x.com' }} />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CentroPerfilPage', () => {
  it('renders the centro name, ciudad and direccion', async () => {
    renderPerfil(fixtureCentro.id)
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument()
    })
    expect(screen.getByText(new RegExp(fixtureCentro.ciudad))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(fixtureCentro.direccion))).toBeInTheDocument()
  })

  it('shows the contact link when available', async () => {
    renderPerfil(fixtureCentro.id)
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.contacto!)).toBeInTheDocument()
    })
  })

  it('shows a not-found message for nonexistent centro', async () => {
    renderPerfil('ffffffff-ffff-ffff-ffff-ffffffffffff')
    await waitFor(() => {
      expect(screen.getByText(/no se encontró/i)).toBeInTheDocument()
    })
  })

  it('does NOT show the Editar link when the viewer is not the coordinador', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={[`/centro/${fixtureCentro.id}`]}>
          <Routes>
            <Route
              path="/centro/:id"
              element={<CentroPerfilPage user={{ id: 'other-user', email: 'x@y.com' }} />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument()
    })
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument()
  })
})
