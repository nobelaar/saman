import { Link, useParams } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { useCentro } from '@/features/centros/queries'
import { usePostsCentro } from '@/features/posts/queries'
import { useCrearPost } from '@/features/posts/mutations'
import { useRealtimePosts } from '@/features/posts/realtime'
import { googleMapsDirectionsUrl } from '@/lib/geo'
import { PostFeed } from '@/components/post/PostFeed'
import { PostForm } from '@/components/post/PostForm'
import { Button } from '@/components/ui/button'

interface Props {
  user: AuthUser | null
}

export function CentroPerfilPage({ user }: Props) {
  const { id = '' } = useParams()
  const { data: centro, isLoading, error } = useCentro(id)
  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch } = usePostsCentro(id)
  const isLive = useRealtimeSafe(id)
  void isLive
  const crearPost = useCrearPost()
  const esCoordinador = !!(user && centro && user.id === centro.coordinador_id)

  if (!id) return null

  if (isLoading) {
    return <p className="py-8 text-sm text-muted-foreground">Cargando centro…</p>
  }
  if (error || !centro) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No se encontró el centro solicitado.
      </p>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <section className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{centro.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {centro.ciudad} · {centro.direccion}
            </p>
            {centro.contacto && (
              <a
                href={`https://wa.me/${centro.contacto.replace(/[^0-9]/g, '')}`}
                className="text-sm text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {centro.contacto}
              </a>
            )}
          </div>
          {esCoordinador && (
            <Link
              to={`/centro/${centro.id}/editar`}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-accent"
            >
              Editar
            </Link>
          )}
        </div>
        <a href={googleMapsDirectionsUrl(centro.lat, centro.lng)} target="_blank" rel="noopener noreferrer">
          <Button variant="default" size="default">
            Cómo llegar
          </Button>
        </a>
        {centro.descripcion && (
          <p className="whitespace-pre-line text-sm text-muted-foreground">{centro.descripcion}</p>
        )}
      </section>

      {esCoordinador && (
        <PostForm
          centroId={centro.id}
          submitting={crearPost.isPending}
          onSubmit={(values) =>
            crearPost.mutate(values, {
              onSuccess: () => refetch(),
            })
          }
        />
      )}

      <PostFeed
        posts={posts}
        isLoading={postsLoading}
        isLive
        error={postsError}
        onRetry={() => refetch()}
      />
    </div>
  )
}

function useRealtimeSafe(centroId: string): boolean {
  useRealtimePosts(centroId)
  return true
}
void Button