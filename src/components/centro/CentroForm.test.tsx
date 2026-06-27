import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CentroAcopio } from '@/types/db'
import { CentroForm, CentroFormValues } from './CentroForm'

vi.mock('@/lib/geo', () => ({
  geocodeAddress: vi.fn(async (q: string) =>
    q === 'NO-RESULT'
      ? null
      : { lat: '10.488', lon: '-66.866', display_name: `${q}, Venezuela` }
  ),
  googleMapsDirectionsUrl: vi.fn(
    (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  ),
}))

import { geocodeAddress } from '@/lib/geo'

const emptyInitial: Partial<CentroAcopio> = {}
const existingInitial: Partial<CentroAcopio> = {
  nombre: 'Centro Existente',
  descripcion: 'desc',
  direccion: 'Av. Urdaneta',
  ciudad: 'Caracas',
  contacto: '@centro',
  lat: 10.488,
  lng: -66.866,
  foto_portada: 'https://cdn.example.com/p.jpg',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CentroForm', () => {
  it('renders all the fields empty in creation mode', () => {
    render(
      <MemoryRouter>
        <CentroForm initial={emptyInitial} onSubmit={vi.fn()} submitting={false} />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('')
    expect(screen.getByLabelText(/dirección/i)).toHaveValue('')
    expect(screen.getByLabelText(/ciudad/i)).toHaveValue('')
  })

  it('preloads values when an existing centro is provided', () => {
    render(
      <MemoryRouter>
        <CentroForm initial={existingInitial} onSubmit={vi.fn()} submitting={false} />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Centro Existente')
    expect(screen.getByLabelText(/ciudad/i)).toHaveValue('Caracas')
    expect(screen.getByLabelText(/contacto/i)).toHaveValue('@centro')
  })

  it('rejects submit when required fields are missing', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MemoryRouter>
        <CentroForm initial={emptyInitial} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /guardar|publicar|registrar|enviar/i }))
    await waitFor(() =>
      expect(screen.getByText(/el nombre es obligatorio|nombre es obligatorio/i)).toBeInTheDocument()
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('geocodes the address on blur and fills lat/lng automatically', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MemoryRouter>
        <CentroForm initial={emptyInitial} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/nombre/i), 'Mi Centro')
    await user.type(screen.getByLabelText(/dirección/i), 'Av. Urdaneta')
    await user.type(screen.getByLabelText(/ciudad/i), 'Caracas')
    await user.tab()
    await waitFor(() => expect(geocodeAddress).toHaveBeenCalled())
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
  })

  it('submits with the geocoded lat/lng when everything is valid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MemoryRouter>
        <CentroForm initial={emptyInitial} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/nombre/i), 'Mi Centro')
    await user.type(screen.getByLabelText(/dirección/i), 'Av. Urdaneta')
    await user.type(screen.getByLabelText(/ciudad/i), 'Caracas')
    await user.tab()
    await waitFor(() => expect(geocodeAddress).toHaveBeenCalled())
    await waitFor(() => {
      const lat = screen.getByLabelText(/latitud/i)
      const lng = screen.getByLabelText(/longitud/i)
      return lat && lng
    })
    await user.click(screen.getByRole('button', { name: /guardar|publicar|registrar|enviar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: CentroFormValues = onSubmit.mock.calls[0][0]
    expect(values.nombre).toBe('Mi Centro')
    expect(values.ciudad).toBe('Caracas')
    expect(values.lat).toBeCloseTo(10.488)
    expect(values.lng).toBeCloseTo(-66.866)
  })

  it('allows manual lat/lng entry when the geocoding toggle is on', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MemoryRouter>
        <CentroForm initial={emptyInitial} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/nombre/i), 'Mi Centro')
    await user.type(screen.getByLabelText(/dirección/i), 'Av. Urdaneta')
    await user.type(screen.getByLabelText(/ciudad/i), 'Caracas')
    await user.click(screen.getByRole('checkbox', { name: /ingresar coordenadas manualmente/i }))
    await user.clear(screen.getByLabelText(/latitud/i))
    await user.type(screen.getByLabelText(/latitud/i), '10.2')
    await user.clear(screen.getByLabelText(/longitud/i))
    await user.type(screen.getByLabelText(/longitud/i), '-67.1')
    await user.click(screen.getByRole('button', { name: /guardar|publicar|registrar|enviar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: CentroFormValues = onSubmit.mock.calls[0][0]
    expect(values.lat).toBeCloseTo(10.2)
    expect(values.lng).toBeCloseTo(-67.1)
  })

  it('disables the submit button while submitting', () => {
    render(
      <MemoryRouter>
        <CentroForm initial={existingInitial} onSubmit={vi.fn()} submitting />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /guardando|publicando|enviando|subiendo/i })).toBeDisabled()
  })

  it('stores the foto URL returned by FotoUploader into the submitted values', async () => {
    vi.mock('@/lib/storage', async (orig) => {
      const actual = await (orig as () => Promise<typeof import('@/lib/storage')>)()
      return {
        ...actual,
        comprimirImagen: vi.fn(async (f: File) => new Blob([f.name], { type: 'image/jpeg' })),
      }
    })
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <CentroForm initial={{ ...existingInitial, foto_portada: null } } onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['data'], 'event.jpg', { type: 'image/jpeg' }))
    await waitFor(() => expect(screen.getByRole('img', { name: /foto de portada/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /guardar|publicar|registrar|enviar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: CentroFormValues = onSubmit.mock.calls[0][0]
    expect(typeof values.foto_portada).toBe('string')
    expect(values.foto_portada).toContain('centros-fotos')
  })
})