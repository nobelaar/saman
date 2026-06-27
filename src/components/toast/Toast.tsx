import { Check, X, Info } from 'lucide-react'
import type { Toast as ToastType } from '@/lib/hooks/useToast'

const icons = {
  success: Check,
  error: X,
  info: Info,
}

export function ToastItem({ toast }: { toast: ToastType }) {
  const Icon = icons[toast.type]
  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm shadow-lg">
      <Icon size={16} className="shrink-0 text-primary" />
      <span>{toast.message}</span>
    </div>
  )
}
