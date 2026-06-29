import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Home, Search, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchOverlay } from '@/components/common/SearchOverlay'

interface Props {
  user: AuthUser | null
}

export function MobileBottomBar({ user }: Props) {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const hideOn = ['/login', '/registro']
  if (hideOn.includes(location.pathname)) return null

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        <Tab to="/" icon={Home} label="Inicio" />
        <Tab to="/centros" icon={Search} label="Buscar" />
        <Tab
          to={user ? '/anuncio/nuevo' : '/login?redirect=/anuncio/nuevo'}
          icon={PlusCircle}
          label="Publicar"
        />
        <Tab
          to={user ? '/perfil' : '/login'}
          icon={User}
          label={user ? 'Perfil' : 'Entrar'}
        />
      </nav>
    </>
  )
}

function Tab({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={22}
            strokeWidth={isActive ? 2.5 : 2}
            className={cn(isActive && 'text-primary')}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
