import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(text: string, max = 90): string {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}
