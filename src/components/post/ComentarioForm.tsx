import { useState } from 'react'
import { useCrearComentario } from '@/features/posts/comentarios-mutations'
import type { AuthUser } from '@/types/db'

interface Props {
  postId: string
  user: AuthUser | null
}

export function ComentarioForm({ postId, user }: Props) {
  const [contenido, setContenido] = useState('')
  const crear = useCrearComentario()

  if (!user) {
    return (
      <p className="border-b border-border px-4 py-2 text-[13px] text-muted-foreground">
        Inicia sesion para comentar
      </p>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return
    crear.mutate(
      { postId, contenido: contenido.trim() },
      { onSuccess: () => setContenido('') }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-b border-border px-4 py-2">
      <input
        type="text"
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Escribi un comentario..."
        maxLength={500}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        type="submit"
        disabled={!contenido.trim() || crear.isPending}
        className="shrink-0 text-[14px] font-semibold text-primary disabled:opacity-40"
      >
        {crear.isPending ? '...' : 'Enviar'}
      </button>
    </form>
  )
}
