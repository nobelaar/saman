import type { Post } from '@/types/db'
import { PostCard } from './PostCard'
import { Button } from '@/components/ui/button'

interface Props {
  posts: Post[]
  isLoading: boolean
  isLive?: boolean
  error?: Error | null
  onRetry?: () => void
}

export function PostFeed({ posts, isLoading, isLive, error, onRetry }: Props) {
  if (error) {
    return (
      <div data-testid="post-feed" className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-4">
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
      <div data-testid="post-feed" className="py-8 text-center text-sm text-muted-foreground">
        Cargando publicaciones…
      </div>
    )
  }
  if (posts.length === 0) {
    return (
      <div data-testid="post-feed" className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay publicaciones en este centro.
      </div>
    )
  }
  return (
    <div data-testid="post-feed" className="space-y-3">
      {isLive && (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          En vivo
        </p>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  )
}