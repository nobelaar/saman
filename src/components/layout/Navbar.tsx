import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Props {}

export function Navbar(_props: Props) {
  const location = useLocation()
  const isSubPage = location.pathname !== '/' && location.pathname !== '/centros'

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-black/95 backdrop-blur lg:hidden">
      <nav className="flex h-11 items-center px-4">
        {isSubPage ? (
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground" aria-label="Volver">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-[17px] font-bold">
              {getPageTitle(location.pathname)}
            </span>
          </div>
        ) : (
          <Link to="/" className="text-[17px] font-bold tracking-tight text-primary">
            Acopio
          </Link>
        )}
      </nav>
    </header>
  )
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/centros/nuevo')) return 'Nuevo centro'
  if (pathname.includes('/editar')) return 'Editar centro'
  if (pathname.startsWith('/centro/')) return 'Centro'
  if (pathname === '/login') return 'Iniciar sesion'
  if (pathname === '/registro') return 'Crear cuenta'
  return 'Acopio'
}
