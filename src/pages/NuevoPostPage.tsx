import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCrearPost } from '@/features/posts/mutations'
import { useCentros } from '@/features/centros/queries'
import { PostForm } from '@/components/post/PostForm'
import { ChevronLeft } from 'lucide-react'
import type { AuthUser } from '@/types/db'

interface Props {
  user: AuthUser | null
}

export function NuevoPostPage({ user }: Props) {
  const navigate = useNavigate()
  const crearPost = useCrearPost()
  const { data: centros = [] } = useCentros()

  const misCentros = centros.filter((c) => c.coordinador_id === user?.id)
  const [centroSeleccionado, setCentroSeleccionado] = useState<string | null>(
    misCentros.length === 1 ? misCentros[0].id : null
  )

  if (!user) {
    navigate('/login?redirect=/post/nuevo')
    return null
  }

  if (misCentros.length === 0) {
    return (
      <div className="pb-14">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-[17px] font-bold">Nuevo post</span>
        </div>
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Para crear un post necesitas ser coordinador de un centro de acopio.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-14">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[17px] font-bold">Nuevo post</span>
      </div>

      {!centroSeleccionado ? (
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-muted-foreground">Selecciona el centro para publicar:</p>
          <div className="flex flex-wrap gap-2">
            {misCentros.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCentroSeleccionado(c.id)}
                className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground hover:bg-secondary/80"
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <PostForm
          centroId={centroSeleccionado}
          submitting={crearPost.isPending}
          onSubmit={(values) =>
            crearPost.mutate(values, {
              onSuccess: () => navigate('/'),
            })
          }
        />
      )}
    </div>
  )
}
