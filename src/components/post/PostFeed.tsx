import type { PostWithUtil } from '@/types/db'
import { PostCard } from './PostCard'
import { PostSkeletonList } from './PostSkeleton'
import { Button } from '@/components/ui/button'

interface Props {
  posts: PostWithUtil[]
  isLoading: boolean
  isLive?: boolean
  error?: Error | null
  onRetry?: () => void
  centroNombre?: string
  centroCiudad?: string
}

export function PostFeed({
  posts,
  isLoading,
  isLive,
  error,
  onRetry,
  centroNombre,
  centroCiudad,
}: Props) {
  if (error) {
    return (
      <div data-testid="post-feed" className="space-y-2 rounded-md border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">No se pudieron cargar las publicaciones.</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  if (isLoading && posts.length === 0) {
    return (
      <div data-testid="post-feed">
        <PostSkeletonList count={3} />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div data-testid="post-feed" className="py-8 text-center text-sm text-muted-foreground">
        Aun no hay publicaciones en este centro.
      </div>
    )
  }

  return (
    <div data-testid="post-feed">
      {isLive && (
        <p className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-primary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          En vivo
        </p>
      )}
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          showCentro={!centroNombre}
          centroNombre={centroNombre}
          centroCiudad={centroCiudad}
        />
      ))}
    </div>
  )
}
