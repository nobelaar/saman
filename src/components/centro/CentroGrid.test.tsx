import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { CentroCercano } from '@/types/db'
import { CentroGrid } from './CentroGrid'

const centros: CentroCercano[] = [
  {
    id: 'c1',
    nombre: 'Centro Uno',
    ciudad: 'Caracas',
    direccion: '',
    descripcion: null,
    foto_portada: null,
    contacto: null,
    distancia_km: 1,
    ultimo_post_contenido: null,
    ultimo_post_created_at: null,
  },
  {
    id: 'c2',
    nombre: 'Centro Dos',
    ciudad: 'Valencia',
    direccion: '',
    descripcion: null,
    foto_portada: null,
    contacto: null,
    distancia_km: 2,
    ultimo_post_contenido: null,
    ultimo_post_created_at: null,
  },
  {
    id: 'c3',
    nombre: 'Centro Tres',
    ciudad: 'Maracay',
    direccion: '',
    descripcion: null,
    foto_portada: null,
    contacto: null,
    distancia_km: 3,
    ultimo_post_contenido: null,
    ultimo_post_created_at: null,
  },
]

describe('CentroGrid', () => {
  it('renders one CentroCard per centro', () => {
    render(
      <MemoryRouter>
        <CentroGrid centros={centros} />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getByText('Centro Uno')).toBeInTheDocument()
    expect(screen.getByText('Centro Dos')).toBeInTheDocument()
    expect(screen.getByText('Centro Tres')).toBeInTheDocument()
  })

  it('renders an empty state message when there are no centros', () => {
    render(
      <MemoryRouter>
        <CentroGrid centros={[]} />
      </MemoryRouter>
    )
    expect(
      screen.getByText(/no hay centros|aún no hay centros/i)
    ).toBeInTheDocument()
  })

  it('renders a loading skeleton when isLoading is true (no cards)', () => {
    const { container } = render(
      <MemoryRouter>
        <CentroGrid centros={[]} isLoading />
      </MemoryRouter>
    )
    const grid = container.querySelector('[data-testid="centro-grid"]') as HTMLElement
    within(grid).getByText(/cargando/i)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})