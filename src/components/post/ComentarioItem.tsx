import type { ComentarioWithUtil } from '@/types/db'
import { formatDate } from '@/lib/utils'
import { Heart } from 'lucide-react'
import { useToggleComentarioUtil } from '@/features/posts/comentarios-mutations'
import { addToast } from '@/lib/hooks/useToast'

interface Props {
  comentario: ComentarioWithUtil
  postId: string
}

export function ComentarioItem({ comentario, postId }: Props) {
  const toggleUtil = useToggleComentarioUtil()

  function handleUtil() {
    toggleUtil.mutate(
      {
        comentarioId: comentario.id,
        postId,
        active: comentario.user_has_util,
      },
      {
        onError: (err) => {
          addToast(err.message || 'No se pudo registrar', 'error')
        },
      }
    )
  }

  return (
    <div className="border-b border-border px-4 py-2">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="font-medium text-muted-foreground">
          {comentario.autor_email ?? 'Usuario'}
        </span>
        <span className="text-muted-foreground/60">·</span>
        <time dateTime={comentario.created_at} className="text-muted-foreground/60">
          {formatDate(comentario.created_at)}
        </time>
      </div>
      <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">
        {comentario.contenido}
      </p>
      <button
        type="button"
        onClick={handleUtil}
        disabled={toggleUtil.isPending}
        className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
      >
        <Heart
          size={14}
          className={comentario.user_has_util ? 'fill-primary text-primary' : ''}
        />
        <span>{comentario.util_count}</span>
      </button>
    </div>
  )
}
