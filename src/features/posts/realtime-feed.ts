import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post, PostWithUtil } from '@/types/db'

export function useRealtimeFeedPosts(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('posts:feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const newPost = payload.new as Post
          qc.setQueryData<{ pages: PostWithUtil[][]; pageParams: unknown[] }>(
            ['posts', 'feed'],
            (old) => {
              if (!old || !old.pages?.length) {
                return {
                  pages: [[{ ...newPost, util_count: 0, user_has_util: false } as PostWithUtil]],
                  pageParams: [undefined],
                }
              }
              const newFirstPage = [
                { ...newPost, util_count: 0, user_has_util: false } as PostWithUtil,
                ...old.pages[0],
              ]
              return { ...old, pages: [newFirstPage, ...old.pages.slice(1)] }
            }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}

export function useRealtimePostUtil(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('post_util:changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_util',
        },
        (payload) => {
          updateUtilCount(qc, payload.new.post_id as string, 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'post_util',
        },
        (payload) => {
          updateUtilCount(qc, payload.old.post_id as string, -1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}

function updateUtilCount(qc: ReturnType<typeof useQueryClient>, postId: string, delta: number) {
  qc.setQueriesData<{ pages: PostWithUtil[][] }>(
    { queryKey: ['posts', 'feed'] },
    (old) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page) =>
          page.map((p) =>
            p.id === postId
              ? { ...p, util_count: p.util_count + delta }
              : p
          )
        ),
      }
    }
  )
}
