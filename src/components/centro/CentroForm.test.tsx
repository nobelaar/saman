import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CentroAcopio } from '@/types/db'
import { CentroForm, CentroFormValues } from './CentroForm'

const emptyInitial: Partial<CentroAcopio> = {}
const existingInitial: Partial<CentroAcopio> = {
  nombre: 'Centro Existente',
  descripcion: 'desc',
  direccion: 'Av. Urdaneta',
  ciudad: 'Caracas',
  contacto: '@centro',
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

  it('submits with valid fields', async () => {
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
    await user.click(screen.getByRole('button', { name: /guardar|publicar|registrar|enviar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: CentroFormValues = onSubmit.mock.calls[0][0]
    expect(values.nombre).toBe('Mi Centro')
    expect(values.ciudad).toBe('Caracas')
    expect(values.direccion).toBe('Av. Urdaneta')
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
        <CentroForm initial={{ ...existingInitial, foto_portada: null }} onSubmit={onSubmit} submitting={false} />
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
