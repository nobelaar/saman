import { Link } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Button } from '@/components/ui/button'

interface Props {
  user?: AuthUser | null
  onLogout?: () => void
}

export function Navbar({ user, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <nav className="container flex h-14 items-center justify-between gap-2">
        <Link to="/" className="text-base font-bold tracking-tight">
          Acopio
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium hover:bg-accent"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}