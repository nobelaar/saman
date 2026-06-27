import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { resendConfirmationEmail, signUp } from '@/features/auth/session'

type Estado = 'form' | 'confirmacion'

export function RegistroPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [estado, setEstado] = useState<Estado>('form')
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await signUp(email, password)
    setSubmitting(false)
    if (result.error) {
      setError('No se pudo crear la cuenta. Verificá los datos.')
      return
    }
    if (result.needsEmailConfirm) {
      setEstado('confirmacion')
      return
    }
    navigate('/')
  }

  async function handleResend() {
    setResending(true)
    setResendMsg(null)
    const { error } = await resendConfirmationEmail(email)
    setResending(false)
    setResendMsg(error ? 'No se pudo reenviar el correo.' : 'Te enviamos otro correo de confirmación.')
  }

  if (estado === 'confirmacion') {
    return (
      <div className="mx-auto max-w-[400px] space-y-6 px-6 py-16">
        <h1 className="text-xl font-bold">Revisa tu correo</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Hemos enviado un correo de confirmacion a <strong className="text-foreground">{email}</strong>. Hace
          clic en el enlace del correo para activar tu cuenta y poder registrar tu
          centro de acopio.
        </p>
        <p className="text-[13px] text-muted-foreground">
          Si no lo recibiste en unos minutos, revisa la carpeta de spam.
        </p>
        {resendMsg && <p className="text-sm text-primary">{resendMsg}</p>}
        <Button type="button" variant="outline" onClick={handleResend} disabled={resending} className="w-full h-[52px] rounded-xl">
          {resending ? 'Enviando...' : 'Reenviar correo'}
        </Button>
        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={() => setEstado('form')}
            className="text-muted-foreground underline"
          >
            Modificar mis datos
          </button>
          <Link to="/login" className="font-medium text-primary underline">
            Iniciar sesion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[400px] space-y-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="text-[15px] text-muted-foreground">Registrate para crear centros de acopio</p>
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
            autoComplete="new-password"
            className="h-[52px] rounded-xl"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full h-[52px] rounded-xl">
          {submitting ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="text-center text-[13px] text-muted-foreground">
        Ya tenes cuenta?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Iniciar sesion
        </Link>
      </p>
    </div>
  )
}