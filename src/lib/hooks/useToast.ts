import { useState, useCallback, useEffect } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastId = 0

const listeners = new Set<(toasts: Toast[]) => void>()
let currentToasts: Toast[] = []

function notify() {
  listeners.forEach((fn) => fn(currentToasts))
}

export function addToast(message: string, type: Toast['type'] = 'info') {
  const id = String(++toastId)
  currentToasts = [...currentToasts, { id, message, type }]
  notify()
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id)
    notify()
  }, 3000)
}

export function useToasts(): Toast[] {
  const [toasts, setToasts] = useState<Toast[]>(currentToasts)
  const subscribe = useCallback((fn: (t: Toast[]) => void): (() => void) => {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])

  useEffect(() => {
    const unsub = subscribe(setToasts)
    return unsub
  }, [subscribe])

  return toasts
}
