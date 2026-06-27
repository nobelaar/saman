import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { signIn } from '@/features/auth/session'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) {
      setError('Credenciales inválidas')
      return
    }
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 py-8">
      <h1 className="text-xl font-bold">Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className="font-medium text-primary underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}