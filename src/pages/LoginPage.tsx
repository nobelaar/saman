import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { resendConfirmationEmail, signIn } from '@/features/auth/session'

type Estado = 'form' | 'sin-confirmar'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [estado, setEstado] = useState<Estado>('form')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.needsEmailConfirm) {
      setEstado('sin-confirmar')
      return
    }
    if (result.error) {
      setError('Credenciales inválidas')
      return
    }
    navigate('/')
  }

  async function handleResend() {
    setResending(true)
    setResendMsg(null)
    const { error } = await resendConfirmationEmail(email)
    setResending(false)
    setResendMsg(error ? 'No se pudo reenviar el correo.' : 'Te reenviamos el correo de confirmación.')
  }

  if (estado === 'sin-confirmar') {
    return (
      <div className="mx-auto max-w-[400px] space-y-6 px-6 py-16">
        <h1 className="text-xl font-bold">Confirma tu correo</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Tu cuenta aun no esta activada. Revisa tu correo
          {email ? <><strong className="text-foreground"> {email}</strong> </> : null}
          y hace clic en el enlace de confirmacion para activarla.
        </p>
        {resendMsg && <p className="text-sm text-primary">{resendMsg}</p>}
        <Button type="button" variant="outline" onClick={handleResend} disabled={resending} className="w-full h-[52px] rounded-xl">
          {resending ? 'Enviando...' : 'Reenviar correo de confirmacion'}
        </Button>
        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={() => setEstado('form')}
            className="text-muted-foreground underline"
          >
            Volver
          </button>
          <Link to="/registro" className="font-medium text-primary underline">
            Crear cuenta
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[400px] space-y-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Iniciar sesion</h1>
        <p className="text-[15px] text-muted-foreground">Continua para publicar</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-[13px]">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-[52px] rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-[13px]">Contrasena</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="h-[52px] rounded-xl"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full h-[52px] rounded-xl">
          {submitting ? 'Entrando...' : 'Iniciar sesion'}
        </Button>
      </form>
      <p className="text-center text-[13px] text-muted-foreground">
        No tenes cuenta?{' '}
        <Link to="/registro" className="font-medium text-primary hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}