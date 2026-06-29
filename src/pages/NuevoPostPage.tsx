import { useNavigate } from 'react-router-dom'
import { useCrearPost } from '@/features/posts/mutations'
import { PostForm } from '@/components/post/PostForm'
import { ChevronLeft } from 'lucide-react'
import type { AuthUser } from '@/types/db'

interface Props {
  user: AuthUser | null
}

export function NuevoPostPage({ user }: Props) {
  const navigate = useNavigate()
  const crearPost = useCrearPost()

  if (!user) {
    navigate('/login?redirect=/post/nuevo')
    return null
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

      <PostForm
        userId={user.id}
        submitting={crearPost.isPending}
        onSubmit={(values) =>
          crearPost.mutate(values, {
            onSuccess: () => navigate('/'),
          })
        }
      />
    </div>
  )
}
