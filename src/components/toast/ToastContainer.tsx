import { useToasts } from '@/lib/hooks/useToast'
import { ToastItem } from './Toast'

export function ToastContainer() {
  const toasts = useToasts()
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 lg:bottom-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
