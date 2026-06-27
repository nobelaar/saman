import { useState } from 'react'
import { NECESIDADES_PREDEFINIDAS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

export function NecesidadesSelector({ value, onChange }: Props) {
  const [custom, setCustom] = useState('')

  const toggle = (item: string) => {
    if (value.includes(item)) onChange(value.filter((v) => v !== item))
    else onChange([...value, item])
  }

  const addCustom = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const trimmed = custom.trim()
    if (!trimmed) {
      setCustom('')
      return
    }
    if (!value.includes(trimmed)) onChange([...value, trimmed])
    setCustom('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {NECESIDADES_PREDEFINIDAS.map((n) => {
          const active = value.includes(n)
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(n)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input hover:bg-accent'
              )}
            >
              {n}
            </button>
          )
        })}
        {value
          .filter((v) => !NECESIDADES_PREDEFINIDAS.includes(v as (typeof NECESIDADES_PREDEFINIDAS)[number]))
          .map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed="true"
              onClick={() => toggle(v)}
              className="rounded-full border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            >
              {v}
            </button>
          ))}
      </div>
      <input
        type="text"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        onKeyDown={addCustom}
        placeholder="Otra necesidad… (Enter para agregar)"
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}