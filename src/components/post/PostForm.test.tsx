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
  it('requires contenido to submit (button disabled when empty)', async () => {
    const onSubmit = vi.fn()
    render(<PostForm centroId="c1" onSubmit={onSubmit} submitting={false} />)
    const btn = screen.getByRole('button', { name: /publicar/i })
    expect(btn).toBeDisabled()
  })

  it('submits contenido and the selected necesidades after toggling extras', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PostForm centroId="c1" onSubmit={onSubmit} submitting={false} />)
    const textarea = screen.getByPlaceholderText(/que necesita este centro/i)
    await user.type(textarea, 'Urgente: necesitamos velas y agua.')
    // Toggle extras to show necesidades selector
    await user.click(screen.getByRole('button', { name: '' }))
    await user.click(screen.getByRole('button', { name: /Agua/ }))
    await user.type(screen.getByPlaceholderText(/Otra necesidad/i), 'Lentes{Enter}')
    await user.click(screen.getByRole('button', { name: /publicar/i }))
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
    const textarea = screen.getByPlaceholderText(/que necesita este centro/i)
    await user.type(textarea, 'Con foto.')
    // Toggle extras to show uploader
    await user.click(screen.getByRole('button', { name: '' }))
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(
      input,
      new File(['data'], 'afoto.jpg', { type: 'image/jpeg' })
    )
    await waitFor(() => expect(screen.getByRole('img', { name: /foto/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /publicar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: PostFormValues = onSubmit.mock.calls[0][0]
    expect(values.foto_url).not.toBeNull()
    expect(values.foto_url).toContain('centros-fotos')
  })

  it('disables the submit button while submitting', () => {
    render(<PostForm centroId="c1" onSubmit={vi.fn()} submitting />)
    expect(screen.getByRole('button', { name: /publicando/i })).toBeDisabled()
  })

  it('resets the form fields after a successful submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PostForm centroId="c1" onSubmit={onSubmit} submitting={false} />)
    const textarea = screen.getByPlaceholderText(/que necesita este centro/i) as HTMLTextAreaElement
    await user.type(textarea, 'Prueba reset')
    // Toggle extras to show necesidades
    await user.click(screen.getByRole('button', { name: '' }))
    await user.click(screen.getByRole('button', { name: /Agua/ }))
    await user.click(screen.getByRole('button', { name: /publicar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(textarea.value).toBe('')
  })
})
