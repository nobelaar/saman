export function PostSkeleton() {
  return (
    <div className="animate-pulse border-b border-border px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-secondary" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-secondary" />
          <div className="h-3 w-16 rounded bg-secondary" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded bg-secondary" />
        <div className="h-3.5 w-3/4 rounded bg-secondary" />
      </div>
      <div className="mt-3 h-48 w-full rounded-2xl bg-secondary" />
    </div>
  )
}

export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} />
      ))}
    </>
  )
}
