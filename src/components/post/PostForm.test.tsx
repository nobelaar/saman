import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/storage', async (orig) => {
  const actual = await (orig as () => Promise<typeof import('@/lib/storage')>)()
  return {
    ...actual,
    comprimirImagen: vi.fn(async (f: File) => new Blob([f.name], { type: 'image/jpeg' })),
  }
})

import { PostForm, PostFormValues } from './PostForm'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PostForm', () => {
  it('requires contenido to submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PostForm centroId="c1" onSubmit={onSubmit} submitting={false} />)
    await user.click(screen.getByRole('button', { name: /publicar|enviar|guardar/i }))
    expect(screen.getByText(/contenido es obligatorio|escribí algo/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits contenido and the selected necesidades (predefined + custom)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PostForm centroId="c1" onSubmit={onSubmit} submitting={false} />)
    await user.type(screen.getByLabelText(/contenido/i), 'Urgente: necesitamos velas y agua.')
    await user.click(screen.getByRole('button', { name: /^Agua$/ }))
    await user.type(screen.getByPlaceholderText(/Otra necesidad/i), 'Lentes{Enter}')
    await user.click(screen.getByRole('button', { name: /publicar|enviar|guardar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: PostFormValues = onSubmit.mock.calls[0][0]
    expect(values.centro_id).toBe('c1')
    expect(values.contenido).toBe('Urgente: necesitamos velas y agua.')
    expect(values.necesidades).toEqual(expect.arrayContaining(['Agua', 'Lentes']))
  })

  it('submits an optional photo URL when a file is uploaded', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { container } = render(<PostForm centroId="c1" onSubmit={onSubmit} submitting={false} />)
    await user.type(screen.getByLabelText(/contenido/i), 'Con foto.')
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(
      input,
      new File(['data'], 'afoto.jpg', { type: 'image/jpeg' })
    )
    await waitFor(() => expect(screen.getByRole('img', { name: /foto/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /publicar|enviar|guardar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: PostFormValues = onSubmit.mock.calls[0][0]
    expect(values.foto_url).not.toBeNull()
    expect(values.foto_url).toContain('centros-fotos')
  })

  it('disables the submit button while submitting', () => {
    render(<PostForm centroId="c1" onSubmit={vi.fn()} submitting />)
    expect(screen.getByRole('button', { name: /publicando|enviando|subiendo/i })).toBeDisabled()
  })

  it('resets the form fields after a successful submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PostForm centroId="c1" onSubmit={onSubmit} submitting={false} />)
    const contenido = screen.getByLabelText(/contenido/i) as HTMLTextAreaElement
    await user.type(contenido, 'Prueba reset')
    await user.click(screen.getByRole('button', { name: /^Agua$/ }))
    await user.click(screen.getByRole('button', { name: /publicar|enviar|guardar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(contenido.value).toBe('')
    expect(screen.getByRole('button', { name: /^Agua$/ })).toHaveAttribute('aria-pressed', 'false')
  })
})