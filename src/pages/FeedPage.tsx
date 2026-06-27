import { useCallback, useMemo } from 'react'
import { useInfinitePostsFeed } from '@/features/posts/queries'
import { useCentros } from '@/features/centros/queries'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeletonList } from '@/components/post/PostSkeleton'
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PostWithUtil } from '@/types/db'

export function FeedPage() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfinitePostsFeed()

  const { data: centros = [] } = useCentros()

  const centroMap = useMemo(() => {
    const map = new Map<string, { nombre: string; ciudad: string }>()
    for (const c of centros) {
      map.set(c.id, { nombre: c.nombre, ciudad: c.ciudad })
    }
    return map
  }, [centros])

  const posts: PostWithUtil[] = data?.pages.flat() ?? []

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useIntersectionObserver(loadMore, hasNextPage ?? false)

  if (isLoading) {
    return (
      <div className="py-4">
        <PostSkeletonList count={5} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar las publicaciones.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Heart size={48} className="text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground">
          Aun no hay publicaciones.
          <br />
          Cuando los centros publiquen actualizaciones, apareceran aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="py-2">
      {posts.map((post) => {
        const centro = centroMap.get(post.centro_id)
        return (
          <PostCard
            key={post.id}
            post={post}
            showCentro
            centroNombre={centro?.nombre ?? 'Centro'}
            centroCiudad={centro?.ciudad ?? ''}
          />
        )
      })}
      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage ? (
          <span className="text-sm text-muted-foreground">Cargando mas...</span>
        ) : hasNextPage ? (
          <span className="text-sm text-muted-foreground">Desliza para ver mas</span>
        ) : null}
      </div>
    </div>
  )
}
