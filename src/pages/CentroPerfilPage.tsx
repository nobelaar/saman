import { Link, useParams } from 'react-router-dom'
import type { AuthUser, PostWithUtil } from '@/types/db'
import { useCentro } from '@/features/centros/queries'
import { usePostsCentro } from '@/features/posts/queries'
import { useCrearPost } from '@/features/posts/mutations'
import { useRealtimePosts } from '@/features/posts/realtime'
import { PostFeed } from '@/components/post/PostFeed'
import { PostForm } from '@/components/post/PostForm'
import { MoreHorizontal, MapPin, Phone } from 'lucide-react'

interface Props {
  user: AuthUser | null
}

export function CentroPerfilPage({ user }: Props) {
  const { id = '' } = useParams()
  const { data: centro, isLoading, error } = useCentro(id)
  const {
    data: posts = [],
    isLoading: postsLoading,
    error: postsError,
    refetch,
  } = usePostsCentro(id)
  const isLive = useRealtimeSafe(id)
  void isLive
  const crearPost = useCrearPost()
  const esCoordinador = !!(user && centro && user.id === centro.coordinador_id)

  if (!id) return null

  if (isLoading) {
    return <p className="py-8 text-sm text-muted-foreground">Cargando centro...</p>
  }
  if (error || !centro) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No se encontro el centro solicitado.
      </p>
    )
  }

  const totalUtiles = (posts as PostWithUtil[]).reduce(
    (sum, p) => sum + (p.util_count ?? 0),
    0
  )

  return (
    <div className="space-y-0 pb-14">
      <div className="relative h-[140px] w-full overflow-hidden bg-gradient-to-b from-[#1A0A00] to-black">
        {centro.foto_portada && (
          <img
            src={centro.foto_portada}
            alt={centro.nombre}
            className="h-full w-full object-cover"
          />
        )}
        {esCoordinador && (
          <Link
            to={`/centro/${centro.id}/editar`}
            className="absolute right-3 top-3 rounded-full border border-border bg-black/60 p-1.5 text-white backdrop-blur hover:bg-black/80"
          >
            <MoreHorizontal size={18} />
          </Link>
        )}
      </div>

      <div className="space-y-3 px-4 py-3">
        <div>
          <h1 className="text-xl font-bold">{centro.nombre}</h1>
          <p className="text-[15px] text-muted-foreground">@{centro.ciudad}</p>
        </div>

        {centro.descripcion && (
          <p className="whitespace-pre-line text-[15px] leading-relaxed">
            {centro.descripcion}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} />
            {centro.direccion}
          </span>
          {centro.contacto && (
            <a
              href={`https://wa.me/${centro.contacto.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone size={14} />
              {centro.contacto}
            </a>
          )}
        </div>

        <div className="flex gap-6 border-y border-border py-3 text-[13px]">
          <span>
            <strong className="text-foreground">{posts.length}</strong>{' '}
            <span className="text-muted-foreground">publicaciones</span>
          </span>
          <span>
            <strong className="text-foreground">{totalUtiles}</strong>{' '}
            <span className="text-muted-foreground">utiles</span>
          </span>
        </div>
      </div>

      <div className="border-b border-border px-4 py-2">
        <span className="text-[13px] font-semibold text-muted-foreground">
          Publicaciones
        </span>
      </div>

      {esCoordinador && (
        <div className="border-b border-border">
          <PostForm
            centroId={centro.id}
            submitting={crearPost.isPending}
            onSubmit={(values) =>
              crearPost.mutate(values, {
                onSuccess: () => refetch(),
              })
            }
          />
        </div>
      )}

      <PostFeed
        posts={posts as PostWithUtil[]}
        isLoading={postsLoading}
        isLive
        error={postsError}
        onRetry={() => refetch()}
        centroNombre={centro.nombre}
        centroCiudad={centro.ciudad}
      />
    </div>
  )
}

function useRealtimeSafe(centroId: string): boolean {
  useRealtimePosts(centroId)
  return true
}
