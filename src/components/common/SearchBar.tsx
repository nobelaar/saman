import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Buscar por nombre o ciudad…' }: Props) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="relative w-full">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <Input
        className="pl-9"
        value={local}
        onChange={(e) => {
          setLocal(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={placeholder}
      />
    </div>
  )
}
