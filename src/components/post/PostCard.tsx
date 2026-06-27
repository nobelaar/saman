import type { Post } from '@/types/db'
import { formatDate } from '@/lib/utils'

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
      </div>
      {post.foto_url && (
        <img
          src={post.foto_url}
          alt="Foto del post"
          loading="lazy"
          className="mt-2 h-64 w-full rounded-md object-cover"
        />
      )}
      {post.contenido && <p className="mt-2 whitespace-pre-line text-sm">{post.contenido}</p>}
      {post.necesidades.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.necesidades.map((n) => (
            <span
              key={n}
              className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {n}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}