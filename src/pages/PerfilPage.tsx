import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/features/auth/session'
import { useInfinitePostsPorUsuario } from '@/features/posts/queries'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeletonList } from '@/components/post/PostSkeleton'
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import type { PostWithUtil } from '@/types/db'

export function PerfilPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePostsPorUsuario(user?.id ?? '')

  const posts: PostWithUtil[] = data?.pages.flat() ?? []

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useIntersectionObserver(loadMore, hasNextPage ?? false)

  if (!user) {
    navigate('/login')
    return null
  }

  if (isLoading) {
    return <div className="py-4"><PostSkeletonList count={5} /></div>
  }

  return (
    <div className="pb-14">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <User size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-[15px] font-bold">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-4 py-2">
        <span className="text-[13px] font-semibold text-muted-foreground">
          Tus publicaciones
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <User size={48} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aun no tenes publicaciones.
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} showCentro={false} />
        ))
      )}

      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage && <span className="text-sm text-muted-foreground">Cargando mas...</span>}
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
        >
          Cerrar sesion
        </Button>
      </div>
    </div>
  )
}
